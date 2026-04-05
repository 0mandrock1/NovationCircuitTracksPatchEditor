/**
 * Default/init values for a new empty Circuit Tracks patch.
 */

import type {
  CircuitTracksPatch,
  MacroParams,
  ModMatrixSlot,
  OscillatorParams,
} from "../types/patch.js";

function defaultOscillator(): OscillatorParams {
  return {
    waveform: 2, // Sawtooth
    coarse: 24, // 0 semitones
    fine: 50, // 0 cents
    level: 100,
    pulseWidth: 64,
    virtualSync: 0,
    density: 0,
    densityDetune: 0,
    pitchEnvDepth: 64, // 0 depth
  };
}

function defaultModSlot(): ModMatrixSlot {
  return { source: "none", destination: "none", depth: 64 };
}

function defaultMacro(index: number): MacroParams {
  return {
    name: `Macro ${index + 1}`,
    value: 64,
    assignments: [],
  };
}

export function defaultPatch(): CircuitTracksPatch {
  return {
    name: "Init Patch",
    voice: {
      polyphonyMode: 2, // Poly
      portamentoTime: 0,
      preGlide: 0,
      keyboardOctave: 2, // 0 octave offset
    },
    oscillator1: defaultOscillator(),
    oscillator2: { ...defaultOscillator(), level: 0 },
    oscMix: 0,
    noiseLevel: 0,
    ringModLevel: 0,
    filter: {
      type: 0, // LP 12dB
      cutoff: 127,
      resonance: 0,
      drive: 0,
      envDepth: 64,
      keyTracking: 0,
      velocitySensitivity: 0,
    },
    envelope1: { attack: 0, decay: 64, sustain: 80, release: 32, velocityDepth: 64, loop: 0 },
    envelope2: { attack: 0, decay: 64, sustain: 80, release: 32, velocityDepth: 64, loop: 0 },
    envelope3: { attack: 0, decay: 64, sustain: 80, release: 32, velocityDepth: 64, loop: 0 },
    lfo1: { waveform: 0, rate: 64, sync: 0, syncRate: 2, phase: 0, slew: 0, oneShot: 0 },
    lfo2: { waveform: 0, rate: 64, sync: 0, syncRate: 2, phase: 0, slew: 0, oneShot: 0 },
    modMatrix: [
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
      defaultModSlot(),
    ],
    macros: [
      defaultMacro(0),
      defaultMacro(1),
      defaultMacro(2),
      defaultMacro(3),
      defaultMacro(4),
      defaultMacro(5),
      defaultMacro(6),
      defaultMacro(7),
    ],
    arp: { enabled: 0, rate: 2, gate: 64, octaveRange: 1, pattern: 0 },
    effects: {
      distortion: { position: 0, type: 0, drive: 0, level: 0 },
      chorus: { rate: 64, depth: 0, feedback: 0, level: 0 },
      reverb: { size: 64, decay: 64, filter: 64, level: 0 },
    },
  };
}
