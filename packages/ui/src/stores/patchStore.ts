/**
 * patchStore — current working patch + edit actions.
 *
 * The patch is edited immutably via immer. On every mutation the store also
 * triggers the MIDI send (real-time preview) via the midiStore.
 */

import {
  type CircuitTracksPatch,
  type EnvelopeParams,
  type FxParams,
  type LfoParams,
  type MacroKnob,
  type MixerParams,
  type ModMatrixSlot,
  type OscParams,
  buildReplaceCurrentPatchMessage,
  defaultPatch,
} from "@circuit-tracks/core";
import { produce } from "immer";
import { create } from "zustand";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface PatchState {
  patch: CircuitTracksPatch;
  /** Which synth slot the patch belongs to (1 or 2) */
  synth: 1 | 2;
  /** True while a patch request SysEx is in-flight */
  loading: boolean;
  /** Was the patch modified since last send? */
  dirty: boolean;

  // Actions
  setPatch: (patch: CircuitTracksPatch, synth?: 1 | 2) => void;
  setLoading: (loading: boolean) => void;

  // Partial patch updaters (all mark dirty + optionally live-preview via sendLive)
  setName: (name: string) => void;
  setOsc: (osc: 1 | 2, partial: Partial<OscParams>) => void;
  setMixer: (partial: Partial<MixerParams>) => void;
  setFilter: (key: keyof CircuitTracksPatch["filter"], value: number) => void;
  setEnvelope: (env: 1 | 2 | 3, key: keyof EnvelopeParams, value: number) => void;
  setLfo: (lfo: 1 | 2, partial: Partial<Omit<LfoParams, "flags">>) => void;
  setLfoFlag: (lfo: 1 | 2, flag: keyof LfoParams["flags"], value: boolean | number) => void;
  setFx: (partial: Partial<FxParams>) => void;
  setModSlot: (slot: number, partial: Partial<ModMatrixSlot>) => void;
  setMacroPosition: (index: number, position: number) => void;
  setMacroRange: (
    macroIndex: number,
    rangeIndex: number,
    partial: Partial<MacroKnob["ranges"][number]>
  ) => void;

  /** Build and return the SysEx bytes for the current patch */
  buildSysEx: () => Uint8Array;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePatchStore = create<PatchState>((set, get) => ({
  patch: defaultPatch(),
  synth: 1,
  loading: false,
  dirty: false,

  setPatch: (patch, synth) =>
    set({ patch, synth: synth ?? get().synth, dirty: false, loading: false }),

  setLoading: (loading) => set({ loading }),

  setName: (name) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        d.name = name;
      }),
      dirty: true,
    })),

  setOsc: (osc, partial) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        const target = osc === 1 ? d.oscillator1 : d.oscillator2;
        Object.assign(target, partial);
      }),
      dirty: true,
    })),

  setMixer: (partial) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        Object.assign(d.mixer, partial);
      }),
      dirty: true,
    })),

  setFilter: (key, value) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        (d.filter as Record<string, number>)[key] = value;
      }),
      dirty: true,
    })),

  setEnvelope: (env, key, value) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        const target = env === 1 ? d.envelope1 : env === 2 ? d.envelope2 : d.envelope3;
        (target as Record<string, number>)[key] = value;
      }),
      dirty: true,
    })),

  setLfo: (lfo, partial) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        const target = lfo === 1 ? d.lfo1 : d.lfo2;
        Object.assign(target, partial);
      }),
      dirty: true,
    })),

  setLfoFlag: (lfo, flag, value) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        const target = lfo === 1 ? d.lfo1 : d.lfo2;
        (target.flags as Record<string, boolean | number>)[flag] = value;
      }),
      dirty: true,
    })),

  setFx: (partial) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        Object.assign(d.fx, partial);
      }),
      dirty: true,
    })),

  setModSlot: (slot, partial) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        const target = d.modMatrix[slot];
        if (target) Object.assign(target, partial);
      }),
      dirty: true,
    })),

  setMacroPosition: (index, position) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        const macro = d.macroKnobs[index];
        if (macro) macro.position = position;
      }),
      dirty: true,
    })),

  setMacroRange: (macroIndex, rangeIndex, partial) =>
    set((s) => ({
      patch: produce(s.patch, (d) => {
        const range = d.macroKnobs[macroIndex]?.ranges[rangeIndex];
        if (range) Object.assign(range, partial);
      }),
      dirty: true,
    })),

  buildSysEx: () => {
    const { patch, synth } = get();
    return buildReplaceCurrentPatchMessage(patch, synth);
  },
}));
