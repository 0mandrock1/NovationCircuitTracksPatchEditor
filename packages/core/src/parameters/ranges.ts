/**
 * Value ranges, defaults, and display helpers for every Circuit Tracks
 * patch parameter.
 */

export interface ParameterRange {
  /** Minimum stored value (raw byte) */
  min: number;
  /** Maximum stored value (raw byte) */
  max: number;
  /** Default stored value */
  default: number;
  /** Human-readable label */
  label: string;
  /** Optional function to convert raw value to display string */
  display?: (raw: number) => string;
}

// ---------------------------------------------------------------------------
// Common display helpers
// ---------------------------------------------------------------------------

const pct = (raw: number) => `${Math.round((raw / 127) * 100)}%`;
const bipolar = (raw: number) => {
  const v = raw - 64;
  return v === 0 ? "0" : v > 0 ? `+${v}` : `${v}`;
};
const semitones = (raw: number) => {
  const v = raw - 24;
  return v === 0 ? "0 st" : v > 0 ? `+${v} st` : `${v} st`;
};
const cents = (raw: number) => {
  const v = raw - 50;
  return v === 0 ? "0 ct" : v > 0 ? `+${v} ct` : `${v} ct`;
};

// ---------------------------------------------------------------------------
// Parameter range definitions
// ---------------------------------------------------------------------------

export const RANGES: Record<string, ParameterRange> = {
  // Oscillator
  OSC_WAVEFORM: { min: 0, max: 8, default: 2, label: "Waveform" },
  OSC_COARSE: { min: 0, max: 96, default: 24, label: "Coarse", display: semitones },
  OSC_FINE: { min: 0, max: 100, default: 50, label: "Fine", display: cents },
  OSC_LEVEL: { min: 0, max: 127, default: 100, label: "Level", display: pct },
  OSC_PULSE_WIDTH: { min: 0, max: 127, default: 64, label: "Pulse Width", display: pct },
  OSC_VIRTUAL_SYNC: { min: 0, max: 127, default: 0, label: "Virtual Sync", display: pct },
  OSC_DENSITY: { min: 0, max: 127, default: 0, label: "Density", display: pct },
  OSC_DENSITY_DETUNE: { min: 0, max: 127, default: 0, label: "Density Detune", display: pct },
  OSC_PITCH_ENV_DEPTH: {
    min: 0,
    max: 127,
    default: 64,
    label: "Pitch Env Depth",
    display: bipolar,
  },

  // Filter
  FILTER_CUTOFF: { min: 0, max: 127, default: 127, label: "Cutoff", display: pct },
  FILTER_RESONANCE: { min: 0, max: 127, default: 0, label: "Resonance", display: pct },
  FILTER_DRIVE: { min: 0, max: 127, default: 0, label: "Drive", display: pct },
  FILTER_ENV_DEPTH: { min: 0, max: 127, default: 64, label: "Env Depth", display: bipolar },
  FILTER_KEY_TRACKING: { min: 0, max: 127, default: 0, label: "Key Tracking", display: pct },
  FILTER_VELOCITY: { min: 0, max: 127, default: 0, label: "Velocity", display: pct },

  // Envelope
  ENV_ATTACK: {
    min: 0,
    max: 127,
    default: 0,
    label: "Attack",
    display: (r) => `${r}`,
  },
  ENV_DECAY: { min: 0, max: 127, default: 64, label: "Decay" },
  ENV_SUSTAIN: { min: 0, max: 127, default: 80, label: "Sustain", display: pct },
  ENV_RELEASE: { min: 0, max: 127, default: 32, label: "Release" },
  ENV_VELOCITY_DEPTH: {
    min: 0,
    max: 127,
    default: 64,
    label: "Vel Depth",
    display: bipolar,
  },

  // LFO
  LFO_RATE: { min: 0, max: 127, default: 64, label: "Rate" },
  LFO_PHASE: { min: 0, max: 127, default: 0, label: "Phase", display: pct },
  LFO_SLEW: { min: 0, max: 127, default: 0, label: "Slew", display: pct },

  // Mod matrix
  MOD_DEPTH: { min: 0, max: 127, default: 64, label: "Depth", display: bipolar },

  // Macro
  MACRO_VALUE: { min: 0, max: 127, default: 64, label: "Value", display: pct },
  MACRO_ASSIGNMENT_DEPTH: {
    min: 0,
    max: 127,
    default: 64,
    label: "Depth",
    display: bipolar,
  },

  // Voice
  PORTAMENTO_TIME: { min: 0, max: 127, default: 0, label: "Portamento", display: pct },
  PRE_GLIDE: { min: 0, max: 127, default: 0, label: "Pre-Glide", display: pct },

  // Effects
  FX_DRIVE: { min: 0, max: 127, default: 0, label: "Drive", display: pct },
  FX_LEVEL: { min: 0, max: 127, default: 0, label: "Level", display: pct },
  FX_RATE: { min: 0, max: 127, default: 64, label: "Rate" },
  FX_DEPTH: { min: 0, max: 127, default: 64, label: "Depth", display: pct },
  FX_FEEDBACK: { min: 0, max: 127, default: 0, label: "Feedback", display: pct },
  FX_SIZE: { min: 0, max: 127, default: 64, label: "Size", display: pct },
  FX_DECAY: { min: 0, max: 127, default: 64, label: "Decay", display: pct },
  FX_FILTER: { min: 0, max: 127, default: 64, label: "Filter", display: pct },
};
