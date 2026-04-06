/**
 * DeviceStatus — top-bar component showing MIDI connection state.
 *
 * Shows WS connection state, detected MIDI ports, and lets the user
 * connect / disconnect the MIDI engine from Circuit Tracks.
 */

import { useEffect } from "react";
import { useMidiStore } from "../../stores/midiStore.js";

export function DeviceStatus() {
  const { wsState, devices, connectedMidiOutput, connect, connectDevice, disconnectDevice } = useMidiStore();

  useEffect(() => {
    connect();
    // Leave WS open on unmount — store-managed lifecycle
  }, [connect]);

  const circuitOutputs = devices.filter((d) => d.type === "output" && d.isCircuitTracks);
  const circuitInputs = devices.filter((d) => d.type === "input" && d.isCircuitTracks);
  const hasCircuit = circuitOutputs.length > 0 && circuitInputs.length > 0;

  // Dot colour
  const dot =
    connectedMidiOutput
      ? "bg-green-500"
      : wsState === "connected"
        ? hasCircuit
          ? "bg-yellow-500 animate-pulse"
          : "bg-blue-500"
        : wsState === "connecting"
          ? "bg-yellow-500 animate-pulse"
          : wsState === "error"
            ? "bg-red-500"
            : "bg-gray-600";

  // Label
  let label: string;
  if (wsState !== "connected") {
    label =
      wsState === "connecting" ? "Connecting…" : wsState === "error" ? "Connection error" : "Disconnected";
  } else if (connectedMidiOutput) {
    label = connectedMidiOutput;
  } else if (hasCircuit) {
    label = `${circuitOutputs[0]!.name} — not connected`;
  } else {
    label = "Server OK — no Circuit Tracks";
  }

  const handleClick = () => {
    if (connectedMidiOutput) {
      disconnectDevice();
    } else if (hasCircuit) {
      connectDevice(circuitOutputs[0]!.name, circuitInputs[0]!.name);
    }
  };

  const isClickable = wsState === "connected" && (connectedMidiOutput !== null || hasCircuit);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      title={
        connectedMidiOutput
          ? "Click to disconnect MIDI"
          : hasCircuit
            ? "Click to connect MIDI"
            : undefined
      }
      className="flex items-center gap-2 text-xs font-mono disabled:cursor-default cursor-pointer"
    >
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-gray-400 truncate max-w-56">{label}</span>
    </button>
  );
}
