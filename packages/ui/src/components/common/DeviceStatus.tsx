/**
 * DeviceStatus — shows WebMIDI access state and MIDI connection.
 *
 * On mount, requests MIDI access (triggers browser permission dialog).
 * Once granted, auto-connects to Circuit Tracks if found.
 * Clicking the button connects/disconnects manually.
 */

import { useEffect } from "react";
import { useMidiStore } from "../../stores/midiStore.js";

export function DeviceStatus() {
  const {
    accessState,
    inputs,
    outputs,
    connectedOutputId,
    requestAccess,
    connectDevice,
    disconnectDevice,
  } = useMidiStore();

  useEffect(() => {
    requestAccess();
  }, [requestAccess]);

  const circuitOut = outputs.find((p) => p.name.toLowerCase().includes("circuit"));
  const circuitIn = inputs.find((p) => p.name.toLowerCase().includes("circuit"));
  const hasCircuit = circuitOut !== undefined && circuitIn !== undefined;
  const isMidiConnected = connectedOutputId !== null;

  // ── dot colour ──────────────────────────────────────────────────────────
  const dot = isMidiConnected
    ? "bg-green-500"
    : accessState === "granted"
      ? hasCircuit
        ? "bg-yellow-500 animate-pulse"
        : "bg-blue-500"
      : accessState === "requesting"
        ? "bg-yellow-500 animate-pulse"
        : accessState === "denied" || accessState === "unavailable"
          ? "bg-red-500"
          : "bg-gray-600";

  // ── label ────────────────────────────────────────────────────────────────
  let label: string;
  if (accessState === "idle") {
    label = "Click to enable MIDI";
  } else if (accessState === "requesting") {
    label = "Requesting MIDI access…";
  } else if (accessState === "denied") {
    label = "MIDI access denied";
  } else if (accessState === "unavailable") {
    label = "WebMIDI not supported";
  } else if (isMidiConnected) {
    const name = outputs.find((p) => p.id === connectedOutputId)?.name ?? connectedOutputId;
    label = name;
  } else if (hasCircuit) {
    label = `${circuitOut.name} — click to connect`;
  } else {
    label = `No Circuit Tracks (${outputs.length} out, ${inputs.length} in)`;
  }

  const handleClick = () => {
    if (accessState === "idle" || accessState === "denied") {
      requestAccess();
    } else if (isMidiConnected) {
      disconnectDevice();
    } else if (hasCircuit) {
      connectDevice(circuitOut.id, circuitIn.id);
    }
  };

  const isClickable =
    accessState === "idle" ||
    accessState === "denied" ||
    (accessState === "granted" && (isMidiConnected || hasCircuit));

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      title={isMidiConnected ? "Click to disconnect MIDI" : hasCircuit ? "Click to connect MIDI" : undefined}
      className="flex items-center gap-2 text-xs font-mono disabled:cursor-default cursor-pointer"
    >
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-gray-400 truncate max-w-56">{label}</span>
    </button>
  );
}
