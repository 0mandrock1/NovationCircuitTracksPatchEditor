/**
 * Novation Circuit Tracks SysEx protocol constants.
 *
 * Source: ctpatch.py (https://github.com/martin-stone/ctpatch)
 *         Novation Circuit Tracks Programmer's Reference Guide v3
 *
 * Total SysEx message size: 350 bytes
 * No 7-bit packing — all data bytes are raw 8-bit values (parameters capped at 0-127
 * by convention; the SysEx framing itself is handled by standard MIDI over USB).
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

/** Product type byte (byte 4 in SysEx, after manufacturer ID) */
export const NOVATION_PRODUCT_TYPE = 0x01;

/** Circuit Tracks product number (byte 5) */
export const CIRCUIT_TRACKS_PRODUCT_ID = 0x64;

/** Original Circuit product number (for .syx compatibility detection) */
export const CIRCUIT_ORIGINAL_PRODUCT_ID = 0x60;

/**
 * Full 6-byte SysEx header shared by all Circuit Tracks messages:
 * F0 00 20 29 01 64
 */
export const CIRCUIT_TRACKS_HEADER = Object.freeze([
  SYSEX_START,
  ...NOVATION_MANUFACTURER_ID,
  NOVATION_PRODUCT_TYPE,
  CIRCUIT_TRACKS_PRODUCT_ID,
] as const);

// ---------------------------------------------------------------------------
// Command / message type bytes (byte 6 in full SysEx)
// ---------------------------------------------------------------------------

export const SysExCommand = Object.freeze({
  /** Replaces the currently loaded patch in RAM. Audible immediately. Does not persist. */
  REPLACE_CURRENT_PATCH: 0x00,
  /** Replaces a patch in flash memory (persists across power cycles). */
  REPLACE_PATCH: 0x01,
  /** Asks the device to send the current patch dump. */
  REQUEST_DUMP_CURRENT_PATCH: 0x40,
} as const);

// ---------------------------------------------------------------------------
// Synth location byte (byte 7 in full SysEx)
// ---------------------------------------------------------------------------

/** Synth 1 (MIDI channel 1) */
export const SYNTH_1 = 0x00;
/** Synth 2 (MIDI channel 2) */
export const SYNTH_2 = 0x01;

// ---------------------------------------------------------------------------
// Message sizes
// ---------------------------------------------------------------------------

/**
 * Total Circuit Tracks patch SysEx message size in bytes, including
 * F0 header and F7 terminator.
 *
 * Layout:
 *   6  bytes  — header (F0 00 20 29 01 64)
 *   3  bytes  — command section (command_id + location + reserved)
 *  32  bytes  — meta (name 16 + category + genre + reserved 14)
 *   4  bytes  — voice
 *  18  bytes  — 2 × oscillator (9 bytes each)
 *   6  bytes  — mixer
 *   9  bytes  — filter
 *  15  bytes  — 3 × envelope (5 bytes each)
 *  16  bytes  — 2 × LFO (8 bytes each)
 *  24  bytes  — FX
 *  80  bytes  — mod matrix (20 × 4 bytes)
 * 136  bytes  — macro knobs (8 × 17 bytes: 1 position + 4 × 4-byte range)
 *   1  byte   — F7 terminator
 * ─────────────
 * 350  bytes  total
 */
export const PATCH_SYSEX_LENGTH = 350;

/**
 * Data payload length: 340 bytes (full SysEx minus 6-byte header, 3-byte
 * command section, and 1-byte F7 terminator).
 */
export const PATCH_DATA_LENGTH = 340;

/**
 * Offset within the full 350-byte SysEx where the data payload starts.
 * Bytes 0-5: header, bytes 6-8: command section, byte 9: data start.
 */
export const PATCH_DATA_OFFSET = 9;

/** Number of patch slots available per synth */
export const PATCH_SLOTS = 64;

// ---------------------------------------------------------------------------
// Sample parameters
// ---------------------------------------------------------------------------

export const SAMPLE_RATE = 48_000;
export const SAMPLE_BIT_DEPTH = 16;
export const SAMPLE_MAX_DURATION_SECONDS = 98.3;
export const SAMPLE_MAX_TOTAL_BYTES = 15_728_640; // ~15 MB
export const SAMPLE_SLOTS = 64;

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

/**
 * Minimum delay (ms) between consecutive SysEx messages sent to the device.
 * The Circuit Tracks hardware will drop messages without this gap.
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
