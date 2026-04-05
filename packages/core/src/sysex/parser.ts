/**
 * SysEx parser: Uint8Array → CircuitTracksPatch
 *
 * Parses the full 350-byte Circuit Tracks SysEx message or the 340-byte
 * data payload. No 7-bit unpacking required.
 */

import * as O from "../parameters/offsets.js";
import type {
  CircuitTracksPatch,
  EnvelopeParams,
  LfoFadeMode,
  LfoFlags,
  LfoParams,
  MacroKnob,
  MacroRange,
  ModMatrixDestination,
  ModMatrixSlot,
  ModMatrixSource,
  OscParams,
} from "../types/patch.js";
import {
  CIRCUIT_ORIGINAL_PRODUCT_ID,
  CIRCUIT_TRACKS_HEADER,
  CIRCUIT_TRACKS_PRODUCT_ID,
  PATCH_DATA_LENGTH,
  PATCH_DATA_OFFSET,
  SYSEX_END,
  SYSEX_START,
  SysExCommand,
} from "./constants.js";
import { defaultPatch } from "./defaults.js";

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class SysExParseError extends Error {
  constructor(msg: string) {
    super(`SysEx parse error: ${msg}`);
    this.name = "SysExParseError";
  }
}

// ---------------------------------------------------------------------------
// Full message parsing
// ---------------------------------------------------------------------------

/** Parse a complete 350-byte SysEx buffer */
export function parsePatchSysEx(bytes: Uint8Array): {
  patch: CircuitTracksPatch;
  synth: 1 | 2;
  slot: number;
  command: number;
} {
  if (bytes[0] !== SYSEX_START) {
    throw new SysExParseError(`Expected F0, got 0x${bytes[0]?.toString(16)}`);
  }
  if (bytes[bytes.length - 1] !== SYSEX_END) {
    throw new SysExParseError("Missing F7 terminator");
  }

  // Validate manufacturer ID and product type
  if (
    bytes[1] !== CIRCUIT_TRACKS_HEADER[1] ||
    bytes[2] !== CIRCUIT_TRACKS_HEADER[2] ||
    bytes[3] !== CIRCUIT_TRACKS_HEADER[3] ||
    bytes[4] !== CIRCUIT_TRACKS_HEADER[4]
  ) {
    throw new SysExParseError("Manufacturer ID or product type mismatch");
  }

  const prodId = bytes[5];
  if (prodId !== CIRCUIT_TRACKS_PRODUCT_ID && prodId !== CIRCUIT_ORIGINAL_PRODUCT_ID) {
    throw new SysExParseError(
      `Unknown product ID 0x${prodId?.toString(16)} — expected 0x${CIRCUIT_TRACKS_PRODUCT_ID.toString(16)} (Circuit Tracks) or 0x${CIRCUIT_ORIGINAL_PRODUCT_ID.toString(16)} (Circuit Original)`
    );
  }

  const command = bytes[6] ?? 0;
  if (command !== SysExCommand.REPLACE_CURRENT_PATCH && command !== SysExCommand.REPLACE_PATCH) {
    throw new SysExParseError(
      `Unexpected command 0x${command.toString(16)} — this is not a patch dump message`
    );
  }

  const location = bytes[7] ?? 0;
  const synth: 1 | 2 = location === 0 ? 1 : 2;

  // For REPLACE_PATCH, the location byte encodes the slot number
  const slot = command === SysExCommand.REPLACE_PATCH ? location : 0;

  const data = bytes.slice(PATCH_DATA_OFFSET, PATCH_DATA_OFFSET + PATCH_DATA_LENGTH);
  if (data.length !== PATCH_DATA_LENGTH) {
    throw new SysExParseError(`Expected ${PATCH_DATA_LENGTH} data bytes, got ${data.length}`);
  }

  return { patch: parsePayload(data), synth, slot, command };
}

// ---------------------------------------------------------------------------
// Payload parser — exported for unit testing without SysEx framing
// ---------------------------------------------------------------------------

export function parsePayload(d: Uint8Array): CircuitTracksPatch {
  const patch = defaultPatch();

  // --- Meta ---
  const nameEnd = findNameEnd(d, O.NAME_START, O.NAME_LENGTH);
  patch.name = new TextDecoder().decode(d.slice(O.NAME_START, nameEnd)).trimEnd();
  patch.category = d[O.CATEGORY] ?? 0;
  patch.genre = d[O.GENRE] ?? 0;

  // --- Voice ---
  patch.voice.polyphonyMode = clamp(d[O.VOICE_POLYPHONY_MODE] ?? 0, 0, 2) as 0 | 1 | 2;
  patch.voice.portamentoRate = clamp(d[O.VOICE_PORTAMENTO_RATE] ?? 0, 0, 127);
  patch.voice.preGlide = clamp(d[O.VOICE_PRE_GLIDE] ?? 0, 0, 127);
  patch.voice.keyboardOctave = clamp(d[O.VOICE_KEYBOARD_OCTAVE] ?? 2, 0, 4);

  // --- Oscillators ---
  patch.oscillator1 = parseOsc(d, O.OSC1_START);
  patch.oscillator2 = parseOsc(d, O.OSC2_START);

  // --- Mixer ---
  patch.mixer.osc1Level = clamp(d[O.MIXER_OSC1_LEVEL] ?? 100, 0, 127);
  patch.mixer.osc2Level = clamp(d[O.MIXER_OSC2_LEVEL] ?? 0, 0, 127);
  patch.mixer.ringModLevel = clamp(d[O.MIXER_RING_MOD_LEVEL] ?? 0, 0, 127);
  patch.mixer.noiseLevel = clamp(d[O.MIXER_NOISE_LEVEL] ?? 0, 0, 127);
  patch.mixer.preFxLevel = clamp(d[O.MIXER_PRE_FX_LEVEL] ?? 100, 0, 127);
  patch.mixer.postFxLevel = clamp(d[O.MIXER_POST_FX_LEVEL] ?? 100, 0, 127);

  // --- Filter ---
  patch.filter.routing = clamp(d[O.FILTER_ROUTING] ?? 0, 0, 1);
  patch.filter.drive = clamp(d[O.FILTER_DRIVE] ?? 0, 0, 127);
  patch.filter.driveType = clamp(d[O.FILTER_DRIVE_TYPE] ?? 0, 0, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  patch.filter.type = clamp(d[O.FILTER_TYPE] ?? 0, 0, 5) as 0 | 1 | 2 | 3 | 4 | 5;
  patch.filter.frequency = clamp(d[O.FILTER_FREQUENCY] ?? 127, 0, 127);
  patch.filter.track = clamp(d[O.FILTER_TRACK] ?? 0, 0, 127);
  patch.filter.resonance = clamp(d[O.FILTER_RESONANCE] ?? 0, 0, 127);
  patch.filter.qNormalise = clamp(d[O.FILTER_Q_NORMALISE] ?? 0, 0, 127);
  patch.filter.env2ToFreq = clamp(d[O.FILTER_ENV2_TO_FREQ] ?? 64, 0, 127);

  // --- Envelopes ---
  patch.envelope1 = parseEnv(d, O.ENV1_START);
  patch.envelope2 = parseEnv(d, O.ENV2_START);
  patch.envelope3 = parseEnv(d, O.ENV3_START);

  // --- LFOs ---
  patch.lfo1 = parseLfo(d, O.LFO1_START);
  patch.lfo2 = parseLfo(d, O.LFO2_START);

  // --- FX ---
  patch.fx.distortionLevel = clamp(d[O.FX_DIST_LEVEL] ?? 0, 0, 127);
  patch.fx.chorusLevel = clamp(d[O.FX_CHORUS_LEVEL] ?? 0, 0, 127);
  patch.fx.eqBassFrequency = clamp(d[O.FX_EQ_BASS_FREQ] ?? 64, 0, 127);
  patch.fx.eqBassLevel = clamp(d[O.FX_EQ_BASS_LEVEL] ?? 64, 0, 127);
  patch.fx.eqMidFrequency = clamp(d[O.FX_EQ_MID_FREQ] ?? 64, 0, 127);
  patch.fx.eqMidLevel = clamp(d[O.FX_EQ_MID_LEVEL] ?? 64, 0, 127);
  patch.fx.eqTrebleFrequency = clamp(d[O.FX_EQ_TREBLE_FREQ] ?? 64, 0, 127);
  patch.fx.eqTrebleLevel = clamp(d[O.FX_EQ_TREBLE_LEVEL] ?? 64, 0, 127);
  patch.fx.distortionType = clamp(d[O.FX_DIST_TYPE] ?? 0, 0, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  patch.fx.distortionCompensation = clamp(d[O.FX_DIST_COMPENSATION] ?? 0, 0, 127);
  patch.fx.chorusType = clamp(d[O.FX_CHORUS_TYPE] ?? 0, 0, 127);
  patch.fx.chorusRate = clamp(d[O.FX_CHORUS_RATE] ?? 64, 0, 127);
  patch.fx.chorusRateSync = clamp(d[O.FX_CHORUS_RATE_SYNC] ?? 0, 0, 127);
  patch.fx.chorusFeedback = clamp(d[O.FX_CHORUS_FEEDBACK] ?? 0, 0, 127);
  patch.fx.chorusModDepth = clamp(d[O.FX_CHORUS_MOD_DEPTH] ?? 0, 0, 127);
  patch.fx.chorusDelay = clamp(d[O.FX_CHORUS_DELAY] ?? 0, 0, 127);

  // --- Mod matrix ---
  for (let i = 0; i < O.MOD_MATRIX_SLOTS; i++) {
    const base = O.MOD_MATRIX_START + i * O.MOD_MATRIX_STRIDE;
    const slot = patch.modMatrix[i] as ModMatrixSlot;
    slot.source1 = (d[base + O.MOD_SLOT_SOURCE1] ?? 0) as ModMatrixSource;
    slot.source2 = (d[base + O.MOD_SLOT_SOURCE2] ?? 0) as ModMatrixSource;
    slot.depth = clamp(d[base + O.MOD_SLOT_DEPTH] ?? 0, 0, 127);
    slot.destination = clamp(d[base + O.MOD_SLOT_DESTINATION] ?? 0, 0, 17) as ModMatrixDestination;
  }

  // --- Macro knobs ---
  for (let i = 0; i < O.MACRO_SLOTS; i++) {
    const base = O.MACRO_START + i * O.MACRO_STRIDE;
    const macro = patch.macroKnobs[i] as MacroKnob;
    macro.position = clamp(d[base] ?? 64, 0, 127);
    for (let r = 0; r < O.MACRO_RANGES_PER_KNOB; r++) {
      const rb = base + 1 + r * O.MACRO_RANGE_STRIDE;
      const range = macro.ranges[r] as MacroRange;
      range.destination = clamp(d[rb + O.RANGE_DESTINATION] ?? 0, 0, 70);
      range.startPos = clamp(d[rb + O.RANGE_START_POS] ?? 0, 0, 127);
      range.endPos = clamp(d[rb + O.RANGE_END_POS] ?? 127, 0, 127);
      range.depth = clamp(d[rb + O.RANGE_DEPTH] ?? 64, 0, 127);
    }
  }

  return patch;
}

// ---------------------------------------------------------------------------
// Sub-parsers
// ---------------------------------------------------------------------------

function parseOsc(d: Uint8Array, base: number): OscParams {
  return {
    wave: clamp(d[base + 0] ?? 2, 0, 29) as OscParams["wave"],
    waveInterpolate: clamp(d[base + 1] ?? 0, 0, 127),
    pulseWidthIndex: clamp(d[base + 2] ?? 64, 0, 127),
    virtualSyncDepth: clamp(d[base + 3] ?? 0, 0, 127),
    density: clamp(d[base + 4] ?? 0, 0, 127),
    densityDetune: clamp(d[base + 5] ?? 0, 0, 127),
    semitones: clamp(d[base + 6] ?? 64, 0, 127),
    cents: clamp(d[base + 7] ?? 64, 0, 127),
    pitchBend: clamp(d[base + 8] ?? 64, 0, 127),
  };
}

function parseEnv(d: Uint8Array, base: number): EnvelopeParams {
  return {
    velocityOrDelay: clamp(d[base + 0] ?? 0, 0, 127),
    attack: clamp(d[base + 1] ?? 0, 0, 127),
    decay: clamp(d[base + 2] ?? 64, 0, 127),
    sustain: clamp(d[base + 3] ?? 80, 0, 127),
    release: clamp(d[base + 4] ?? 32, 0, 127),
  };
}

function parseLfo(d: Uint8Array, base: number): LfoParams {
  return {
    waveform: clamp(d[base + 0] ?? 0, 0, 37) as LfoParams["waveform"],
    phaseOffset: clamp(d[base + 1] ?? 0, 0, 127),
    slewRate: clamp(d[base + 2] ?? 0, 0, 127),
    delay: clamp(d[base + 3] ?? 0, 0, 127),
    delaySync: clamp(d[base + 4] ?? 0, 0, 127),
    rate: clamp(d[base + 5] ?? 64, 0, 127),
    rateSync: clamp(d[base + 6] ?? 0, 0, 127),
    flags: parseLfoFlags(d[base + 7] ?? 0),
  };
}

function parseLfoFlags(b: number): LfoFlags {
  return {
    oneShot: (b & 0x01) !== 0,
    keySync: (b & 0x02) !== 0,
    commonSync: (b & 0x04) !== 0,
    delayTrigger: (b & 0x08) !== 0,
    fadeMode: ((b >> 4) & 0x0f) as LfoFadeMode,
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Find the length of the actual name content (trim trailing spaces/nulls) */
function findNameEnd(d: Uint8Array, start: number, maxLen: number): number {
  let end = start + maxLen;
  while (end > start && (d[end - 1] === 0x20 || d[end - 1] === 0x00)) {
    end--;
  }
  return end;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
