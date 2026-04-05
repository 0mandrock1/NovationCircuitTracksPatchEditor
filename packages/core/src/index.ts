// Types
export type {
  CircuitTracksPatch,
  OscParams,
  OscWaveform,
  MixerParams,
  FilterParams,
  FilterType,
  DistortionType,
  EnvelopeParams,
  LfoParams,
  LfoWaveform,
  LfoFlags,
  LfoFadeMode,
  FxParams,
  ModMatrixSlot,
  ModMatrixSource,
  ModMatrixDestination,
  MacroKnob,
  MacroRange,
  MacroDestination,
  VoiceParams,
  PolyphonyMode,
  PatchMeta,
} from "./types/patch.js";

export {
  OSC_WAVEFORM_NAMES,
  FILTER_TYPE_NAMES,
  DISTORTION_TYPE_NAMES,
  LFO_WAVEFORM_NAMES,
  MOD_SOURCE_NAMES,
  MOD_DEST_NAMES,
  MACRO_DEST_NAMES,
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
  NOVATION_PRODUCT_TYPE,
  CIRCUIT_TRACKS_PRODUCT_ID,
  CIRCUIT_ORIGINAL_PRODUCT_ID,
  CIRCUIT_TRACKS_HEADER,
  SysExCommand,
  SYNTH_1,
  SYNTH_2,
  PATCH_SYSEX_LENGTH,
  PATCH_DATA_LENGTH,
  PATCH_DATA_OFFSET,
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
  SysExParseError,
} from "./sysex/parser.js";

// Builder
export {
  buildReplaceCurrentPatchMessage,
  buildReplacePatchMessage,
  buildRequestCurrentPatchMessage,
  buildBankMessages,
  encodePayload,
} from "./sysex/builder.js";

// Defaults
export { defaultPatch } from "./sysex/defaults.js";

// Parameters
export * as OFFSETS from "./parameters/offsets.js";
export { RANGES } from "./parameters/ranges.js";
export { CC_MAP, CC_REVERSE } from "./parameters/cc-map.js";
