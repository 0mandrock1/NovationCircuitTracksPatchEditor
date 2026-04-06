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
  isPreviewing: boolean;

  requestAccess: () => Promise<void>;
  connectDevice: (outputId: string, inputId: string) => void;
  disconnectDevice: () => void;
  sendSysEx: (data: Uint8Array) => void;
  sendCC: (channel: number, cc: number, value: number) => void;
  requestPatch: (synth: 1 | 2) => void;
  /** Play a note on the given synth channel (1 or 2) then release after durationMs. */
  previewNote: (synth: 1 | 2, note?: number, velocity?: number, durationMs?: number) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

// Timer handle for the pending Note Off
let _previewTimer: ReturnType<typeof setTimeout> | null = null;

export const useMidiStore = create<MidiState>((set, get) => ({
  accessState: "idle",
  inputs: [],
  outputs: [],
  connectedOutputId: null,
  connectedInputId: null,
  lastError: null,
  isPreviewing: false,

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

  previewNote(synth, note = 60, velocity = 100, durationMs = 600) {
    if (!_output) return;
    // Cancel any in-flight preview
    if (_previewTimer !== null) {
      clearTimeout(_previewTimer);
      _previewTimer = null;
    }

    // Circuit Tracks: Synth 1 → MIDI ch 1, Synth 2 → MIDI ch 2 (0-indexed: 0 and 1)
    const ch = synth - 1;
    _output.send([0x90 | ch, note, velocity]);
    set({ isPreviewing: true });

    _previewTimer = setTimeout(() => {
      _output?.send([0x80 | ch, note, 0]);
      _previewTimer = null;
      set({ isPreviewing: false });
    }, durationMs);
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
