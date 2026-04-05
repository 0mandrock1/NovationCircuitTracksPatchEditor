/**
 * SysEx parser: Uint8Array → CircuitTracksPatch
 *
 * Parses the 340-byte data payload from a Circuit Tracks patch dump SysEx message.
 * Full implementation in Phase 1 — this stub establishes the interface and structure.
 */

import { OFFSETS } from "../parameters/offsets.js";
import type { CircuitTracksPatch, MacroParams, ModMatrixSlot } from "../types/patch.js";
import { CIRCUIT_TRACKS_HEADER, MessageType, PATCH_DATA_LENGTH } from "./constants.js";
import { defaultPatch } from "./defaults.js";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export class SysExParseError extends Error {
  constructor(message: string) {
    super(`SysEx parse error: ${message}`);
    this.name = "SysExParseError";
  }
}

/** Verify the 5-byte Circuit Tracks header is present */
function validateHeader(bytes: Uint8Array): void {
  if (bytes.length < CIRCUIT_TRACKS_HEADER.length) {
    throw new SysExParseError("Message too short to contain Circuit Tracks header");
  }
  for (let i = 0; i < CIRCUIT_TRACKS_HEADER.length; i++) {
    if (bytes[i] !== CIRCUIT_TRACKS_HEADER[i]) {
      throw new SysExParseError(
        `Header mismatch at byte ${i}: expected 0x${CIRCUIT_TRACKS_HEADER[i]?.toString(16)}, got 0x${bytes[i]?.toString(16)}`
      );
    }
  }
}

/** Extract and validate the data payload from a full SysEx message */
export function extractPayload(sysexMessage: Uint8Array): {
  messageType: number;
  synth: number;
  slot: number;
  data: Uint8Array;
} {
  validateHeader(sysexMessage);

  const messageType = sysexMessage[5];
  if (messageType === undefined) throw new SysExParseError("Missing message type byte");

  const synth = sysexMessage[6];
  if (synth === undefined) throw new SysExParseError("Missing synth index byte");

  const slot = sysexMessage[7];
  if (slot === undefined) throw new SysExParseError("Missing slot byte");

  // Data starts at byte 8, ends before the final F7
  const data = sysexMessage.slice(8, sysexMessage.length - 1);

  if (data.length !== PATCH_DATA_LENGTH) {
    throw new SysExParseError(`Expected ${PATCH_DATA_LENGTH} data bytes, got ${data.length}`);
  }

  return { messageType: messageType as number, synth: synth as number, slot: slot as number, data };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a full patch dump SysEx message into a typed CircuitTracksPatch.
 *
 * @param sysexMessage - Complete SysEx bytes including F0 header and F7 terminator
 */
export function parsePatchSysEx(sysexMessage: Uint8Array): {
  patch: CircuitTracksPatch;
  synth: 1 | 2;
  slot: number;
} {
  const { messageType, synth, slot, data } = extractPayload(sysexMessage);

  if (
    messageType !== MessageType.REPLACE_CURRENT_PATCH &&
    messageType !== MessageType.REPLACE_PATCH
  ) {
    throw new SysExParseError(
      `Unexpected message type 0x${messageType.toString(16)} — expected patch dump`
    );
  }

  const patch = parsePayload(data);
  return { patch, synth: synth === 0 ? 1 : 2, slot };
}

/**
 * Parse the raw 340-byte payload into a CircuitTracksPatch.
 * Exported for testing without SysEx framing.
 */
export function parsePayload(data: Uint8Array): CircuitTracksPatch {
  const patch = defaultPatch();

  // Name (15 ASCII bytes, strip nulls)
  const nameBytes = data.slice(OFFSETS.NAME_START, OFFSETS.NAME_START + OFFSETS.NAME_LENGTH);
  patch.name = Array.from(nameBytes)
    .map((b) => (b > 0 ? String.fromCharCode(b) : ""))
    .join("")
    .trimEnd();

  // Voice
  patch.voice.polyphonyMode = clamp(data[OFFSETS.VOICE_POLYPHONY_MODE] ?? 0, 0, 2) as 0 | 1 | 2;
  patch.voice.portamentoTime = clamp(data[OFFSETS.VOICE_PORTAMENTO_TIME] ?? 0, 0, 127);
  patch.voice.preGlide = clamp(data[OFFSETS.VOICE_PRE_GLIDE] ?? 0, 0, 127);
  patch.voice.keyboardOctave = clamp(data[OFFSETS.VOICE_KEYBOARD_OCTAVE] ?? 2, 0, 4);

  // Oscillator 1
  patch.oscillator1 = parseOscillator(data, OFFSETS.OSC1_WAVEFORM);

  // Oscillator 2
  patch.oscillator2 = parseOscillator(data, OFFSETS.OSC2_WAVEFORM);

  // Mixer
  patch.oscMix = clamp(data[OFFSETS.MIX_OSC_BALANCE] ?? 0, 0, 127);
  patch.noiseLevel = clamp(data[OFFSETS.MIX_NOISE_LEVEL] ?? 0, 0, 127);
  patch.ringModLevel = clamp(data[OFFSETS.MIX_RING_MOD_LEVEL] ?? 0, 0, 127);

  // Filter
  patch.filter.type = clamp(data[OFFSETS.FILTER_TYPE] ?? 0, 0, 5) as 0 | 1 | 2 | 3 | 4 | 5;
  patch.filter.cutoff = clamp(data[OFFSETS.FILTER_CUTOFF] ?? 127, 0, 127);
  patch.filter.resonance = clamp(data[OFFSETS.FILTER_RESONANCE] ?? 0, 0, 127);
  patch.filter.drive = clamp(data[OFFSETS.FILTER_DRIVE] ?? 0, 0, 127);
  patch.filter.envDepth = clamp(data[OFFSETS.FILTER_ENV_DEPTH] ?? 64, 0, 127);
  patch.filter.keyTracking = clamp(data[OFFSETS.FILTER_KEY_TRACKING] ?? 0, 0, 127);
  patch.filter.velocitySensitivity = clamp(data[OFFSETS.FILTER_VELOCITY] ?? 0, 0, 127);

  // Envelopes
  patch.envelope1 = parseEnvelope(data, OFFSETS.ENV1_ATTACK);
  patch.envelope2 = parseEnvelope(data, OFFSETS.ENV2_ATTACK);
  patch.envelope3 = parseEnvelope(data, OFFSETS.ENV3_ATTACK);

  // LFOs
  patch.lfo1 = parseLfo(data, OFFSETS.LFO1_WAVEFORM);
  patch.lfo2 = parseLfo(data, OFFSETS.LFO2_WAVEFORM);

  // Modulation matrix
  for (let i = 0; i < OFFSETS.MOD_MATRIX_SLOTS; i++) {
    const base = OFFSETS.MOD_MATRIX_START + i * OFFSETS.MOD_SLOT_STRIDE;
    const slot = patch.modMatrix[i] as ModMatrixSlot;
    slot.source = modSourceFromByte(data[base] ?? 0);
    slot.destination = modDestFromByte(data[base + 1] ?? 0);
    slot.depth = clamp(data[base + 2] ?? 64, 0, 127);
  }

  // Macros (simplified — full decode in Phase 1)
  for (let i = 0; i < OFFSETS.MACRO_SLOTS; i++) {
    const base = OFFSETS.MACRO_START + i * OFFSETS.MACRO_STRIDE;
    const macro = patch.macros[i] as MacroParams;
    macro.value = clamp(data[base] ?? 64, 0, 127);
  }

  // Arp
  patch.arp.enabled = ((data[OFFSETS.ARP_ENABLED] ?? 0) > 0 ? 1 : 0) as 0 | 1;
  patch.arp.rate = clamp(data[OFFSETS.ARP_RATE] ?? 2, 0, 8);
  patch.arp.gate = clamp(data[OFFSETS.ARP_GATE] ?? 64, 0, 127);
  patch.arp.octaveRange = clamp(data[OFFSETS.ARP_OCTAVE_RANGE] ?? 1, 1, 4);
  patch.arp.pattern = clamp(data[OFFSETS.ARP_PATTERN] ?? 0, 0, 4);

  // Effects
  patch.effects.distortion.position = (data[OFFSETS.FX_DIST_POSITION] ?? 0) as 0 | 1;
  patch.effects.distortion.type = clamp(data[OFFSETS.FX_DIST_TYPE] ?? 0, 0, 5);
  patch.effects.distortion.drive = clamp(data[OFFSETS.FX_DIST_DRIVE] ?? 0, 0, 127);
  patch.effects.distortion.level = clamp(data[OFFSETS.FX_DIST_LEVEL] ?? 0, 0, 127);
  patch.effects.chorus.rate = clamp(data[OFFSETS.FX_CHORUS_RATE] ?? 64, 0, 127);
  patch.effects.chorus.depth = clamp(data[OFFSETS.FX_CHORUS_DEPTH] ?? 0, 0, 127);
  patch.effects.chorus.feedback = clamp(data[OFFSETS.FX_CHORUS_FEEDBACK] ?? 0, 0, 127);
  patch.effects.chorus.level = clamp(data[OFFSETS.FX_CHORUS_LEVEL] ?? 0, 0, 127);
  patch.effects.reverb.size = clamp(data[OFFSETS.FX_REVERB_SIZE] ?? 64, 0, 127);
  patch.effects.reverb.decay = clamp(data[OFFSETS.FX_REVERB_DECAY] ?? 64, 0, 127);
  patch.effects.reverb.filter = clamp(data[OFFSETS.FX_REVERB_FILTER] ?? 64, 0, 127);
  patch.effects.reverb.level = clamp(data[OFFSETS.FX_REVERB_LEVEL] ?? 0, 0, 127);

  return patch;
}

// ---------------------------------------------------------------------------
// Sub-parsers
// ---------------------------------------------------------------------------

function parseOscillator(data: Uint8Array, base: number) {
  return {
    waveform: clamp(data[base] ?? 2, 0, 8) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    coarse: clamp(data[base + 1] ?? 24, 0, 96),
    fine: clamp(data[base + 2] ?? 50, 0, 100),
    level: clamp(data[base + 3] ?? 100, 0, 127),
    pulseWidth: clamp(data[base + 4] ?? 64, 0, 127),
    virtualSync: clamp(data[base + 5] ?? 0, 0, 127),
    density: clamp(data[base + 6] ?? 0, 0, 127),
    densityDetune: clamp(data[base + 7] ?? 0, 0, 127),
    pitchEnvDepth: clamp(data[base + 8] ?? 64, 0, 127),
  };
}

function parseEnvelope(data: Uint8Array, base: number) {
  return {
    attack: clamp(data[base] ?? 0, 0, 127),
    decay: clamp(data[base + 1] ?? 64, 0, 127),
    sustain: clamp(data[base + 2] ?? 80, 0, 127),
    release: clamp(data[base + 3] ?? 32, 0, 127),
    velocityDepth: clamp(data[base + 4] ?? 64, 0, 127),
    loop: ((data[base + 5] ?? 0) > 0 ? 1 : 0) as 0 | 1,
  };
}

function parseLfo(data: Uint8Array, base: number) {
  return {
    waveform: clamp(data[base] ?? 0, 0, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    rate: clamp(data[base + 1] ?? 64, 0, 127),
    sync: ((data[base + 2] ?? 0) > 0 ? 1 : 0) as 0 | 1,
    syncRate: clamp(data[base + 3] ?? 2, 0, 7),
    phase: clamp(data[base + 4] ?? 0, 0, 127),
    slew: clamp(data[base + 5] ?? 0, 0, 127),
    oneShot: ((data[base + 6] ?? 0) > 0 ? 1 : 0) as 0 | 1,
  };
}

// ---------------------------------------------------------------------------
// Enum lookups (TODO: fill from Programmer's Reference byte values)
// ---------------------------------------------------------------------------

import type { ModDestination, ModSource } from "../types/patch.js";

const MOD_SOURCES: ModSource[] = [
  "none",
  "env1",
  "env2",
  "env3",
  "lfo1",
  "lfo2",
  "macro1",
  "macro2",
  "macro3",
  "macro4",
  "macro5",
  "macro6",
  "macro7",
  "macro8",
  "velocity",
  "aftertouch",
  "modWheel",
  "pitchBend",
];

const MOD_DESTINATIONS: ModDestination[] = [
  "none",
  "osc1Pitch",
  "osc1PulseWidth",
  "osc1Level",
  "osc2Pitch",
  "osc2PulseWidth",
  "osc2Level",
  "oscMix",
  "noiseMix",
  "ringModMix",
  "filterCutoff",
  "filterResonance",
  "filterDrive",
  "env1Attack",
  "env1Decay",
  "env1Sustain",
  "env1Release",
  "env2Attack",
  "env2Decay",
  "env2Sustain",
  "env2Release",
  "env3Attack",
  "env3Decay",
  "env3Sustain",
  "env3Release",
  "lfo1Rate",
  "lfo2Rate",
  "distortionLevel",
  "chorusLevel",
  "reverbLevel",
];

function modSourceFromByte(b: number): ModSource {
  return MOD_SOURCES[b] ?? "none";
}

function modDestFromByte(b: number): ModDestination {
  return MOD_DESTINATIONS[b] ?? "none";
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
