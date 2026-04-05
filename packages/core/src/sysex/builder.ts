/**
 * SysEx builder: CircuitTracksPatch → Uint8Array
 *
 * Encodes a patch model into a valid Circuit Tracks SysEx message.
 */

import { OFFSETS } from "../parameters/offsets.js";
import type { CircuitTracksPatch, MacroParams, ModMatrixSlot } from "../types/patch.js";
import type { ModDestination, ModSource } from "../types/patch.js";
import { CIRCUIT_TRACKS_HEADER, MessageType, PATCH_DATA_LENGTH, SYSEX_END } from "./constants.js";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a "Replace Patch" SysEx message (writes to flash, persists).
 *
 * @param patch - The patch to encode
 * @param synth - Which synth (1 or 2)
 * @param slot  - Patch slot 0–63
 */
export function buildReplacePatchMessage(
  patch: CircuitTracksPatch,
  synth: 1 | 2,
  slot: number
): Uint8Array {
  return buildPatchMessage(patch, MessageType.REPLACE_PATCH, synth, slot);
}

/**
 * Build a "Replace Current Patch" SysEx message (RAM only, immediate preview).
 */
export function buildReplaceCurrentPatchMessage(
  patch: CircuitTracksPatch,
  synth: 1 | 2
): Uint8Array {
  return buildPatchMessage(patch, MessageType.REPLACE_CURRENT_PATCH, synth, 0x00);
}

/**
 * Build a "Request Patch" SysEx message (asks device to send patch dump).
 */
export function buildRequestPatchMessage(synth: 1 | 2, slot: number): Uint8Array {
  return new Uint8Array([
    ...CIRCUIT_TRACKS_HEADER,
    MessageType.REQUEST_PATCH,
    synth === 1 ? 0x00 : 0x01,
    slot,
    SYSEX_END,
  ]);
}

/**
 * Build a "Request Current Patch" SysEx message.
 */
export function buildRequestCurrentPatchMessage(synth: 1 | 2): Uint8Array {
  return new Uint8Array([
    ...CIRCUIT_TRACKS_HEADER,
    MessageType.REQUEST_CURRENT_PATCH,
    synth === 1 ? 0x00 : 0x01,
    SYSEX_END,
  ]);
}

/**
 * Build a full 64-patch bank SysEx file (concatenated messages).
 * The array is intended to be sent with INTER_MESSAGE_DELAY_MS between each.
 */
export function buildBankMessages(patches: CircuitTracksPatch[], synth: 1 | 2): Uint8Array[] {
  return patches.map((patch, slot) => buildReplacePatchMessage(patch, synth, slot));
}

// ---------------------------------------------------------------------------
// Internal implementation
// ---------------------------------------------------------------------------

function buildPatchMessage(
  patch: CircuitTracksPatch,
  messageType: number,
  synth: 1 | 2,
  slot: number
): Uint8Array {
  const data = encodePayload(patch);
  const message = new Uint8Array(CIRCUIT_TRACKS_HEADER.length + 3 + PATCH_DATA_LENGTH + 1);
  let offset = 0;

  // Header
  message.set(CIRCUIT_TRACKS_HEADER, offset);
  offset += CIRCUIT_TRACKS_HEADER.length;

  // Message type, synth, slot
  message[offset++] = messageType;
  message[offset++] = synth === 1 ? 0x00 : 0x01;
  message[offset++] = slot;

  // Data payload
  message.set(data, offset);
  offset += PATCH_DATA_LENGTH;

  // SysEx end
  message[offset] = SYSEX_END;

  return message;
}

/**
 * Encode a CircuitTracksPatch into the raw 340-byte payload.
 * Exported for testing without full SysEx framing.
 */
export function encodePayload(patch: CircuitTracksPatch): Uint8Array {
  const data = new Uint8Array(PATCH_DATA_LENGTH);

  // Name: 15 bytes, ASCII, null-padded
  const nameBytes = new TextEncoder().encode(patch.name.slice(0, 15).padEnd(15, "\0"));
  data.set(nameBytes, OFFSETS.NAME_START);

  // Voice
  data[OFFSETS.VOICE_POLYPHONY_MODE] = patch.voice.polyphonyMode;
  data[OFFSETS.VOICE_PORTAMENTO_TIME] = patch.voice.portamentoTime;
  data[OFFSETS.VOICE_PRE_GLIDE] = patch.voice.preGlide;
  data[OFFSETS.VOICE_KEYBOARD_OCTAVE] = patch.voice.keyboardOctave;

  // Oscillators
  encodeOscillator(data, OFFSETS.OSC1_WAVEFORM, patch.oscillator1);
  encodeOscillator(data, OFFSETS.OSC2_WAVEFORM, patch.oscillator2);

  // Mixer
  data[OFFSETS.MIX_OSC_BALANCE] = patch.oscMix;
  data[OFFSETS.MIX_NOISE_LEVEL] = patch.noiseLevel;
  data[OFFSETS.MIX_RING_MOD_LEVEL] = patch.ringModLevel;

  // Filter
  data[OFFSETS.FILTER_TYPE] = patch.filter.type;
  data[OFFSETS.FILTER_CUTOFF] = patch.filter.cutoff;
  data[OFFSETS.FILTER_RESONANCE] = patch.filter.resonance;
  data[OFFSETS.FILTER_DRIVE] = patch.filter.drive;
  data[OFFSETS.FILTER_ENV_DEPTH] = patch.filter.envDepth;
  data[OFFSETS.FILTER_KEY_TRACKING] = patch.filter.keyTracking;
  data[OFFSETS.FILTER_VELOCITY] = patch.filter.velocitySensitivity;

  // Envelopes
  encodeEnvelope(data, OFFSETS.ENV1_ATTACK, patch.envelope1);
  encodeEnvelope(data, OFFSETS.ENV2_ATTACK, patch.envelope2);
  encodeEnvelope(data, OFFSETS.ENV3_ATTACK, patch.envelope3);

  // LFOs
  encodeLfo(data, OFFSETS.LFO1_WAVEFORM, patch.lfo1);
  encodeLfo(data, OFFSETS.LFO2_WAVEFORM, patch.lfo2);

  // Modulation matrix
  for (let i = 0; i < OFFSETS.MOD_MATRIX_SLOTS; i++) {
    const base = OFFSETS.MOD_MATRIX_START + i * OFFSETS.MOD_SLOT_STRIDE;
    const slot = patch.modMatrix[i] as ModMatrixSlot;
    data[base] = modSourceToByte(slot.source);
    data[base + 1] = modDestToByte(slot.destination);
    data[base + 2] = slot.depth;
  }

  // Macros
  for (let i = 0; i < OFFSETS.MACRO_SLOTS; i++) {
    const base = OFFSETS.MACRO_START + i * OFFSETS.MACRO_STRIDE;
    const macro = patch.macros[i] as MacroParams;
    data[base] = macro.value;
    // Assignments encoded at base+1..base+8 (4 × [dest, depth])
    for (let j = 0; j < Math.min(4, macro.assignments.length); j++) {
      const assign = macro.assignments[j];
      if (assign) {
        data[base + 1 + j * 2] = modDestToByte(assign.destination);
        data[base + 2 + j * 2] = assign.depth;
      }
    }
  }

  // Arp
  data[OFFSETS.ARP_ENABLED] = patch.arp.enabled;
  data[OFFSETS.ARP_RATE] = patch.arp.rate;
  data[OFFSETS.ARP_GATE] = patch.arp.gate;
  data[OFFSETS.ARP_OCTAVE_RANGE] = patch.arp.octaveRange;
  data[OFFSETS.ARP_PATTERN] = patch.arp.pattern;

  // Effects
  data[OFFSETS.FX_DIST_POSITION] = patch.effects.distortion.position;
  data[OFFSETS.FX_DIST_TYPE] = patch.effects.distortion.type;
  data[OFFSETS.FX_DIST_DRIVE] = patch.effects.distortion.drive;
  data[OFFSETS.FX_DIST_LEVEL] = patch.effects.distortion.level;
  data[OFFSETS.FX_CHORUS_RATE] = patch.effects.chorus.rate;
  data[OFFSETS.FX_CHORUS_DEPTH] = patch.effects.chorus.depth;
  data[OFFSETS.FX_CHORUS_FEEDBACK] = patch.effects.chorus.feedback;
  data[OFFSETS.FX_CHORUS_LEVEL] = patch.effects.chorus.level;
  data[OFFSETS.FX_REVERB_SIZE] = patch.effects.reverb.size;
  data[OFFSETS.FX_REVERB_DECAY] = patch.effects.reverb.decay;
  data[OFFSETS.FX_REVERB_FILTER] = patch.effects.reverb.filter;
  data[OFFSETS.FX_REVERB_LEVEL] = patch.effects.reverb.level;

  return data;
}

// ---------------------------------------------------------------------------
// Sub-encoders
// ---------------------------------------------------------------------------

function encodeOscillator(
  data: Uint8Array,
  base: number,
  osc: CircuitTracksPatch["oscillator1"]
): void {
  data[base] = osc.waveform;
  data[base + 1] = osc.coarse;
  data[base + 2] = osc.fine;
  data[base + 3] = osc.level;
  data[base + 4] = osc.pulseWidth;
  data[base + 5] = osc.virtualSync;
  data[base + 6] = osc.density;
  data[base + 7] = osc.densityDetune;
  data[base + 8] = osc.pitchEnvDepth;
}

function encodeEnvelope(
  data: Uint8Array,
  base: number,
  env: CircuitTracksPatch["envelope1"]
): void {
  data[base] = env.attack;
  data[base + 1] = env.decay;
  data[base + 2] = env.sustain;
  data[base + 3] = env.release;
  data[base + 4] = env.velocityDepth;
  data[base + 5] = env.loop;
}

function encodeLfo(data: Uint8Array, base: number, lfo: CircuitTracksPatch["lfo1"]): void {
  data[base] = lfo.waveform;
  data[base + 1] = lfo.rate;
  data[base + 2] = lfo.sync;
  data[base + 3] = lfo.syncRate;
  data[base + 4] = lfo.phase;
  data[base + 5] = lfo.slew;
  data[base + 6] = lfo.oneShot;
}

// ---------------------------------------------------------------------------
// Enum → byte lookups
// ---------------------------------------------------------------------------

const MOD_SOURCE_TO_BYTE: Record<ModSource, number> = {
  none: 0,
  env1: 1,
  env2: 2,
  env3: 3,
  lfo1: 4,
  lfo2: 5,
  macro1: 6,
  macro2: 7,
  macro3: 8,
  macro4: 9,
  macro5: 10,
  macro6: 11,
  macro7: 12,
  macro8: 13,
  velocity: 14,
  aftertouch: 15,
  modWheel: 16,
  pitchBend: 17,
};

const MOD_DEST_TO_BYTE: Record<ModDestination, number> = {
  none: 0,
  osc1Pitch: 1,
  osc1PulseWidth: 2,
  osc1Level: 3,
  osc2Pitch: 4,
  osc2PulseWidth: 5,
  osc2Level: 6,
  oscMix: 7,
  noiseMix: 8,
  ringModMix: 9,
  filterCutoff: 10,
  filterResonance: 11,
  filterDrive: 12,
  env1Attack: 13,
  env1Decay: 14,
  env1Sustain: 15,
  env1Release: 16,
  env2Attack: 17,
  env2Decay: 18,
  env2Sustain: 19,
  env2Release: 20,
  env3Attack: 21,
  env3Decay: 22,
  env3Sustain: 23,
  env3Release: 24,
  lfo1Rate: 25,
  lfo2Rate: 26,
  distortionLevel: 27,
  chorusLevel: 28,
  reverbLevel: 29,
};

function modSourceToByte(s: ModSource): number {
  return MOD_SOURCE_TO_BYTE[s] ?? 0;
}

function modDestToByte(d: ModDestination): number {
  return MOD_DEST_TO_BYTE[d] ?? 0;
}
