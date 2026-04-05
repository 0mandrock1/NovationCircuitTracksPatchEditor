/**
 * DeviceStatus — top-bar component showing MIDI connection state.
 * Connects to the Bun server WebSocket on mount.
 */

import type { MidiWsEvent } from "@circuit-tracks/core";
import { useEffect, useRef, useState } from "react";

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export function DeviceStatus() {
  const [connState, setConnState] = useState<ConnectionState>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  function connect() {
    setConnState("connecting");
    const ws = new WebSocket("/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnState("connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as MidiWsEvent;
        if (msg.type === "device.connected") {
          const circuitTracks = msg.devices.find((d) => d.isCircuitTracks);
          setDeviceName(circuitTracks?.name ?? null);
        } else if (msg.type === "device.disconnected") {
          setDeviceName(null);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      setConnState("error");
    };

    ws.onclose = () => {
      setConnState("disconnected");
      // Retry after 3s
      setTimeout(connect, 3000);
    };
  }

  const dot =
    connState === "connected"
      ? "bg-green-500"
      : connState === "connecting"
        ? "bg-yellow-500 animate-pulse"
        : connState === "error"
          ? "bg-red-500"
          : "bg-gray-600";

  const label =
    connState === "connected"
      ? (deviceName ?? "Server connected — no device")
      : connState === "connecting"
        ? "Connecting…"
        : connState === "error"
          ? "Connection error"
          : "Disconnected";

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-gray-400 truncate max-w-48">{label}</span>
    </div>
  );
}
