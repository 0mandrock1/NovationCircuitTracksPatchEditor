/**
 * Byte offsets within the 340-byte Circuit Tracks patch data payload.
 *
 * These offsets index into the raw data array AFTER the SysEx header
 * (i.e., starting at byte 0 of the data payload, not byte 0 of the full
 * SysEx message).
 *
 * Source: Circuit Tracks Programmer's Reference Guide v3.
 * TODO: Verify all offsets against the PDF before Phase 1 is considered done.
 *       Offsets marked [VERIFY] need cross-checking against a live SysEx dump.
 */

export const OFFSETS = Object.freeze({
  // -------------------------------------------------------------------------
  // Patch name: 15 ASCII bytes, null-padded
  // -------------------------------------------------------------------------
  NAME_START: 0, // bytes 0–14
  NAME_LENGTH: 15,

  // -------------------------------------------------------------------------
  // Voice
  // -------------------------------------------------------------------------
  VOICE_POLYPHONY_MODE: 15, // 0=Mono, 1=Mono AG, 2=Poly   [VERIFY]
  VOICE_PORTAMENTO_TIME: 16, // 0–127
  VOICE_PRE_GLIDE: 17, // 0–127
  VOICE_KEYBOARD_OCTAVE: 18, // 0–4 (maps to −2 to +2)

  // -------------------------------------------------------------------------
  // Oscillator 1  (bytes ~19–36)
  // -------------------------------------------------------------------------
  OSC1_WAVEFORM: 19,
  OSC1_COARSE: 20, // 0–96  (stored value − 24 = semitones)
  OSC1_FINE: 21, // 0–100 (stored value − 50 = cents)
  OSC1_LEVEL: 22, // 0–127
  OSC1_PULSE_WIDTH: 23, // 0–127
  OSC1_VIRTUAL_SYNC: 24, // 0–127
  OSC1_DENSITY: 25, // 0–127
  OSC1_DENSITY_DETUNE: 26, // 0–127
  OSC1_PITCH_ENV_DEPTH: 27, // 0–127  (stored − 64 = depth)

  // -------------------------------------------------------------------------
  // Oscillator 2  (bytes ~28–36)
  // -------------------------------------------------------------------------
  OSC2_WAVEFORM: 28,
  OSC2_COARSE: 29,
  OSC2_FINE: 30,
  OSC2_LEVEL: 31,
  OSC2_PULSE_WIDTH: 32,
  OSC2_VIRTUAL_SYNC: 33,
  OSC2_DENSITY: 34,
  OSC2_DENSITY_DETUNE: 35,
  OSC2_PITCH_ENV_DEPTH: 36,

  // -------------------------------------------------------------------------
  // Mixer
  // -------------------------------------------------------------------------
  MIX_OSC_BALANCE: 37, // 0=full Osc1, 127=full Osc2
  MIX_NOISE_LEVEL: 38, // 0–127
  MIX_RING_MOD_LEVEL: 39, // 0–127

  // -------------------------------------------------------------------------
  // Filter  (bytes ~40–47)
  // -------------------------------------------------------------------------
  FILTER_TYPE: 40, // FilterType enum
  FILTER_CUTOFF: 41, // 0–127
  FILTER_RESONANCE: 42, // 0–127
  FILTER_DRIVE: 43, // 0–127
  FILTER_ENV_DEPTH: 44, // 0–127  (stored − 64 = depth)
  FILTER_KEY_TRACKING: 45, // 0–127
  FILTER_VELOCITY: 46, // 0–127

  // -------------------------------------------------------------------------
  // Envelope 1  (bytes ~47–52)
  // -------------------------------------------------------------------------
  ENV1_ATTACK: 47,
  ENV1_DECAY: 48,
  ENV1_SUSTAIN: 49,
  ENV1_RELEASE: 50,
  ENV1_VELOCITY_DEPTH: 51, // 0–127  (stored − 64 = depth)
  ENV1_LOOP: 52, // 0 or 1

  // -------------------------------------------------------------------------
  // Envelope 2  (bytes ~53–58)
  // -------------------------------------------------------------------------
  ENV2_ATTACK: 53,
  ENV2_DECAY: 54,
  ENV2_SUSTAIN: 55,
  ENV2_RELEASE: 56,
  ENV2_VELOCITY_DEPTH: 57,
  ENV2_LOOP: 58,

  // -------------------------------------------------------------------------
  // Envelope 3  (bytes ~59–64)
  // -------------------------------------------------------------------------
  ENV3_ATTACK: 59,
  ENV3_DECAY: 60,
  ENV3_SUSTAIN: 61,
  ENV3_RELEASE: 62,
  ENV3_VELOCITY_DEPTH: 63,
  ENV3_LOOP: 64,

  // -------------------------------------------------------------------------
  // LFO 1  (bytes ~65–71)
  // -------------------------------------------------------------------------
  LFO1_WAVEFORM: 65,
  LFO1_RATE: 66,
  LFO1_SYNC: 67, // 0 or 1
  LFO1_SYNC_RATE: 68, // 0–7 note divisions
  LFO1_PHASE: 69,
  LFO1_SLEW: 70,
  LFO1_ONE_SHOT: 71,

  // -------------------------------------------------------------------------
  // LFO 2  (bytes ~72–78)
  // -------------------------------------------------------------------------
  LFO2_WAVEFORM: 72,
  LFO2_RATE: 73,
  LFO2_SYNC: 74,
  LFO2_SYNC_RATE: 75,
  LFO2_PHASE: 76,
  LFO2_SLEW: 77,
  LFO2_ONE_SHOT: 78,

  // -------------------------------------------------------------------------
  // Modulation Matrix: 20 slots × 3 bytes each = 60 bytes (79–138)
  // Slot N starts at: MOD_MATRIX_START + N * MOD_SLOT_STRIDE
  // -------------------------------------------------------------------------
  MOD_MATRIX_START: 79,
  MOD_SLOT_STRIDE: 3, // [source, destination, depth]
  MOD_MATRIX_SLOTS: 20,

  // -------------------------------------------------------------------------
  // Macros: 8 macros
  // Each macro: 1 byte value + 4 × (destination + depth) = 1 + 8 = 9 bytes
  // Start: 79 + 60 = 139
  // -------------------------------------------------------------------------
  MACRO_START: 139,
  MACRO_STRIDE: 9, // value (1) + 4 assignments × 2 bytes
  MACRO_SLOTS: 8,

  // -------------------------------------------------------------------------
  // Arp  (bytes ~211–216 approx)
  // -------------------------------------------------------------------------
  ARP_ENABLED: 211,
  ARP_RATE: 212,
  ARP_GATE: 213,
  ARP_OCTAVE_RANGE: 214,
  ARP_PATTERN: 215,

  // -------------------------------------------------------------------------
  // Effects: Distortion
  // -------------------------------------------------------------------------
  FX_DIST_POSITION: 220,
  FX_DIST_TYPE: 221,
  FX_DIST_DRIVE: 222,
  FX_DIST_LEVEL: 223,

  // Effects: Chorus
  FX_CHORUS_RATE: 226,
  FX_CHORUS_DEPTH: 227,
  FX_CHORUS_FEEDBACK: 228,
  FX_CHORUS_LEVEL: 229,

  // Effects: Reverb
  FX_REVERB_SIZE: 232,
  FX_REVERB_DECAY: 233,
  FX_REVERB_FILTER: 234,
  FX_REVERB_LEVEL: 235,
} as const);

export type OffsetKey = keyof typeof OFFSETS;
