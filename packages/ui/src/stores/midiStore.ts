/**
 * midiStore — browser-side MIDI via the Web MIDI API.
 *
 * Uses navigator.requestMIDIAccess({ sysex: true }) directly in the browser.
 * Chrome/Edge support this natively; no server-side MIDI bridge needed.
 *
 * The Bun server is still used for REST (file I/O, patch library).
 * Real-time MIDI send/receive happens client→hardware directly.
 */

import { buildRequestCurrentPatchMessage } from "@circuit-tracks/core";
import { create } from "zustand";

// ---------------------------------------------------------------------------
// Module-level WebMIDI handles (not serialised into React state)
// ---------------------------------------------------------------------------

let _access: MIDIAccess | null = null;
let _output: MIDIOutput | null = null;
let _inputId: string | null = null;

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface MidiPortInfo {
  id: string;
  name: string;
  manufacturer: string;
}

type AccessState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

interface MidiState {
  accessState: AccessState;
  inputs: MidiPortInfo[];
  outputs: MidiPortInfo[];
  connectedOutputId: string | null;
  connectedInputId: string | null;
  lastError: string | null;

  requestAccess: () => Promise<void>;
  connectDevice: (outputId: string, inputId: string) => void;
  disconnectDevice: () => void;
  sendSysEx: (data: Uint8Array) => void;
  sendCC: (channel: number, cc: number, value: number) => void;
  requestPatch: (synth: 1 | 2) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useMidiStore = create<MidiState>((set, get) => ({
  accessState: "idle",
  inputs: [],
  outputs: [],
  connectedOutputId: null,
  connectedInputId: null,
  lastError: null,

  async requestAccess() {
    if (get().accessState === "requesting") return;

    if (!navigator.requestMIDIAccess) {
      set({ accessState: "unavailable", lastError: "WebMIDI not supported in this browser" });
      return;
    }

    set({ accessState: "requesting", lastError: null });
    try {
      _access = await navigator.requestMIDIAccess({ sysex: true });
      set({ accessState: "granted" });

      refreshPortList();
      _access.onstatechange = () => {
        refreshPortList();
        // Re-run auto-connect in case the Circuit Tracks was just plugged in
        if (!get().connectedOutputId) autoConnect();
      };

      autoConnect();
    } catch (err) {
      set({ accessState: "denied", lastError: String(err) });
    }
  },

  connectDevice(outputId, inputId) {
    if (!_access) return;

    // Detach previous input listener
    if (_inputId) {
      const prev = _access.inputs.get(_inputId);
      if (prev) prev.onmidimessage = null;
    }

    _output = _access.outputs.get(outputId) ?? null;
    const input = _access.inputs.get(inputId) ?? null;
    _inputId = input?.id ?? null;

    if (input) input.onmidimessage = onMidiMessage;

    set({ connectedOutputId: _output?.id ?? null, connectedInputId: _inputId });
    if (_output) {
      console.log(`[MIDI] Connected: out=${_output.name}, in=${input?.name}`);
    }
  },

  disconnectDevice() {
    if (_access && _inputId) {
      const prev = _access.inputs.get(_inputId);
      if (prev) prev.onmidimessage = null;
    }
    _output = null;
    _inputId = null;
    set({ connectedOutputId: null, connectedInputId: null });
  },

  sendSysEx(data) {
    if (!_output) {
      console.warn("[MIDI] sendSysEx: not connected");
      return;
    }
    _output.send(data);
  },

  sendCC(channel, cc, value) {
    if (!_output) return;
    const status = 0xb0 | (channel & 0x0f);
    _output.send([status, cc & 0x7f, value & 0x7f]);
  },

  requestPatch(synth) {
    const data = buildRequestCurrentPatchMessage(synth);
    get().sendSysEx(data);
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function refreshPortList(): void {
  if (!_access) return;
  const inputs: MidiPortInfo[] = [];
  for (const p of _access.inputs.values()) {
    inputs.push({ id: p.id ?? "", name: p.name ?? "", manufacturer: p.manufacturer ?? "" });
  }
  const outputs: MidiPortInfo[] = [];
  for (const p of _access.outputs.values()) {
    outputs.push({ id: p.id ?? "", name: p.name ?? "", manufacturer: p.manufacturer ?? "" });
  }
  useMidiStore.setState({ inputs, outputs });
}

function autoConnect(): void {
  if (!_access || useMidiStore.getState().connectedOutputId) return;
  let outId: string | null = null;
  let inId: string | null = null;
  for (const p of _access.outputs.values()) {
    if ((p.name ?? "").toLowerCase().includes("circuit")) { outId = p.id ?? ""; break; }
  }
  for (const p of _access.inputs.values()) {
    if ((p.name ?? "").toLowerCase().includes("circuit")) { inId = p.id ?? ""; break; }
  }
  if (outId && inId) useMidiStore.getState().connectDevice(outId, inId);
}

function onMidiMessage(ev: MIDIMessageEvent): void {
  const data = ev.data;
  if (!data || data[0] !== 0xf0) return; // ignore non-SysEx

  import("./patchStore.js").then(({ usePatchStore }) => {
    import("@circuit-tracks/core").then(({ parsePatchSysEx }) => {
      try {
        const { patch, synth } = parsePatchSysEx(data);
        usePatchStore.getState().setPatch(patch, synth);
      } catch {
        // Non-patch SysEx (e.g. identity reply) — ignore
      }
    });
  });
}

export type { MidiState };
