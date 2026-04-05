/**
 * Novation Circuit Tracks SysEx protocol constants.
 *
 * Source: Circuit Tracks Programmer's Reference Guide v3
 * https://fael-downloads-prod.focusrite.com/customer/prod/downloads/circuit_tracks_programmer_s_reference_guide_v3.pdf
 */

// ---------------------------------------------------------------------------
// SysEx framing
// ---------------------------------------------------------------------------

export const SYSEX_START = 0xf0;
export const SYSEX_END = 0xf7;

// ---------------------------------------------------------------------------
// Manufacturer & device IDs
// ---------------------------------------------------------------------------

/** Novation/Focusrite 3-byte manufacturer ID */
export const NOVATION_MANUFACTURER_ID = Object.freeze([0x00, 0x20, 0x29] as const);

/** Circuit Tracks product ID byte (follows manufacturer ID in header) */
export const CIRCUIT_TRACKS_DEVICE_ID = 0x02;

/**
 * Full 5-byte SysEx header shared by all Circuit Tracks messages:
 * F0 00 20 29 02
 */
export const CIRCUIT_TRACKS_HEADER = Object.freeze([
  SYSEX_START,
  ...NOVATION_MANUFACTURER_ID,
  CIRCUIT_TRACKS_DEVICE_ID,
] as const);

// ---------------------------------------------------------------------------
// Message type bytes (byte index 5 after the 5-byte header)
// ---------------------------------------------------------------------------

export const MessageType = Object.freeze({
  /** Replace patch currently in RAM (takes effect immediately, not persisted) */
  REPLACE_CURRENT_PATCH: 0x06,
  /** Replace patch in flash memory (persists across power cycles) */
  REPLACE_PATCH: 0x07,
  /** Request current patch dump from device */
  REQUEST_CURRENT_PATCH: 0x40,
  /** Request specific patch from flash */
  REQUEST_PATCH: 0x41,
  /** Replace a sample in flash */
  REPLACE_SAMPLE: 0x62,
  /** Request a sample from device */
  REQUEST_SAMPLE: 0x63,
} as const);

// ---------------------------------------------------------------------------
// Synth indices
// ---------------------------------------------------------------------------

/** Synth 1 identifier (MIDI channel 1) */
export const SYNTH_1 = 0x00;
/** Synth 2 identifier (MIDI channel 2) */
export const SYNTH_2 = 0x01;

// ---------------------------------------------------------------------------
// Patch data layout
// ---------------------------------------------------------------------------

/** Raw patch data length (bytes, excluding SysEx framing) */
export const PATCH_DATA_LENGTH = 340;

/**
 * Total SysEx message length for a single patch:
 * 5 (header) + 1 (message type) + 1 (synth index) + 1 (slot) + 340 (data) + 1 (F7)
 */
export const PATCH_SYSEX_LENGTH = 5 + 1 + 1 + 1 + PATCH_DATA_LENGTH + 1;

/** Number of patch slots per synth */
export const PATCH_SLOTS = 64;

// ---------------------------------------------------------------------------
// Sample data layout
// ---------------------------------------------------------------------------

/** Circuit Tracks required sample rate (Hz) */
export const SAMPLE_RATE = 48000;

/** Circuit Tracks required bit depth */
export const SAMPLE_BIT_DEPTH = 16;

/** Maximum single sample duration in seconds */
export const SAMPLE_MAX_DURATION_SECONDS = 98.3;

/** Maximum total sample storage in bytes (~15 MB) */
export const SAMPLE_MAX_TOTAL_BYTES = 15_728_640;

/** Number of sample slots */
export const SAMPLE_SLOTS = 64;

// ---------------------------------------------------------------------------
// Timing constraints
// ---------------------------------------------------------------------------

/**
 * Minimum delay in milliseconds between consecutive SysEx messages.
 * The Circuit Tracks hardware requires this to avoid dropped messages.
 */
export const INTER_MESSAGE_DELAY_MS = 20;

// ---------------------------------------------------------------------------
// MIDI channels (1-indexed, matching hardware labels)
// ---------------------------------------------------------------------------

export const MIDI_CHANNEL = Object.freeze({
  SYNTH_1: 1,
  SYNTH_2: 2,
  DRUM: 10,
  SESSION: 16,
} as const);
