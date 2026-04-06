/**
 * CircuitSynth — Web Audio approximation of the Circuit Tracks synthesis engine.
 *
 * Not a pixel-perfect emulation, but covers:
 *   - 2 oscillators (waveform mapping, semitone/cent tuning, level)
 *   - White noise source
 *   - 6-mode biquad filter (LP/BP/HP, 12/24dB approximated)
 *   - Amp ADSR envelope
 *   - Filter ADSR envelope (depth via env2ToFreq)
 *   - LFO → filter cutoff modulation (waveforms 0-5)
 *   - Chorus (wet/dry with modulated delay)
 *   - Dynamics compressor to prevent clipping
 */

import type { CircuitTracksPatch, FilterType, OscWaveform } from "@circuit-tracks/core";

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

/** Map Circuit Tracks OSC waveform index → Web Audio OscillatorType */
function oscType(wave: OscWaveform): OscillatorType {
  // 0: Sine,  14: Sine Table
  if (wave === 0 || wave === 14) return "sine";
  // 1: Triangle,  17: Tri-Saw Blend
  if (wave === 1 || wave === 17) return "triangle";
  // 12: Pulse Width,  13: Square,  15: Analogue Pulse
  if (wave === 12 || wave === 13 || wave === 15) return "square";
  // Everything else: Sawtooth variants (2-11), Analogue Sync (16),
  // Digital (18-20), Vocal (21-26), Random (27-29)
  return "sawtooth";
}

/** MIDI note → frequency in Hz */
function midiHz(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

/** Raw 0-127 → filter cutoff Hz (20 Hz … 20 kHz, exponential) */
function cutoffHz(raw: number): number {
  return 20 * 1000 ** (raw / 127);
}

/** Raw 0-127 → filter Q (0.5 … 20) */
function resQ(raw: number): number {
  return 0.5 + (raw / 127) * 19.5;
}

/**
 * Raw 0-127 → envelope time in seconds.
 * Curve: 0 → 2 ms, 64 → ~700 ms, 127 → 6 s
 */
function envS(raw: number): number {
  if (raw === 0) return 0.002;
  return (raw / 127) ** 2.5 * 6;
}

/** Raw 0-127 → LFO frequency in Hz (0.05 … 20 Hz, exponential) */
function lfoHz(raw: number): number {
  return 0.05 * 400 ** (raw / 127);
}

/** Raw 0-127 bipolar → signed [-1, 1]. 64 = 0. */
function bipolar(raw: number): number {
  return (raw - 64) / 64;
}

// ---------------------------------------------------------------------------
// CircuitSynth
// ---------------------------------------------------------------------------

export class CircuitSynth {
  private ctx: AudioContext | null = null;

  /**
   * Play a one-shot preview note through the Web Audio engine.
   *
   * @param patch       Patch to synthesise
   * @param note        MIDI note number (default: middle C = 60)
   * @param velocity    MIDI velocity 1-127 (default: 100)
   * @param durationMs  Note-on duration in ms before release phase (default: 700)
   * @param onEnded     Called when the full note (including release) finishes
   */
  playNote(
    patch: CircuitTracksPatch,
    note = 60,
    velocity = 100,
    durationMs = 700,
    onEnded?: () => void,
  ): void {
    this.stop();

    const ctx = new AudioContext();
    this.ctx = ctx;
    const t0 = ctx.currentTime;
    const baseHz = midiHz(note);
    const velScale = velocity / 127;
    const durS = durationMs / 1000;

    // ── Amp envelope timings (needed for total duration) ──────────────────
    const aAtk = envS(patch.envelope1.attack);
    const aDcy = envS(patch.envelope1.decay);
    const aSus = patch.envelope1.sustain / 127;
    const aRel = envS(patch.envelope1.release);
    const totalS = durS + aRel + 0.1;

    // ── Oscillators ───────────────────────────────────────────────────────
    const osc1 = buildOsc(ctx, patch.oscillator1.wave, baseHz,
      patch.oscillator1.semitones, patch.oscillator1.cents);
    const osc1Gain = ctx.createGain();
    osc1Gain.gain.value = (patch.mixer.osc1Level / 127) * velScale;
    osc1.connect(osc1Gain);

    const osc2 = buildOsc(ctx, patch.oscillator2.wave, baseHz,
      patch.oscillator2.semitones, patch.oscillator2.cents);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = (patch.mixer.osc2Level / 127) * velScale;
    osc2.connect(osc2Gain);

    // ── Noise ─────────────────────────────────────────────────────────────
    const noise = buildNoise(ctx, totalS + 0.2);
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = (patch.mixer.noiseLevel / 127) * velScale * 0.25;
    noise.connect(noiseGain);

    // ── Filter ────────────────────────────────────────────────────────────
    const filter = ctx.createBiquadFilter();
    applyFilterType(filter, patch.filter.type);
    const baseCutoff = cutoffHz(patch.filter.frequency);
    filter.frequency.value = baseCutoff;
    filter.Q.value = resQ(patch.filter.resonance);

    // Filter envelope
    const fEnvDepth = bipolar(patch.filter.env2ToFreq); // -1 … +1
    if (Math.abs(fEnvDepth) > 0.02) {
      const fAtk = envS(patch.envelope2.attack);
      const fDcy = envS(patch.envelope2.decay);
      const fSus = patch.envelope2.sustain / 127;
      const fRel = envS(patch.envelope2.release);
      // Up to ±4 octaves mod
      const peakCutoff = clampCutoff(baseCutoff * 2 ** (fEnvDepth * 4));
      const susCutoff  = clampCutoff(baseCutoff + (peakCutoff - baseCutoff) * fSus);

      filter.frequency.setValueAtTime(baseCutoff, t0);
      filter.frequency.linearRampToValueAtTime(peakCutoff, t0 + fAtk);
      filter.frequency.linearRampToValueAtTime(susCutoff,  t0 + fAtk + fDcy);
      filter.frequency.setValueAtTime(susCutoff, t0 + durS);
      filter.frequency.linearRampToValueAtTime(baseCutoff, t0 + durS + fRel);
    }

    // ── LFO → filter cutoff ───────────────────────────────────────────────
    const lfoWave = patch.lfo1.waveform;
    if (lfoWave <= 5 && patch.lfo1.rate > 0) {
      const lfo = ctx.createOscillator();
      lfo.type = lfoOscType(lfoWave);
      lfo.frequency.value = lfoHz(patch.lfo1.rate);
      const lfoGain = ctx.createGain();
      // Depth is not stored explicitly in LFO params — use a fraction of base cutoff
      lfoGain.gain.value = baseCutoff * 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(t0);
      lfo.stop(t0 + totalS);
    }

    // ── Amp envelope ──────────────────────────────────────────────────────
    const ampEnv = ctx.createGain();
    ampEnv.gain.setValueAtTime(0.0001, t0);
    ampEnv.gain.linearRampToValueAtTime(1,    t0 + aAtk);
    ampEnv.gain.linearRampToValueAtTime(aSus, t0 + aAtk + aDcy);
    ampEnv.gain.setValueAtTime(aSus, t0 + durS);
    ampEnv.gain.linearRampToValueAtTime(0.0001, t0 + durS + aRel);

    // ── Chorus ────────────────────────────────────────────────────────────
    let preMaster: AudioNode = ampEnv;
    if (patch.fx.chorusLevel > 8) {
      preMaster = buildChorus(ctx, ampEnv, patch.fx.chorusLevel, patch.fx.chorusRate);
    }

    // ── Compressor + master ───────────────────────────────────────────────
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;

    const master = ctx.createGain();
    master.gain.value = 0.8;

    // ── Connect graph ─────────────────────────────────────────────────────
    osc1Gain.connect(filter);
    osc2Gain.connect(filter);
    noiseGain.connect(filter);
    filter.connect(ampEnv);
    preMaster.connect(comp);
    comp.connect(master);
    master.connect(ctx.destination);

    // ── Schedule start / stop ─────────────────────────────────────────────
    osc1.start(t0);  osc1.stop(t0 + totalS);
    osc2.start(t0);  osc2.stop(t0 + totalS);
    noise.start(t0); noise.stop(t0 + totalS);

    setTimeout(() => {
      ctx.close().catch(() => {});
      if (this.ctx === ctx) this.ctx = null;
      onEnded?.();
    }, totalS * 1000 + 50);
  }

  /** Immediately silence and clean up any playing note. */
  stop(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Builder helpers
// ---------------------------------------------------------------------------

function buildOsc(
  ctx: AudioContext,
  wave: OscWaveform,
  baseHz: number,
  semitones: number,
  cents: number,
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = oscType(wave);
  // Default 64 = 0 semitones / 0 cents (per parser defaults)
  const semiOffset = semitones - 64;
  const centOffset = cents - 64;
  osc.frequency.value = baseHz * 2 ** (semiOffset / 12);
  osc.detune.value = centOffset;
  return osc;
}

function buildNoise(ctx: AudioContext, durationS: number): AudioBufferSourceNode {
  const len = Math.ceil(ctx.sampleRate * Math.min(durationS, 3));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function applyFilterType(f: BiquadFilterNode, type: FilterType): void {
  if (type === 0 || type === 1) f.type = "lowpass";
  else if (type === 2 || type === 3) f.type = "bandpass";
  else f.type = "highpass";
}

function lfoOscType(wave: number): OscillatorType {
  if (wave === 0) return "sine";
  if (wave === 1) return "triangle";
  if (wave === 2) return "sawtooth";
  return "square"; // 3: square, 4-5: S&H approximated as square
}

function clampCutoff(hz: number): number {
  return Math.max(20, Math.min(20000, hz));
}

/**
 * Simple chorus: modulated delay line mixed 50/50 with dry signal.
 * Returns the wet+dry mix node (connect it downstream of ampEnv).
 */
function buildChorus(
  ctx: AudioContext,
  source: AudioNode,
  level: number,
  rate: number,
): AudioNode {
  const wetLevel = (level / 127) * 0.5;
  const baseDelay = 0.006; // 6 ms base delay

  const delay = ctx.createDelay(0.03);
  delay.delayTime.value = baseDelay;

  // Modulate the delay time with a slow sine
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.2 + (rate / 127) * 1.8; // 0.2–2 Hz
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.003; // ±3 ms depth
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);
  lfo.start();

  const dryGain = ctx.createGain();
  dryGain.gain.value = 1 - wetLevel * 0.3;
  const wetGain = ctx.createGain();
  wetGain.gain.value = wetLevel;

  const mix = ctx.createGain();
  mix.gain.value = 1;

  source.connect(dryGain);
  source.connect(delay);
  delay.connect(wetGain);
  dryGain.connect(mix);
  wetGain.connect(mix);

  return mix;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const synth = new CircuitSynth();
