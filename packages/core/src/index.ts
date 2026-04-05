// Types
export type {
  CircuitTracksPatch,
  OscillatorParams,
  OscillatorWaveform,
  FilterParams,
  FilterType,
  EnvelopeParams,
  LfoParams,
  LfoWaveform,
  ModMatrixSlot,
  ModSource,
  ModDestination,
  MacroParams,
  MacroAssignment,
  EffectsParams,
  VoiceParams,
  PolyphonyMode,
  ArpParams,
  PatchMeta,
} from "./types/patch.js";

export type { SampleMeta, SampleEdit, SampleStorageSummary } from "./types/sample.js";

export type {
  MidiDevice,
  SysExMessage,
  CcEvent,
  MidiWsEvent,
  MidiWsCommand,
} from "./types/midi.js";

// SysEx constants
export {
  SYSEX_START,
  SYSEX_END,
  NOVATION_MANUFACTURER_ID,
  CIRCUIT_TRACKS_DEVICE_ID,
  CIRCUIT_TRACKS_HEADER,
  MessageType,
  SYNTH_1,
  SYNTH_2,
  PATCH_DATA_LENGTH,
  PATCH_SYSEX_LENGTH,
  PATCH_SLOTS,
  SAMPLE_RATE,
  SAMPLE_BIT_DEPTH,
  SAMPLE_MAX_DURATION_SECONDS,
  SAMPLE_MAX_TOTAL_BYTES,
  SAMPLE_SLOTS,
  INTER_MESSAGE_DELAY_MS,
  MIDI_CHANNEL,
} from "./sysex/constants.js";

// Parser
export {
  parsePatchSysEx,
  parsePayload,
  extractPayload,
  SysExParseError,
} from "./sysex/parser.js";

// Builder
export {
  buildReplacePatchMessage,
  buildReplaceCurrentPatchMessage,
  buildRequestPatchMessage,
  buildRequestCurrentPatchMessage,
  buildBankMessages,
  encodePayload,
} from "./sysex/builder.js";

// Defaults
export { defaultPatch } from "./sysex/defaults.js";

// Parameters
export { OFFSETS } from "./parameters/offsets.js";
export { RANGES } from "./parameters/ranges.js";
export { CC_MAP, CC_REVERSE } from "./parameters/cc-map.js";
