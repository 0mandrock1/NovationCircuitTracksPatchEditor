/**
 * Default/init values for a new empty Circuit Tracks patch.
 */

import type {
  CircuitTracksPatch,
  EnvelopeParams,
  FxParams,
  LfoFlags,
  LfoParams,
  MacroKnob,
  MacroRange,
  ModMatrixSlot,
  OscParams,
} from "../types/patch.js";

function defaultOsc(): OscParams {
  return {
    wave: 2, // Sawtooth
    waveInterpolate: 0,
    pulseWidthIndex: 64,
    virtualSyncDepth: 0,
    density: 0,
    densityDetune: 0,
    semitones: 64, // 0 semitones (centre)
    cents: 64, // 0 cents (centre)
    pitchBend: 64,
  };
}

function defaultEnvelope(): EnvelopeParams {
  return { velocityOrDelay: 0, attack: 0, decay: 64, sustain: 80, release: 32 };
}

function defaultLfoFlags(): LfoFlags {
  return { oneShot: false, keySync: false, commonSync: false, delayTrigger: false, fadeMode: 0 };
}

function defaultLfo(): LfoParams {
  return {
    waveform: 0, // Sine
    phaseOffset: 0,
    slewRate: 0,
    delay: 0,
    delaySync: 0,
    rate: 64,
    rateSync: 0,
    flags: defaultLfoFlags(),
  };
}

function defaultFx(): FxParams {
  return {
    distortionLevel: 0,
    chorusLevel: 0,
    eqBassFrequency: 64,
    eqBassLevel: 64,
    eqMidFrequency: 64,
    eqMidLevel: 64,
    eqTrebleFrequency: 64,
    eqTrebleLevel: 64,
    distortionType: 0,
    distortionCompensation: 0,
    chorusType: 0,
    chorusRate: 64,
    chorusRateSync: 0,
    chorusFeedback: 0,
    chorusModDepth: 0,
    chorusDelay: 0,
  };
}

function defaultModSlot(): ModMatrixSlot {
  return { source1: 0, source2: 0, depth: 0, destination: 0 };
}

function defaultMacroRange(): MacroRange {
  return { destination: 0, startPos: 0, endPos: 127, depth: 64 };
}

function defaultMacro(): MacroKnob {
  return {
    position: 64,
    ranges: [defaultMacroRange(), defaultMacroRange(), defaultMacroRange(), defaultMacroRange()],
  };
}

export function defaultPatch(): CircuitTracksPatch {
  return {
    name: "Init Patch",
    category: 0,
    genre: 0,
    voice: {
      polyphonyMode: 2, // Poly
      portamentoRate: 0,
      preGlide: 0,
      keyboardOctave: 2, // centre
    },
    oscillator1: defaultOsc(),
    oscillator2: { ...defaultOsc(), wave: 2 },
    mixer: {
      osc1Level: 100,
      osc2Level: 0,
      ringModLevel: 0,
      noiseLevel: 0,
      preFxLevel: 100,
      postFxLevel: 100,
    },
    filter: {
      routing: 0,
      drive: 0,
      driveType: 0,
      type: 0, // LP 12dB
      frequency: 127,
      track: 0,
      resonance: 0,
      qNormalise: 0,
      env2ToFreq: 64,
    },
    envelope1: defaultEnvelope(),
    envelope2: defaultEnvelope(),
    envelope3: { ...defaultEnvelope(), velocityOrDelay: 0 },
    lfo1: defaultLfo(),
    lfo2: defaultLfo(),
    fx: defaultFx(),
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
    macroKnobs: [
      defaultMacro(),
      defaultMacro(),
      defaultMacro(),
      defaultMacro(),
      defaultMacro(),
      defaultMacro(),
      defaultMacro(),
      defaultMacro(),
    ],
  };
}
