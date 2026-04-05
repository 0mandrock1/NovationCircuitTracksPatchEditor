/**
 * MIDI CC number assignments for Circuit Tracks parameters.
 *
 * Source: Circuit Tracks Programmer's Reference Guide v3 + community verification.
 * CC messages should be sent on the synth's MIDI channel (ch 1 for Synth 1, ch 2 for Synth 2).
 */

export interface CcMapping {
  cc: number;
  label: string;
  /** Offset key in OFFSETS, if this CC directly maps to a patch parameter */
  offsetKey?: string;
}

/** CC mappings for both synth channels (same CCs, different MIDI channels) */
export const CC_MAP: Record<string, CcMapping> = {
  // Voice
  POLYPHONY_MODE: { cc: 3, label: "Polyphony Mode", offsetKey: "VOICE_POLYPHONY_MODE" },
  PORTAMENTO_TIME: { cc: 5, label: "Portamento Time", offsetKey: "VOICE_PORTAMENTO_TIME" },
  PRE_GLIDE: { cc: 9, label: "Pre-Glide", offsetKey: "VOICE_PRE_GLIDE" },
  KEYBOARD_OCTAVE: { cc: 13, label: "Keyboard Octave", offsetKey: "VOICE_KEYBOARD_OCTAVE" },

  // Oscillator 1
  OSC1_WAVEFORM: { cc: 19, label: "Osc 1 Waveform", offsetKey: "OSC1_WAVEFORM" },
  OSC1_PULSE_WIDTH: { cc: 20, label: "Osc 1 Pulse Width", offsetKey: "OSC1_PULSE_WIDTH" },
  OSC1_VIRTUAL_SYNC: { cc: 21, label: "Osc 1 Virtual Sync", offsetKey: "OSC1_VIRTUAL_SYNC" },
  OSC1_DENSITY: { cc: 22, label: "Osc 1 Density", offsetKey: "OSC1_DENSITY" },
  OSC1_DENSITY_DETUNE: {
    cc: 23,
    label: "Osc 1 Density Detune",
    offsetKey: "OSC1_DENSITY_DETUNE",
  },
  OSC1_COARSE: { cc: 24, label: "Osc 1 Coarse", offsetKey: "OSC1_COARSE" },
  OSC1_FINE: { cc: 25, label: "Osc 1 Fine", offsetKey: "OSC1_FINE" },
  OSC1_LEVEL: { cc: 26, label: "Osc 1 Level", offsetKey: "OSC1_LEVEL" },

  // Oscillator 2
  OSC2_WAVEFORM: { cc: 29, label: "Osc 2 Waveform", offsetKey: "OSC2_WAVEFORM" },
  OSC2_PULSE_WIDTH: { cc: 30, label: "Osc 2 Pulse Width", offsetKey: "OSC2_PULSE_WIDTH" },
  OSC2_VIRTUAL_SYNC: { cc: 31, label: "Osc 2 Virtual Sync", offsetKey: "OSC2_VIRTUAL_SYNC" },
  OSC2_DENSITY: { cc: 32, label: "Osc 2 Density", offsetKey: "OSC2_DENSITY" },
  OSC2_DENSITY_DETUNE: {
    cc: 33,
    label: "Osc 2 Density Detune",
    offsetKey: "OSC2_DENSITY_DETUNE",
  },
  OSC2_COARSE: { cc: 34, label: "Osc 2 Coarse", offsetKey: "OSC2_COARSE" },
  OSC2_FINE: { cc: 35, label: "Osc 2 Fine", offsetKey: "OSC2_FINE" },
  OSC2_LEVEL: { cc: 36, label: "Osc 2 Level", offsetKey: "OSC2_LEVEL" },

  // Mixer
  OSC_MIX: { cc: 40, label: "Osc Mix", offsetKey: "MIX_OSC_BALANCE" },
  NOISE_LEVEL: { cc: 41, label: "Noise Level", offsetKey: "MIX_NOISE_LEVEL" },
  RING_MOD: { cc: 42, label: "Ring Mod", offsetKey: "MIX_RING_MOD_LEVEL" },

  // Filter
  FILTER_CUTOFF: { cc: 74, label: "Filter Cutoff", offsetKey: "FILTER_CUTOFF" },
  FILTER_RESONANCE: { cc: 71, label: "Filter Resonance", offsetKey: "FILTER_RESONANCE" },
  FILTER_DRIVE: { cc: 60, label: "Filter Drive", offsetKey: "FILTER_DRIVE" },
  FILTER_ENV_DEPTH: { cc: 61, label: "Filter Env Depth", offsetKey: "FILTER_ENV_DEPTH" },

  // Envelope 1
  ENV1_ATTACK: { cc: 70, label: "Env 1 Attack", offsetKey: "ENV1_ATTACK" },
  ENV1_DECAY: { cc: 78, label: "Env 1 Decay", offsetKey: "ENV1_DECAY" },
  ENV1_SUSTAIN: { cc: 79, label: "Env 1 Sustain", offsetKey: "ENV1_SUSTAIN" },
  ENV1_RELEASE: { cc: 72, label: "Env 1 Release", offsetKey: "ENV1_RELEASE" },

  // Envelope 2
  ENV2_ATTACK: { cc: 80, label: "Env 2 Attack", offsetKey: "ENV2_ATTACK" },
  ENV2_DECAY: { cc: 81, label: "Env 2 Decay", offsetKey: "ENV2_DECAY" },
  ENV2_SUSTAIN: { cc: 82, label: "Env 2 Sustain", offsetKey: "ENV2_SUSTAIN" },
  ENV2_RELEASE: { cc: 83, label: "Env 2 Release", offsetKey: "ENV2_RELEASE" },

  // LFO 1
  LFO1_RATE: { cc: 90, label: "LFO 1 Rate", offsetKey: "LFO1_RATE" },

  // LFO 2
  LFO2_RATE: { cc: 92, label: "LFO 2 Rate", offsetKey: "LFO2_RATE" },

  // Effects
  DISTORTION_LEVEL: { cc: 91, label: "Distortion", offsetKey: "FX_DIST_LEVEL" },
  CHORUS_LEVEL: { cc: 93, label: "Chorus", offsetKey: "FX_CHORUS_LEVEL" },
  REVERB_LEVEL: { cc: 95, label: "Reverb", offsetKey: "FX_REVERB_LEVEL" },

  // Macros (CC 107–114 for macros 1–8)
  MACRO_1: { cc: 107, label: "Macro 1" },
  MACRO_2: { cc: 108, label: "Macro 2" },
  MACRO_3: { cc: 109, label: "Macro 3" },
  MACRO_4: { cc: 110, label: "Macro 4" },
  MACRO_5: { cc: 111, label: "Macro 5" },
  MACRO_6: { cc: 112, label: "Macro 6" },
  MACRO_7: { cc: 113, label: "Macro 7" },
  MACRO_8: { cc: 114, label: "Macro 8" },
};

/** Reverse lookup: CC number → mapping key */
export const CC_REVERSE: Record<number, string> = Object.fromEntries(
  Object.entries(CC_MAP).map(([key, val]) => [val.cc, key])
);
