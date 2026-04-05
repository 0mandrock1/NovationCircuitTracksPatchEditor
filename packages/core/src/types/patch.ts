/**
 * Full typed representation of a Circuit Tracks synth patch.
 *
 * Types mirror the ctpatch.py dataclass hierarchy exactly.
 * Source: https://github.com/martin-stone/ctpatch
 */

// ---------------------------------------------------------------------------
// Oscillator
// ---------------------------------------------------------------------------

/** 30 waveforms available on the Circuit Tracks oscillators */
export type OscWaveform =
  | 0 // SINE
  | 1 // TRIANGLE
  | 2 // SAWTOOTH
  | 3 // SAW_9_1_PW
  | 4 // SAW_8_2_PW
  | 5 // SAW_7_3_PW
  | 6 // SAW_6_4_PW
  | 7 // SAW_5_5_PW
  | 8 // SAW_4_6_PW
  | 9 // SAW_3_7_PW
  | 10 // SAW_2_8_PW
  | 11 // SAW_1_9_PW
  | 12 // PULSE_WIDTH
  | 13 // SQUARE
  | 14 // SINE_TABLE
  | 15 // ANALOGUE_PULSE
  | 16 // ANALOGUE_SYNC
  | 17 // TRIANGLE_SAW_BLEND
  | 18 // DIGITAL_NASTY_1
  | 19 // DIGITAL_NASTY_2
  | 20 // DIGITAL_SAW_SQUARE
  | 21 // DIGITAL_VOCAL_1
  | 22 // DIGITAL_VOCAL_2
  | 23 // DIGITAL_VOCAL_3
  | 24 // DIGITAL_VOCAL_4
  | 25 // DIGITAL_VOCAL_5
  | 26 // DIGITAL_VOCAL_6
  | 27 // RANDOM_COLLECTION_1
  | 28 // RANDOM_COLLECTION_2
  | 29; // RANDOM_COLLECTION_3

export const OSC_WAVEFORM_NAMES: Record<OscWaveform, string> = {
  0: "Sine",
  1: "Triangle",
  2: "Sawtooth",
  3: "Saw 9:1",
  4: "Saw 8:2",
  5: "Saw 7:3",
  6: "Saw 6:4",
  7: "Saw 5:5",
  8: "Saw 4:6",
  9: "Saw 3:7",
  10: "Saw 2:8",
  11: "Saw 1:9",
  12: "Pulse Width",
  13: "Square",
  14: "Sine Table",
  15: "Analogue Pulse",
  16: "Analogue Sync",
  17: "Tri-Saw Blend",
  18: "Digital Nasty 1",
  19: "Digital Nasty 2",
  20: "Digital Saw-Square",
  21: "Vocal 1",
  22: "Vocal 2",
  23: "Vocal 3",
  24: "Vocal 4",
  25: "Vocal 5",
  26: "Vocal 6",
  27: "Random 1",
  28: "Random 2",
  29: "Random 3",
};

export interface OscParams {
  wave: OscWaveform;
  /** Wave blend / interpolation: 0–127 */
  waveInterpolate: number;
  /** Pulse width index: 0–127 */
  pulseWidthIndex: number;
  /** Virtual sync depth: 0–127 */
  virtualSyncDepth: number;
  /** Density (unison voices): 0–127 */
  density: number;
  /** Density detune: 0–127 */
  densityDetune: number;
  /** Coarse tune in semitones: 0–127 (64 = centre = 0 semitones) */
  semitones: number;
  /** Fine tune in cents: 0–127 (64 = centre = 0 cents) */
  cents: number;
  /** Pitch bend range: 0–127 */
  pitchBend: number;
}

// ---------------------------------------------------------------------------
// Mixer
// ---------------------------------------------------------------------------

export interface MixerParams {
  osc1Level: number; // 0–127
  osc2Level: number; // 0–127
  ringModLevel: number; // 0–127
  noiseLevel: number; // 0–127
  preFxLevel: number; // 0–127
  postFxLevel: number; // 0–127
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

export type FilterType =
  | 0 // LOW_PASS_12DB
  | 1 // LOW_PASS_24DB
  | 2 // BAND_PASS_6DB
  | 3 // BAND_PASS_12DB
  | 4 // HIGH_PASS_12DB
  | 5; // HIGH_PASS_24DB

export const FILTER_TYPE_NAMES: Record<FilterType, string> = {
  0: "LP 12dB",
  1: "LP 24dB",
  2: "BP 6dB",
  3: "BP 12dB",
  4: "HP 12dB",
  5: "HP 24dB",
};

export type DistortionType =
  | 0 // DIODE
  | 1 // VALVE
  | 2 // CLIPPER
  | 3 // CROSS_OVER
  | 4 // RECTIFIER
  | 5 // BIT_REDUCER
  | 6; // RATE_REDUCER

export const DISTORTION_TYPE_NAMES: Record<DistortionType, string> = {
  0: "Diode",
  1: "Valve",
  2: "Clipper",
  3: "Cross-Over",
  4: "Rectifier",
  5: "Bit Reducer",
  6: "Rate Reducer",
};

export interface FilterParams {
  routing: number; // 0–1 (serial / parallel)
  drive: number; // 0–127
  driveType: DistortionType; // 0–6
  type: FilterType; // 0–5
  frequency: number; // 0–127 (cutoff)
  track: number; // 0–127 (key tracking)
  resonance: number; // 0–127
  qNormalise: number; // 0–127
  env2ToFreq: number; // 0–127 (Env2 mod depth)
}

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

export interface EnvelopeParams {
  /**
   * For Env 1 (amp) and Env 2 (filter): velocity sensitivity (0–127).
   * For Env 3 (mod): delay time (0–127).
   */
  velocityOrDelay: number;
  attack: number; // 0–127
  decay: number; // 0–127
  sustain: number; // 0–127
  release: number; // 0–127
}

// ---------------------------------------------------------------------------
// LFO
// ---------------------------------------------------------------------------

/**
 * 38 LFO waveforms on the Circuit Tracks.
 * Values 7–37 are musical sequences, arpeggios, and special patterns.
 */
export type LfoWaveform =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37;

export const LFO_WAVEFORM_NAMES: Record<LfoWaveform, string> = {
  0: "Sine",
  1: "Triangle",
  2: "Sawtooth",
  3: "Square",
  4: "Random S&H",
  5: "Time S&H",
  6: "Piano Env",
  7: "Seq 1",
  8: "Seq 2",
  9: "Seq 3",
  10: "Seq 4",
  11: "Seq 5",
  12: "Seq 6",
  13: "Seq 7",
  14: "Alt 1",
  15: "Alt 2",
  16: "Alt 3",
  17: "Alt 4",
  18: "Alt 5",
  19: "Alt 6",
  20: "Alt 7",
  21: "Alt 8",
  22: "Chromatic",
  23: "Chromatic 16",
  24: "Major",
  25: "Major 7",
  26: "Minor 7",
  27: "Min Arp 1",
  28: "Min Arp 2",
  29: "Diminished",
  30: "Dec Minor",
  31: "Minor 3rd",
  32: "Pedal",
  33: "4ths",
  34: "4ths ×12",
  35: "1625 Maj",
  36: "1625 Min",
  37: "2511",
};

/** Fade mode stored in the upper 4 bits of the LFO flags byte */
export type LfoFadeMode = 0 | 1 | 2 | 3; // FADE_IN, FADE_OUT, GATE_IN, GATE_OUT

export interface LfoFlags {
  oneShot: boolean;
  keySync: boolean;
  commonSync: boolean;
  delayTrigger: boolean;
  fadeMode: LfoFadeMode;
}

export interface LfoParams {
  waveform: LfoWaveform;
  phaseOffset: number; // 0–127
  slewRate: number; // 0–127
  delay: number; // 0–127
  delaySync: number; // 0–127
  rate: number; // 0–127
  rateSync: number; // 0–127
  flags: LfoFlags;
}

// ---------------------------------------------------------------------------
// FX
// ---------------------------------------------------------------------------

export interface FxParams {
  distortionLevel: number; // 0–127
  chorusLevel: number; // 0–127
  eqBassFrequency: number; // 0–127
  eqBassLevel: number; // 0–127
  eqMidFrequency: number; // 0–127
  eqMidLevel: number; // 0–127
  eqTrebleFrequency: number; // 0–127
  eqTrebleLevel: number; // 0–127
  distortionType: DistortionType;
  distortionCompensation: number; // 0–127
  chorusType: number; // 0–?
  chorusRate: number; // 0–127
  chorusRateSync: number; // 0–127
  chorusFeedback: number; // 0–127
  chorusModDepth: number; // 0–127
  chorusDelay: number; // 0–127
}

// ---------------------------------------------------------------------------
// Modulation matrix
// ---------------------------------------------------------------------------

export type ModMatrixSource =
  | 0 // DIRECT
  | 4 // VELOCITY
  | 5 // KEYBOARD
  | 6 // LFO_1_PLUS
  | 7 // LFO_1_PLUS_MINUS
  | 8 // LFO_2_PLUS
  | 9 // LFO_2_PLUS_MINUS
  | 10 // ENV_AMP
  | 11; // ENV_FILTER

export const MOD_SOURCE_NAMES: Partial<Record<number, string>> = {
  0: "Direct",
  4: "Velocity",
  5: "Keyboard",
  6: "LFO 1 (+)",
  7: "LFO 1 (±)",
  8: "LFO 2 (+)",
  9: "LFO 2 (±)",
  10: "Env Amp",
  11: "Env Filter",
};

export type ModMatrixDestination =
  | 0 // OSC_1_AND_2_PITCH
  | 1 // OSC_1_PITCH
  | 2 // OSC_2_PITCH
  | 3 // OSC_1_V_SYNC
  | 4 // OSC_2_V_SYNC
  | 5 // OSC_1_PULSE_WIDTH_INDEX
  | 6 // OSC_2_PULSE_WIDTH_INDEX
  | 7 // OSC_1_LEVEL
  | 8 // OSC_2_LEVEL
  | 9 // NOISE_LEVEL
  | 10 // RING_MODULATION_LEVEL
  | 11 // FILTER_DRIVE_AMOUNT
  | 12 // FILTER_FREQUENCY
  | 13 // FILTER_RESONANCE
  | 14 // LFO_1_RATE
  | 15 // LFO_2_RATE
  | 16 // AMP_ENVELOPE_DECAY
  | 17; // FILTER_ENVELOPE_DECAY

export const MOD_DEST_NAMES: Record<ModMatrixDestination, string> = {
  0: "Osc 1+2 Pitch",
  1: "Osc 1 Pitch",
  2: "Osc 2 Pitch",
  3: "Osc 1 V-Sync",
  4: "Osc 2 V-Sync",
  5: "Osc 1 Pulse Width",
  6: "Osc 2 Pulse Width",
  7: "Osc 1 Level",
  8: "Osc 2 Level",
  9: "Noise Level",
  10: "Ring Mod Level",
  11: "Filter Drive",
  12: "Filter Cutoff",
  13: "Filter Resonance",
  14: "LFO 1 Rate",
  15: "LFO 2 Rate",
  16: "Amp Env Decay",
  17: "Filter Env Decay",
};

export interface ModMatrixSlot {
  source1: ModMatrixSource;
  source2: ModMatrixSource;
  depth: number; // 0–127
  destination: ModMatrixDestination;
}

// ---------------------------------------------------------------------------
// Macro knobs
// ---------------------------------------------------------------------------

/** 71 possible macro knob destinations (0 = no destination) */
export type MacroDestination = number; // 0–70

export const MACRO_DEST_NAMES: Record<number, string> = {
  0: "None",
  1: "Portamento Rate",
  2: "Post FX Volume",
  3: "Osc 1 Wave Interp",
  4: "Osc 1 PW Index",
  5: "Osc 1 V-Sync",
  6: "Osc 1 Density",
  7: "Osc 1 Density Detune",
  8: "Osc 1 Semitones",
  9: "Osc 1 Cents",
  10: "Osc 2 Wave Interp",
  11: "Osc 2 PW Index",
  12: "Osc 2 V-Sync",
  13: "Osc 2 Density",
  14: "Osc 2 Density Detune",
  15: "Osc 2 Semitones",
  16: "Osc 2 Cents",
  17: "Osc 1 Volume",
  18: "Osc 2 Volume",
  19: "Ring Volume",
  20: "Noise Volume",
  21: "Cutoff",
  22: "Resonance",
  23: "Drive",
  24: "Key Track",
  25: "Env2 Mod",
  26: "Env1 Attack",
  27: "Env1 Decay",
  28: "Env1 Sustain",
  29: "Env1 Release",
  30: "Env2 Attack",
  31: "Env2 Decay",
  32: "Env2 Sustain",
  33: "Env2 Release",
  34: "Env3 Delay",
  35: "Env3 Attack",
  36: "Env3 Decay",
  37: "Env3 Sustain",
  38: "Env3 Release",
  39: "LFO1 Rate",
  40: "LFO1 Sync",
  41: "LFO1 Slew",
  42: "LFO2 Rate",
  43: "LFO2 Sync",
  44: "LFO2 Slew",
  45: "Dist Level",
  46: "Chorus Level",
  47: "Chorus Rate",
  48: "Chorus Feedback",
  49: "Chorus Depth",
  50: "Chorus Delay",
  51: "Mod 1",
  52: "Mod 2",
  53: "Mod 3",
  54: "Mod 4",
  55: "Mod 5",
  56: "Mod 6",
  57: "Mod 7",
  58: "Mod 8",
  59: "Mod 9",
  60: "Mod 10",
  61: "Mod 11",
  62: "Mod 12",
  63: "Mod 13",
  64: "Mod 14",
  65: "Mod 15",
  66: "Mod 16",
  67: "Mod 17",
  68: "Mod 18",
  69: "Mod 19",
  70: "Mod 20",
};

export interface MacroRange {
  destination: MacroDestination; // 0–70
  startPos: number; // 0–127
  endPos: number; // 0–127
  depth: number; // 0–127
}

export interface MacroKnob {
  position: number; // 0–127 (current knob value)
  ranges: [MacroRange, MacroRange, MacroRange, MacroRange]; // always 4
}

// ---------------------------------------------------------------------------
// Voice
// ---------------------------------------------------------------------------

export type PolyphonyMode = 0 | 1 | 2; // MONO, MONO_AG, POLY

export interface VoiceParams {
  polyphonyMode: PolyphonyMode;
  portamentoRate: number; // 0–127
  preGlide: number; // 0–127
  keyboardOctave: number; // 0–4 (centre = 2)
}

// ---------------------------------------------------------------------------
// Root patch model
// ---------------------------------------------------------------------------

export interface CircuitTracksPatch {
  /** Patch name: up to 16 ASCII characters, space-padded */
  name: string;
  /** Category index: 0–14 */
  category: number;
  /** Genre index */
  genre: number;

  voice: VoiceParams;
  oscillator1: OscParams;
  oscillator2: OscParams;
  mixer: MixerParams;
  filter: FilterParams;
  envelope1: EnvelopeParams; // Amp envelope (velocityOrDelay = velocity sensitivity)
  envelope2: EnvelopeParams; // Filter envelope
  envelope3: EnvelopeParams; // Mod envelope (velocityOrDelay = delay time)
  lfo1: LfoParams;
  lfo2: LfoParams;
  fx: FxParams;

  /** 20 modulation matrix slots */
  modMatrix: [
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
    ModMatrixSlot,
  ];

  /** 8 macro knobs */
  macroKnobs: [
    MacroKnob,
    MacroKnob,
    MacroKnob,
    MacroKnob,
    MacroKnob,
    MacroKnob,
    MacroKnob,
    MacroKnob,
  ];
}

/** Library metadata — not stored in SysEx, stored alongside on disk */
export interface PatchMeta {
  id: string;
  filePath: string;
  bank: string;
  slot: number;
  tags: string[];
  rating: number; // 0–5
  createdAt: string;
  updatedAt: string;
}
