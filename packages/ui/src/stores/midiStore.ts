/**
 * midiStore — WebSocket MIDI bridge.
 *
 * Manages the WebSocket connection to the local Bun server, maintains the
 * list of available MIDI devices, and exposes actions to connect/disconnect
 * and send MIDI commands.
 */

import type { MidiDevice, MidiWsCommand, MidiWsEvent } from "@circuit-tracks/core";
import { create } from "zustand";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

interface MidiState {
  /** WebSocket connection to the Bun server */
  wsState: ConnectionState;
  /** Available MIDI ports (updated on device list events) */
  devices: MidiDevice[];
  /** Name of the MIDI output port the engine is connected to, or null */
  connectedMidiOutput: string | null;
  /** Last error message, if any */
  lastError: string | null;

  // Internals (not exposed to components)
  _ws: WebSocket | null;
  _reconnectTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  sendCommand: (cmd: MidiWsCommand) => void;
  connectDevice: (outputName: string, inputName: string) => void;
  disconnectDevice: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

// In dev, connect directly to the Bun server — avoids Vite WebSocket proxy issues.
// In production the Bun server serves the UI itself, so /ws resolves correctly.
const WS_URL = import.meta.env.DEV ? "ws://localhost:3847/ws" : "/ws";
const RECONNECT_DELAY_MS = 3000;

export const useMidiStore = create<MidiState>((set, get) => ({
  wsState: "disconnected",
  devices: [],
  connectedMidiOutput: null,
  lastError: null,
  _ws: null,
  _reconnectTimer: null,

  connect() {
    const state = get();
    if (state._ws || state.wsState === "connecting") return;

    set({ wsState: "connecting", lastError: null });
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      set({ wsState: "connected", _ws: ws });
    };

    ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(String(ev.data)) as MidiWsEvent;
        handleEvent(event);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      set({ wsState: "error", lastError: "WebSocket error" });
    };

    ws.onclose = () => {
      set({ wsState: "disconnected", _ws: null, connectedMidiOutput: null });
      // Schedule reconnect
      const timer = setTimeout(() => {
        set({ _reconnectTimer: null });
        get().connect();
      }, RECONNECT_DELAY_MS);
      set({ _reconnectTimer: timer });
    };

    set({ _ws: ws });
  },

  disconnect() {
    const { _ws, _reconnectTimer } = get();
    if (_reconnectTimer) clearTimeout(_reconnectTimer);
    _ws?.close();
    set({ wsState: "disconnected", _ws: null, _reconnectTimer: null, connectedMidiOutput: null });
  },

  sendCommand(cmd) {
    const { _ws, wsState } = get();
    if (wsState !== "connected" || !_ws) return;
    _ws.send(JSON.stringify(cmd));
  },

  connectDevice(outputName, inputName) {
    get().sendCommand({ type: "device.connect", outputName, inputName });
  },

  disconnectDevice() {
    get().sendCommand({ type: "device.disconnect" });
  },
}));

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

function handleEvent(event: MidiWsEvent): void {
  switch (event.type) {
    case "device.connected":
      useMidiStore.setState({ devices: event.devices });
      break;

    case "device.disconnected": {
      const { devices } = useMidiStore.getState();
      useMidiStore.setState({ devices: devices.filter((d) => d.id !== event.deviceId) });
      break;
    }

    case "midi.connected":
      useMidiStore.setState({ connectedMidiOutput: event.outputName });
      break;

    case "midi.disconnected":
      useMidiStore.setState({ connectedMidiOutput: null });
      break;

    case "patch.received":
      // Dispatch to patchStore — imported lazily to avoid circular deps
      import("./patchStore.js").then(({ usePatchStore }) => {
        // Raw SysEx bytes — parse them
        import("@circuit-tracks/core").then(({ parsePatchSysEx }) => {
          try {
            const { patch, synth } = parsePatchSysEx(new Uint8Array(event.data));
            usePatchStore.getState().setPatch(patch, synth);
          } catch (err) {
            console.error("[MIDI] Failed to parse received patch:", err);
          }
        });
      });
      break;

    case "cc.received":
      // TODO Phase 4: update knob visual feedback
      break;

    default:
      break;
  }
}

// Exported type alias for store state (useful for selectors)
export type { MidiState };
