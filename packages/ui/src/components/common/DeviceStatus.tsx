/**
 * DeviceStatus — top-bar component showing MIDI connection state.
 *
 * Reads from midiStore and triggers the initial WS connection on mount.
 */

import { useEffect } from "react";
import { useMidiStore } from "../../stores/midiStore.js";

export function DeviceStatus() {
  const { wsState, devices, connect } = useMidiStore();

  useEffect(() => {
    connect();
    return () => {
      // Leave WS open (store-managed); don't disconnect on unmount
    };
  }, [connect]);

  const circuitDevice = devices.find((d) => d.isCircuitTracks);

  const dot =
    wsState === "connected"
      ? "bg-green-500"
      : wsState === "connecting"
        ? "bg-yellow-500 animate-pulse"
        : wsState === "error"
          ? "bg-red-500"
          : "bg-gray-600";

  const label =
    wsState === "connected"
      ? (circuitDevice?.name ?? "Server OK — no Circuit Tracks")
      : wsState === "connecting"
        ? "Connecting…"
        : wsState === "error"
          ? "Connection error"
          : "Disconnected";

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-gray-400 truncate max-w-48">{label}</span>
    </div>
  );
}
