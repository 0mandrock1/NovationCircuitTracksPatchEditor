/**
 * SysEx builder: CircuitTracksPatch → Uint8Array
 *
 * Produces valid 350-byte Circuit Tracks SysEx messages.
 * No 7-bit packing — values are stored as raw bytes.
 */

import * as O from "../parameters/offsets.js";
import type { CircuitTracksPatch, LfoFlags, MacroKnob, ModMatrixSlot } from "../types/patch.js";
import {
  CIRCUIT_TRACKS_HEADER,
  PATCH_DATA_LENGTH,
  PATCH_SYSEX_LENGTH,
  SYNTH_1,
  SYSEX_END,
  SysExCommand,
} from "./constants.js";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a Replace Current Patch SysEx message (RAM, audible immediately).
 * 350 bytes total.
 */
export function buildReplaceCurrentPatchMessage(
  patch: CircuitTracksPatch,
  synth: 1 | 2
): Uint8Array {
  const data = encodePayload(patch);
  return frameMessage(SysExCommand.REPLACE_CURRENT_PATCH, synth === 1 ? SYNTH_1 : 0x01, 0, data);
}

/**
 * Build a Replace Patch SysEx message for a specific slot.
 *
 * NOTE: The true REPLACE_PATCH (0x01) command uses a 5-byte command section
 * (command_id + 2-byte little-endian pack_index + patch_index + reserved),
 * producing a 352-byte message — different from the standard 350-byte format.
 * Until hardware testing confirms the exact encoding in Phase 2, this function
 * produces a 350-byte REPLACE_CURRENT_PATCH message (same as all .syx files
 * in the wild, per ctpatch.py convention). The slot parameter is preserved for
 * when the flash-write variant is fully implemented.
 *
 * @param slot - patch slot 0–63 (stored for future flash-write implementation)
 */
export function buildReplacePatchMessage(
  patch: CircuitTracksPatch,
  synth: 1 | 2,
  _slot: number
): Uint8Array {
  // Use REPLACE_CURRENT_PATCH format (350 bytes) — compatible with all SysEx tools
  return buildReplaceCurrentPatchMessage(patch, synth);
}

/**
 * Build a Request Current Patch Dump message.
 * Device responds with a Replace Current Patch message.
 */
export function buildRequestCurrentPatchMessage(synth: 1 | 2): Uint8Array {
  return new Uint8Array([
    ...CIRCUIT_TRACKS_HEADER,
    SysExCommand.REQUEST_DUMP_CURRENT_PATCH,
    synth === 1 ? SYNTH_1 : 0x01,
    SYSEX_END,
  ]);
}

/**
 * Build 64 Replace Patch SysEx messages for a full bank.
 * Send each with INTER_MESSAGE_DELAY_MS gap between them.
 */
export function buildBankMessages(patches: CircuitTracksPatch[], synth: 1 | 2): Uint8Array[] {
  return patches.map((patch, slot) => buildReplacePatchMessage(patch, synth, slot));
}

// ---------------------------------------------------------------------------
// Frame assembly
// ---------------------------------------------------------------------------

function frameMessage(
  commandId: number,
  location: number,
  reserved: number,
  data: Uint8Array
): Uint8Array {
  const msg = new Uint8Array(PATCH_SYSEX_LENGTH);
  let i = 0;
  for (const b of CIRCUIT_TRACKS_HEADER) msg[i++] = b;
  msg[i++] = commandId;
  msg[i++] = location;
  msg[i++] = reserved;
  msg.set(data, i);
  msg[PATCH_SYSEX_LENGTH - 1] = SYSEX_END;
  return msg;
}

// ---------------------------------------------------------------------------
// Payload encoder — maps CircuitTracksPatch → 340-byte data array
// ---------------------------------------------------------------------------

export function encodePayload(patch: CircuitTracksPatch): Uint8Array {
  const d = new Uint8Array(PATCH_DATA_LENGTH);

  // --- Meta ---
  const nameBytes = new TextEncoder().encode(patch.name.slice(0, O.NAME_LENGTH));
  d.set(nameBytes, O.NAME_START);
  // Pad remaining name bytes with spaces (0x20)
  for (let i = nameBytes.length; i < O.NAME_LENGTH; i++) d[O.NAME_START + i] = 0x20;
  d[O.CATEGORY] = patch.category;
  d[O.GENRE] = patch.genre;
  // Reserved 14 bytes (18–31): left as 0x00

  // --- Voice ---
  d[O.VOICE_POLYPHONY_MODE] = patch.voice.polyphonyMode;
  d[O.VOICE_PORTAMENTO_RATE] = patch.voice.portamentoRate;
  d[O.VOICE_PRE_GLIDE] = patch.voice.preGlide;
  d[O.VOICE_KEYBOARD_OCTAVE] = patch.voice.keyboardOctave;

  // --- Oscillators ---
  encodeOsc(d, O.OSC1_START, patch.oscillator1);
  encodeOsc(d, O.OSC2_START, patch.oscillator2);

  // --- Mixer ---
  d[O.MIXER_OSC1_LEVEL] = patch.mixer.osc1Level;
  d[O.MIXER_OSC2_LEVEL] = patch.mixer.osc2Level;
  d[O.MIXER_RING_MOD_LEVEL] = patch.mixer.ringModLevel;
  d[O.MIXER_NOISE_LEVEL] = patch.mixer.noiseLevel;
  d[O.MIXER_PRE_FX_LEVEL] = patch.mixer.preFxLevel;
  d[O.MIXER_POST_FX_LEVEL] = patch.mixer.postFxLevel;

  // --- Filter ---
  d[O.FILTER_ROUTING] = patch.filter.routing;
  d[O.FILTER_DRIVE] = patch.filter.drive;
  d[O.FILTER_DRIVE_TYPE] = patch.filter.driveType;
  d[O.FILTER_TYPE] = patch.filter.type;
  d[O.FILTER_FREQUENCY] = patch.filter.frequency;
  d[O.FILTER_TRACK] = patch.filter.track;
  d[O.FILTER_RESONANCE] = patch.filter.resonance;
  d[O.FILTER_Q_NORMALISE] = patch.filter.qNormalise;
  d[O.FILTER_ENV2_TO_FREQ] = patch.filter.env2ToFreq;

  // --- Envelopes ---
  encodeEnv(d, O.ENV1_START, patch.envelope1);
  encodeEnv(d, O.ENV2_START, patch.envelope2);
  encodeEnv(d, O.ENV3_START, patch.envelope3);

  // --- LFOs ---
  encodeLfo(d, O.LFO1_START, patch.lfo1);
  encodeLfo(d, O.LFO2_START, patch.lfo2);

  // --- FX ---
  d[O.FX_DIST_LEVEL] = patch.fx.distortionLevel;
  d[O.FX_RESERVED_1] = 0;
  d[O.FX_CHORUS_LEVEL] = patch.fx.chorusLevel;
  d[O.FX_RESERVED_2] = 0;
  d[O.FX_RESERVED_3] = 0;
  d[O.FX_EQ_BASS_FREQ] = patch.fx.eqBassFrequency;
  d[O.FX_EQ_BASS_LEVEL] = patch.fx.eqBassLevel;
  d[O.FX_EQ_MID_FREQ] = patch.fx.eqMidFrequency;
  d[O.FX_EQ_MID_LEVEL] = patch.fx.eqMidLevel;
  d[O.FX_EQ_TREBLE_FREQ] = patch.fx.eqTrebleFrequency;
  d[O.FX_EQ_TREBLE_LEVEL] = patch.fx.eqTrebleLevel;
  // Reserved 5 bytes at FX_RESERVED_4_8 (111–115): left as 0x00
  d[O.FX_DIST_TYPE] = patch.fx.distortionType;
  d[O.FX_DIST_COMPENSATION] = patch.fx.distortionCompensation;
  d[O.FX_CHORUS_TYPE] = patch.fx.chorusType;
  d[O.FX_CHORUS_RATE] = patch.fx.chorusRate;
  d[O.FX_CHORUS_RATE_SYNC] = patch.fx.chorusRateSync;
  d[O.FX_CHORUS_FEEDBACK] = patch.fx.chorusFeedback;
  d[O.FX_CHORUS_MOD_DEPTH] = patch.fx.chorusModDepth;
  d[O.FX_CHORUS_DELAY] = patch.fx.chorusDelay;

  // --- Mod matrix ---
  for (let i = 0; i < O.MOD_MATRIX_SLOTS; i++) {
    const base = O.MOD_MATRIX_START + i * O.MOD_MATRIX_STRIDE;
    const slot = patch.modMatrix[i] as ModMatrixSlot;
    d[base + O.MOD_SLOT_SOURCE1] = slot.source1;
    d[base + O.MOD_SLOT_SOURCE2] = slot.source2;
    d[base + O.MOD_SLOT_DEPTH] = slot.depth;
    d[base + O.MOD_SLOT_DESTINATION] = slot.destination;
  }

  // --- Macro knobs ---
  for (let i = 0; i < O.MACRO_SLOTS; i++) {
    const base = O.MACRO_START + i * O.MACRO_STRIDE;
    const macro = patch.macroKnobs[i] as MacroKnob;
    d[base] = macro.position;
    for (let r = 0; r < O.MACRO_RANGES_PER_KNOB; r++) {
      const rb = base + 1 + r * O.MACRO_RANGE_STRIDE;
      const range = macro.ranges[r];
      if (range) {
        d[rb + O.RANGE_DESTINATION] = range.destination;
        d[rb + O.RANGE_START_POS] = range.startPos;
        d[rb + O.RANGE_END_POS] = range.endPos;
        d[rb + O.RANGE_DEPTH] = range.depth;
      }
    }
  }

  return d;
}

// ---------------------------------------------------------------------------
// Sub-encoders
// ---------------------------------------------------------------------------

function encodeOsc(d: Uint8Array, base: number, osc: CircuitTracksPatch["oscillator1"]): void {
  d[base + 0] = osc.wave;
  d[base + 1] = osc.waveInterpolate;
  d[base + 2] = osc.pulseWidthIndex;
  d[base + 3] = osc.virtualSyncDepth;
  d[base + 4] = osc.density;
  d[base + 5] = osc.densityDetune;
  d[base + 6] = osc.semitones;
  d[base + 7] = osc.cents;
  d[base + 8] = osc.pitchBend;
}

function encodeEnv(d: Uint8Array, base: number, env: CircuitTracksPatch["envelope1"]): void {
  d[base + 0] = env.velocityOrDelay;
  d[base + 1] = env.attack;
  d[base + 2] = env.decay;
  d[base + 3] = env.sustain;
  d[base + 4] = env.release;
}

function encodeLfo(d: Uint8Array, base: number, lfo: CircuitTracksPatch["lfo1"]): void {
  d[base + 0] = lfo.waveform;
  d[base + 1] = lfo.phaseOffset;
  d[base + 2] = lfo.slewRate;
  d[base + 3] = lfo.delay;
  d[base + 4] = lfo.delaySync;
  d[base + 5] = lfo.rate;
  d[base + 6] = lfo.rateSync;
  d[base + 7] = encodeLfoFlags(lfo.flags);
}

function encodeLfoFlags(flags: LfoFlags): number {
  let b = 0;
  if (flags.oneShot) b |= 0x01;
  if (flags.keySync) b |= 0x02;
  if (flags.commonSync) b |= 0x04;
  if (flags.delayTrigger) b |= 0x08;
  b |= (flags.fadeMode & 0x0f) << 4;
  return b;
}
