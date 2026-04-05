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

import type { MidiWsCommand, MidiWsEvent } from "@circuit-tracks/core";
import { app } from "./router.js";

const PORT = Number.parseInt(process.env.PORT ?? "3847", 10);

// ---------------------------------------------------------------------------
// WebSocket client registry
// ---------------------------------------------------------------------------

const wsClients = new Set<WebSocket>();

/** Broadcast a typed event to all connected WebSocket clients */
function broadcast(event: MidiWsEvent): void {
  const payload = JSON.stringify(event);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// ---------------------------------------------------------------------------
// Bun.serve — HTTP + WebSocket on the same port
// ---------------------------------------------------------------------------

const _server = Bun.serve({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);

    // Upgrade WebSocket connections
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req, {
        data: { connectedAt: Date.now() },
      });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Serve static files from UI build (production)
    if (process.env.NODE_ENV === "production" && !url.pathname.startsWith("/api")) {
      const uiDist = `${import.meta.dir}/../../ui/dist`;
      const filePath = url.pathname === "/" ? `${uiDist}/index.html` : `${uiDist}${url.pathname}`;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }
      // SPA fallback
      return new Response(Bun.file(`${uiDist}/index.html`));
    }

    // Delegate all other requests to Hono router
    return app.fetch(req);
  },

  websocket: {
    open(ws) {
      wsClients.add(ws as unknown as WebSocket);
      console.log(`[WS] Client connected (${wsClients.size} total)`);

      // Send initial device state
      const event: MidiWsEvent = { type: "device.connected", devices: [] };
      ws.send(JSON.stringify(event));
    },

    message(ws, rawMessage) {
      try {
        const command = JSON.parse(String(rawMessage)) as MidiWsCommand;
        handleWsCommand(ws as unknown as WebSocket, command);
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    },

    close(ws) {
      wsClients.delete(ws as unknown as WebSocket);
      console.log(`[WS] Client disconnected (${wsClients.size} remaining)`);
    },
  },
});

// ---------------------------------------------------------------------------
// WebSocket command handler
// ---------------------------------------------------------------------------

function handleWsCommand(_ws: WebSocket, command: MidiWsCommand): void {
  switch (command.type) {
    case "device.connect":
      // TODO Phase 2: open MIDI port
      console.log(`[MIDI] Connect request: ${command.portName}`);
      break;
    case "patch.request":
      // TODO Phase 2: send REQUEST_PATCH SysEx
      console.log(`[MIDI] Patch request: synth ${command.synth}, slot ${command.slot}`);
      break;
    case "patch.send":
      // TODO Phase 2: encode and send patch SysEx
      console.log(`[MIDI] Patch send: synth ${command.synth}, slot ${command.slot}`);
      break;
    case "cc.send":
      // TODO Phase 2: send CC message
      console.log(`[MIDI] CC send: ch ${command.channel}, cc ${command.cc}, val ${command.value}`);
      break;
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
