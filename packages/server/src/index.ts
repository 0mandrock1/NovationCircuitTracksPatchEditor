/**
 * Circuit Tracks Patch Editor — Bun local server
 *
 * Serves:
 *   - REST API at /api/* (via Hono)
 *   - WebSocket at /ws (for real-time MIDI events)
 *   - Static React build at /* in production
 *
 * In development, Vite dev server (port 5173) proxies /api and /ws here.
 */

import { buildRequestCurrentPatchMessage, parsePatchSysEx } from "@circuit-tracks/core";
import type { MidiDevice, MidiWsCommand, MidiWsEvent } from "@circuit-tracks/core";
import type { ServerWebSocket } from "bun";
import { midiEngine } from "./midi/engine.js";
import { app } from "./router.js";

const PORT = Number.parseInt(process.env.PORT ?? "3847", 10);

type WsData = { connectedAt: number };
type BunWS = ServerWebSocket<WsData>;

// ---------------------------------------------------------------------------
// WebSocket client registry
// ---------------------------------------------------------------------------

const clients = new Set<BunWS>();

/** Broadcast a typed event to all connected WebSocket clients */
function broadcast(event: MidiWsEvent): void {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    client.send(payload);
  }
}

// ---------------------------------------------------------------------------
// Initialise MIDI engine and register callbacks
// ---------------------------------------------------------------------------

midiEngine.init().catch((err) => {
  console.error("[MIDI] Failed to initialise JZZ engine:", err);
});

// Forward incoming SysEx bytes to connected UI clients
midiEngine.onSysEx((data) => {
  try {
    const { synth, slot } = parsePatchSysEx(data);
    const event: MidiWsEvent = {
      type: "patch.received",
      synth,
      slot,
      data: Array.from(data),
    };
    broadcast(event);
  } catch {
    // Non-patch SysEx (clock, etc.) — ignore
  }
});

// Notify clients when MIDI ports change
midiEngine.onPortChange((devices) => {
  // Map MidiPortInfo → MidiDevice for the event
  const midiDevices: MidiDevice[] = [
    ...devices.inputs.map((p) => ({
      id: p.name,
      name: p.name,
      type: "input" as const,
      isCircuitTracks: p.name.toLowerCase().includes("circuit"),
    })),
    ...devices.outputs.map((p) => ({
      id: p.name,
      name: p.name,
      type: "output" as const,
      isCircuitTracks: p.name.toLowerCase().includes("circuit"),
    })),
  ];
  broadcast({ type: "device.connected", devices: midiDevices });
  console.log(`[MIDI] Ports changed: ${devices.inputs.length} in, ${devices.outputs.length} out`);
});

// ---------------------------------------------------------------------------
// Bun.serve — HTTP + WebSocket on the same port
// ---------------------------------------------------------------------------

Bun.serve<WsData>({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req, {
        data: { connectedAt: Date.now() },
      });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    if (process.env.NODE_ENV === "production" && !url.pathname.startsWith("/api")) {
      const uiDist = `${import.meta.dir}/../../ui/dist`;
      const filePath = url.pathname === "/" ? `${uiDist}/index.html` : `${uiDist}${url.pathname}`;
      const file = Bun.file(filePath);
      if (await file.exists()) return new Response(file);
      return new Response(Bun.file(`${uiDist}/index.html`));
    }

    return app.fetch(req);
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      console.log(`[WS] Client connected (${clients.size} total)`);

      // Send initial device list
      midiEngine
        .listDevices()
        .then((devices) => {
          const midiDevices: MidiDevice[] = [
            ...devices.inputs.map((p) => ({
              id: p.name,
              name: p.name,
              type: "input" as const,
              isCircuitTracks: p.name.toLowerCase().includes("circuit"),
            })),
            ...devices.outputs.map((p) => ({
              id: p.name,
              name: p.name,
              type: "output" as const,
              isCircuitTracks: p.name.toLowerCase().includes("circuit"),
            })),
          ];
          const event: MidiWsEvent = { type: "device.connected", devices: midiDevices };
          ws.send(JSON.stringify(event));
        })
        .catch(() => {});
    },

    message(ws, rawMessage) {
      try {
        const command = JSON.parse(String(rawMessage)) as MidiWsCommand;
        handleWsCommand(ws, command);
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    },

    close(ws) {
      clients.delete(ws);
      console.log(`[WS] Client disconnected (${clients.size} remaining)`);
    },
  },
});

// ---------------------------------------------------------------------------
// WebSocket command handler
// ---------------------------------------------------------------------------

function handleWsCommand(ws: BunWS, command: MidiWsCommand): void {
  switch (command.type) {
    case "device.connect": {
      const portName = command.portName;
      midiEngine
        .connect(portName, portName)
        .then(async () => {
          const devices = await midiEngine.listDevices();
          const midiDevices: MidiDevice[] = [
            ...devices.inputs.map((p) => ({
              id: p.name,
              name: p.name,
              type: "input" as const,
              isCircuitTracks: p.name.toLowerCase().includes("circuit"),
            })),
            ...devices.outputs.map((p) => ({
              id: p.name,
              name: p.name,
              type: "output" as const,
              isCircuitTracks: p.name.toLowerCase().includes("circuit"),
            })),
          ];
          const event: MidiWsEvent = { type: "device.connected", devices: midiDevices };
          ws.send(JSON.stringify(event));
        })
        .catch((err) => {
          console.error(`[MIDI] Failed to connect to ${portName}:`, err);
          // No "error" event in MidiWsEvent — log server-side only
        });
      break;
    }

    case "patch.request": {
      const msg = buildRequestCurrentPatchMessage(command.synth);
      midiEngine.sendSysEx(msg);
      break;
    }

    case "patch.send": {
      // data is a raw SysEx byte array (built by the UI via buildReplaceCurrentPatchMessage)
      const msg = new Uint8Array(command.data);
      midiEngine.sendSysEx(msg);
      break;
    }

    case "cc.send": {
      midiEngine.sendCC(command.channel, command.cc, command.value).catch((err) => {
        console.error("[MIDI] CC send failed:", err);
      });
      break;
    }

    case "sample.request":
      // TODO Phase 5
      console.log(`[MIDI] Sample request: slot ${command.slot}`);
      break;

    case "sample.send":
      // TODO Phase 5
      console.log(`[MIDI] Sample send: slot ${command.slot}`);
      break;

    default:
      console.warn("[WS] Unknown command:", command);
  }
}

console.log(`Circuit Tracks Editor server running on http://localhost:${PORT}`);

export { broadcast };
