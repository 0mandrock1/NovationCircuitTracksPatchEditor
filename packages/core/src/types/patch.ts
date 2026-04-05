/**
 * Full typed representation of a Circuit Tracks synth patch.
 *
 * Parameter ranges and byte offsets are derived from the
 * Novation Circuit Tracks Programmer's Reference Guide v3.
 *
 * Each interface maps 1:1 to a section of the 340-byte patch payload.
 */

// ---------------------------------------------------------------------------
// Oscillator
// ---------------------------------------------------------------------------

export type OscillatorWaveform =
  | 0 // Sine
  | 1 // Triangle
  | 2 // Sawtooth
  | 3 // Sawtooth (reverse)
  | 4 // Square / Pulse
  | 5 // PWM
  | 6 // Noise (white)
  | 7 // Noise (pink)
  | 8; // Sample & Hold

export interface OscillatorParams {
  waveform: OscillatorWaveform;
  /** Coarse tune: −24 to +24 semitones, stored as 0–96 (offset 24) */
  coarse: number;
  /** Fine tune: −50 to +50 cents, stored as 0–100 (offset 50) */
  fine: number;
  /** Oscillator level: 0–127 */
  level: number;
  /** Pulse width: 0–127 (only meaningful for Square/PWM) */
  pulseWidth: number;
  /** Virtual sync depth: 0–127 */
  virtualSync: number;
  /** Density (unison voices): 0–127 */
  density: number;
  /** Density detune: 0–127 */
  densityDetune: number;
  /** Pitch envelope depth: −64 to +63, stored as 0–127 (offset 64) */
  pitchEnvDepth: number;
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

export type FilterType =
  | 0 // Low-pass 12dB
  | 1 // Low-pass 24dB
  | 2 // High-pass 12dB
  | 3 // High-pass 24dB
  | 4 // Band-pass 12dB
  | 5; // Notch 12dB

export interface FilterParams {
  type: FilterType;
  /** Cutoff frequency: 0–127 */
  cutoff: number;
  /** Resonance: 0–127 */
  resonance: number;
  /** Drive/overdrive: 0–127 */
  drive: number;
  /** Envelope 1 depth: −64 to +63, stored as 0–127 */
  envDepth: number;
  /** Key tracking amount: 0–127 */
  keyTracking: number;
  /** Velocity sensitivity: 0–127 */
  velocitySensitivity: number;
}

// ---------------------------------------------------------------------------
// Envelope (ADSR — used for Env 1, 2, 3)
// ---------------------------------------------------------------------------

export interface EnvelopeParams {
  /** Attack time: 0–127 */
  attack: number;
  /** Decay time: 0–127 */
  decay: number;
  /** Sustain level: 0–127 */
  sustain: number;
  /** Release time: 0–127 */
  release: number;
  /** Velocity depth: −64 to +63, stored as 0–127 */
  velocityDepth: number;
  /** Loop mode: 0 = off, 1 = on */
  loop: 0 | 1;
}

// ---------------------------------------------------------------------------
// LFO (used for LFO 1, 2)
// ---------------------------------------------------------------------------

export type LfoWaveform =
  | 0 // Sine
  | 1 // Triangle
  | 2 // Sawtooth
  | 3 // Sawtooth (reverse)
  | 4 // Square
  | 5 // Random (S&H)
  | 6; // Smooth random

export interface LfoParams {
  waveform: LfoWaveform;
  /** Rate: 0–127 */
  rate: number;
  /** Sync to MIDI clock: 0 = off, 1 = on */
  sync: 0 | 1;
  /**
   * Sync rate when sync = 1.
   * 0 = 1/1, 1 = 1/2, 2 = 1/4, 3 = 1/8, 4 = 1/16, etc.
   */
  syncRate: number;
  /** Phase: 0–127 */
  phase: number;
  /** Slew (lag): 0–127 */
  slew: number;
  /** One-shot: 0 = loop, 1 = one-shot */
  oneShot: 0 | 1;
}

// ---------------------------------------------------------------------------
// Modulation Matrix
// ---------------------------------------------------------------------------

export type ModSource =
  | "none"
  | "env1"
  | "env2"
  | "env3"
  | "lfo1"
  | "lfo2"
  | "macro1"
  | "macro2"
  | "macro3"
  | "macro4"
  | "macro5"
  | "macro6"
  | "macro7"
  | "macro8"
  | "velocity"
  | "aftertouch"
  | "modWheel"
  | "pitchBend";

export type ModDestination =
  | "none"
  | "osc1Pitch"
  | "osc1PulseWidth"
  | "osc1Level"
  | "osc2Pitch"
  | "osc2PulseWidth"
  | "osc2Level"
  | "oscMix"
  | "noiseMix"
  | "ringModMix"
  | "filterCutoff"
  | "filterResonance"
  | "filterDrive"
  | "env1Attack"
  | "env1Decay"
  | "env1Sustain"
  | "env1Release"
  | "env2Attack"
  | "env2Decay"
  | "env2Sustain"
  | "env2Release"
  | "env3Attack"
  | "env3Decay"
  | "env3Sustain"
  | "env3Release"
  | "lfo1Rate"
  | "lfo2Rate"
  | "distortionLevel"
  | "chorusLevel"
  | "reverbLevel";

export interface ModMatrixSlot {
  source: ModSource;
  destination: ModDestination;
  /** Depth: −64 to +63, stored as 0–127 */
  depth: number;
}

// ---------------------------------------------------------------------------
// Macro Knobs
// ---------------------------------------------------------------------------

export interface MacroAssignment {
  destination: ModDestination;
  /** Depth: −64 to +63, stored as 0–127 */
  depth: number;
}

export interface MacroParams {
  name: string; // up to 15 chars
  value: number; // 0–127 (current knob position)
  assignments: MacroAssignment[]; // up to 4 assignments per macro
}

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

export interface DistortionParams {
  /** Pre/post filter: 0 = pre, 1 = post */
  position: 0 | 1;
  /** Type: 0 = Diode, 1 = Valves, 2 = Clipper, 3 = XOver, 4 = Rectifier, 5 = BitCrush */
  type: number;
  /** Drive amount: 0–127 */
  drive: number;
  /** Level: 0–127 */
  level: number;
}

export interface ChorusParams {
  /** Rate: 0–127 */
  rate: number;
  /** Depth: 0–127 */
  depth: number;
  /** Feedback: 0–127 */
  feedback: number;
  /** Level: 0–127 */
  level: number;
}

export interface ReverbParams {
  /** Room size: 0–127 */
  size: number;
  /** Decay time: 0–127 */
  decay: number;
  /** High-frequency damping: 0–127 */
  filter: number;
  /** Level: 0–127 */
  level: number;
}

export interface EffectsParams {
  distortion: DistortionParams;
  chorus: ChorusParams;
  reverb: ReverbParams;
}

// ---------------------------------------------------------------------------
// Voice / Arp
// ---------------------------------------------------------------------------

export type PolyphonyMode =
  | 0 // Mono
  | 1 // Mono AG (auto-glide)
  | 2; // Poly

export interface VoiceParams {
  polyphonyMode: PolyphonyMode;
  /** Portamento time: 0–127 */
  portamentoTime: number;
  /** Pre-glide amount: 0–127 */
  preGlide: number;
  /** Keyboard octave: −2 to +2, stored as 0–4 */
  keyboardOctave: number;
}

export interface ArpParams {
  /** Enabled: 0 = off, 1 = on */
  enabled: 0 | 1;
  /** Rate (note value): 0–8 */
  rate: number;
  /** Gate: 0–127 */
  gate: number;
  /** Octave range: 1–4 */
  octaveRange: number;
  /** Pattern: 0 = Up, 1 = Down, 2 = Up/Down, 3 = Random, 4 = Chord */
  pattern: number;
}

// ---------------------------------------------------------------------------
// Root Patch Model
// ---------------------------------------------------------------------------

export interface CircuitTracksPatch {
  /** Patch name: up to 15 ASCII characters */
  name: string;
  voice: VoiceParams;
  oscillator1: OscillatorParams;
  oscillator2: OscillatorParams;
  /** Oscillator 1/2 mix: 0 = full Osc1, 127 = full Osc2 */
  oscMix: number;
  /** Noise level: 0–127 */
  noiseLevel: number;
  /** Ring mod level: 0–127 */
  ringModLevel: number;
  filter: FilterParams;
  /** Amp envelope uses Env 1 */
  envelope1: EnvelopeParams;
  envelope2: EnvelopeParams;
  envelope3: EnvelopeParams;
  lfo1: LfoParams;
  lfo2: LfoParams;
  /** 20 modulation matrix slots */
  modMatrix: [
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
  ];
  /** 8 assignable macro knobs */
  macros: [
    MacroParams,
    MacroParams,
    MacroParams,
    MacroParams,
    MacroParams,
    MacroParams,
    MacroParams,
    MacroParams,
  ];
  arp: ArpParams;
  effects: EffectsParams;
}

/** Metadata attached to a patch when stored in the library (not in SysEx) */
export interface PatchMeta {
  id: string;
  name: string;
  bank: string;
  slot: number;
  tags: string[];
  category: string;
  rating: number; // 0–5
  createdAt: string; // ISO 8601
  updatedAt: string;
  filePath: string; // path to .syx file on disk
}
