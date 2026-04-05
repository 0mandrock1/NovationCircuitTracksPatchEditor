/**
 * Byte offsets within the 340-byte Circuit Tracks patch data payload.
 *
 * Offsets are relative to the start of the DATA PAYLOAD, which begins at
 * byte 9 of the full 350-byte SysEx message (after the 6-byte header and
 * 3-byte command section).
 *
 * Full SysEx byte = DATA offset + 9
 *
 * Source: ctpatch.py (https://github.com/martin-stone/ctpatch)
 *         — authoritative, verified against real hardware .syx files.
 *
 * Structure (all sizes in bytes):
 *   Meta:        0–31   (32 bytes: name 16 + category + genre + reserved 14)
 *   Voice:      32–35   (4 bytes)
 *   Osc 1:      36–44   (9 bytes)
 *   Osc 2:      45–53   (9 bytes)
 *   Mixer:      54–59   (6 bytes)
 *   Filter:     60–68   (9 bytes)
 *   Env 1:      69–73   (5 bytes)
 *   Env 2:      74–78   (5 bytes)
 *   Env 3:      79–83   (5 bytes)
 *   LFO 1:      84–91   (8 bytes)
 *   LFO 2:      92–99   (8 bytes)
 *   FX:        100–123  (24 bytes)
 *   Mod matrix: 124–203 (80 bytes = 20 × 4)
 *   Macros:    204–339  (136 bytes = 8 × 17)
 */

// ---------------------------------------------------------------------------
// Meta section: offsets 0–31
// ---------------------------------------------------------------------------

/** Patch name: 16 ASCII bytes, space-padded */
export const NAME_START = 0;
export const NAME_LENGTH = 16;

export const CATEGORY = 16;
export const GENRE = 17;
/** Reserved: 14 bytes (offsets 18–31) */
export const META_RESERVED_START = 18;

// ---------------------------------------------------------------------------
// Voice: offsets 32–35
// ---------------------------------------------------------------------------

export const VOICE_POLYPHONY_MODE = 32; // PolyphonyMode enum: 0=Mono, 1=Mono AG, 2=Poly
export const VOICE_PORTAMENTO_RATE = 33; // 0–127
export const VOICE_PRE_GLIDE = 34; // 0–127
export const VOICE_KEYBOARD_OCTAVE = 35; // 0–4 (0=−2 oct, 2=center, 4=+2 oct)

// ---------------------------------------------------------------------------
// Oscillator 1: offsets 36–44 (9 bytes)
// Per-osc stride = 9; Osc 2 starts at OSC1_START + OSC_STRIDE
// ---------------------------------------------------------------------------

export const OSC_STRIDE = 9;

export const OSC1_START = 36;
export const OSC1_WAVE = 36; // OscWaveform enum: 0–29
export const OSC1_WAVE_INTERPOLATE = 37; // 0–127
export const OSC1_PULSE_WIDTH_INDEX = 38; // 0–127
export const OSC1_VIRTUAL_SYNC_DEPTH = 39; // 0–127
export const OSC1_DENSITY = 40; // 0–127
export const OSC1_DENSITY_DETUNE = 41; // 0–127
export const OSC1_SEMITONES = 42; // 0–127 (64 = centre = 0 semitones)
export const OSC1_CENTS = 43; // 0–127 (64 = centre = 0 cents)
export const OSC1_PITCH_BEND = 44; // 0–127

// ---------------------------------------------------------------------------
// Oscillator 2: offsets 45–53
// ---------------------------------------------------------------------------

export const OSC2_START = 45;
export const OSC2_WAVE = 45;
export const OSC2_WAVE_INTERPOLATE = 46;
export const OSC2_PULSE_WIDTH_INDEX = 47;
export const OSC2_VIRTUAL_SYNC_DEPTH = 48;
export const OSC2_DENSITY = 49;
export const OSC2_DENSITY_DETUNE = 50;
export const OSC2_SEMITONES = 51;
export const OSC2_CENTS = 52;
export const OSC2_PITCH_BEND = 53;

// ---------------------------------------------------------------------------
// Mixer: offsets 54–59
// ---------------------------------------------------------------------------

export const MIXER_OSC1_LEVEL = 54; // 0–127
export const MIXER_OSC2_LEVEL = 55; // 0–127
export const MIXER_RING_MOD_LEVEL = 56; // 0–127
export const MIXER_NOISE_LEVEL = 57; // 0–127
export const MIXER_PRE_FX_LEVEL = 58; // 0–127
export const MIXER_POST_FX_LEVEL = 59; // 0–127

// ---------------------------------------------------------------------------
// Filter: offsets 60–68
// ---------------------------------------------------------------------------

export const FILTER_ROUTING = 60; // 0 = serial, 1 = parallel (verify with hw)
export const FILTER_DRIVE = 61; // 0–127
export const FILTER_DRIVE_TYPE = 62; // DistortionType enum: 0–6
export const FILTER_TYPE = 63; // FilterType enum: 0–5
export const FILTER_FREQUENCY = 64; // 0–127 (cutoff)
export const FILTER_TRACK = 65; // 0–127 (key tracking)
export const FILTER_RESONANCE = 66; // 0–127
export const FILTER_Q_NORMALISE = 67; // 0–127
export const FILTER_ENV2_TO_FREQ = 68; // 0–127 (envelope modulation)

// ---------------------------------------------------------------------------
// Envelope 1: offsets 69–73 (5 bytes)
// Envelope 1 = Amp envelope (velocity_or_delay = velocity sensitivity)
// Envelope 2 = Filter envelope (velocity_or_delay = velocity sensitivity)
// Envelope 3 = Mod envelope  (velocity_or_delay = delay time)
// Per-envelope stride = 5
// ---------------------------------------------------------------------------

export const ENV_STRIDE = 5;

export const ENV1_START = 69;
export const ENV1_VELOCITY = 69; // 0–127 (velocity sensitivity for Env1/2)
export const ENV1_ATTACK = 70; // 0–127
export const ENV1_DECAY = 71; // 0–127
export const ENV1_SUSTAIN = 72; // 0–127
export const ENV1_RELEASE = 73; // 0–127

// Envelope 2: offsets 74–78
export const ENV2_START = 74;
export const ENV2_VELOCITY = 74;
export const ENV2_ATTACK = 75;
export const ENV2_DECAY = 76;
export const ENV2_SUSTAIN = 77;
export const ENV2_RELEASE = 78;

// Envelope 3: offsets 79–83
export const ENV3_START = 79;
export const ENV3_DELAY = 79; // Env 3 has a delay parameter instead of velocity
export const ENV3_ATTACK = 80;
export const ENV3_DECAY = 81;
export const ENV3_SUSTAIN = 82;
export const ENV3_RELEASE = 83;

// ---------------------------------------------------------------------------
// LFO 1: offsets 84–91 (8 bytes)
// LFO 2: offsets 92–99 (8 bytes)
// Per-LFO stride = 8
// ---------------------------------------------------------------------------

export const LFO_STRIDE = 8;

export const LFO1_START = 84;
export const LFO1_WAVEFORM = 84; // LfoWaveform enum: 0–37
export const LFO1_PHASE_OFFSET = 85; // 0–127
export const LFO1_SLEW_RATE = 86; // 0–127
export const LFO1_DELAY = 87; // 0–127
export const LFO1_DELAY_SYNC = 88; // 0–127
export const LFO1_RATE = 89; // 0–127
export const LFO1_RATE_SYNC = 90; // 0–127
export const LFO1_FLAGS = 91; // Bitfield: one_shot(1) key_sync(1) common_sync(1) delay_trigger(1) fade_mode(4)

export const LFO2_START = 92;
export const LFO2_WAVEFORM = 92;
export const LFO2_PHASE_OFFSET = 93;
export const LFO2_SLEW_RATE = 94;
export const LFO2_DELAY = 95;
export const LFO2_DELAY_SYNC = 96;
export const LFO2_RATE = 97;
export const LFO2_RATE_SYNC = 98;
export const LFO2_FLAGS = 99;

// ---------------------------------------------------------------------------
// FX: offsets 100–123 (24 bytes)
// ---------------------------------------------------------------------------

export const FX_DIST_LEVEL = 100; // 0–127
export const FX_RESERVED_1 = 101;
export const FX_CHORUS_LEVEL = 102; // 0–127
export const FX_RESERVED_2 = 103;
export const FX_RESERVED_3 = 104;
export const FX_EQ_BASS_FREQ = 105; // 0–127
export const FX_EQ_BASS_LEVEL = 106; // 0–127
export const FX_EQ_MID_FREQ = 107; // 0–127
export const FX_EQ_MID_LEVEL = 108; // 0–127
export const FX_EQ_TREBLE_FREQ = 109; // 0–127
export const FX_EQ_TREBLE_LEVEL = 110; // 0–127
export const FX_RESERVED_4_8 = 111; // 5 bytes (111–115)
export const FX_DIST_TYPE = 116; // DistortionType enum: 0–6
export const FX_DIST_COMPENSATION = 117; // 0–127
export const FX_CHORUS_TYPE = 118; // 0–? chorus type
export const FX_CHORUS_RATE = 119; // 0–127
export const FX_CHORUS_RATE_SYNC = 120; // 0–127
export const FX_CHORUS_FEEDBACK = 121; // 0–127
export const FX_CHORUS_MOD_DEPTH = 122; // 0–127
export const FX_CHORUS_DELAY = 123; // 0–127

// ---------------------------------------------------------------------------
// Modulation matrix: offsets 124–203 (80 bytes = 20 slots × 4 bytes)
//
// Each slot layout (4 bytes):
//   [0] source1      — ModMatrixSource enum
//   [1] source2      — ModMatrixSource enum
//   [2] depth        — 0–127
//   [3] destination  — ModMatrixDestination enum
// ---------------------------------------------------------------------------

export const MOD_MATRIX_START = 124;
export const MOD_MATRIX_SLOTS = 20;
export const MOD_MATRIX_STRIDE = 4; // bytes per slot

// Offsets within a single mod matrix slot
export const MOD_SLOT_SOURCE1 = 0;
export const MOD_SLOT_SOURCE2 = 1;
export const MOD_SLOT_DEPTH = 2;
export const MOD_SLOT_DESTINATION = 3;

// ---------------------------------------------------------------------------
// Macro knobs: offsets 204–339 (136 bytes = 8 macros × 17 bytes)
//
// Each macro layout (17 bytes):
//   [0]     position  — 0–127 (current knob value)
//   [1–4]   range 0   — 4 bytes: destination(1) start_pos(1) end_pos(1) depth(1)
//   [5–8]   range 1
//   [9–12]  range 2
//   [13–16] range 3
// ---------------------------------------------------------------------------

export const MACRO_START = 204;
export const MACRO_SLOTS = 8;
export const MACRO_STRIDE = 17; // bytes per macro
export const MACRO_RANGES_PER_KNOB = 4;
export const MACRO_RANGE_STRIDE = 4; // bytes per range

// Offsets within a single range (relative to range start)
export const RANGE_DESTINATION = 0; // MacroKnobDestination enum
export const RANGE_START_POS = 1; // 0–127
export const RANGE_END_POS = 2; // 0–127
export const RANGE_DEPTH = 3; // 0–127
