/**
 * Hono router: defines all REST API endpoints.
 * WebSocket upgrade is handled in index.ts via Bun.serve.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// Allow requests from the Vite dev server (localhost:5173)
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get("/api/health", (c) => {
  return c.json({ ok: true, version: "0.1.0" });
});

// ---------------------------------------------------------------------------
// Device endpoints (stubbed — full implementation in Phase 2)
// ---------------------------------------------------------------------------

app.get("/api/devices", (c) => {
  // TODO: return list of available MIDI ports via node-midi
  return c.json({ devices: [] });
});

app.post("/api/devices/connect", async (c) => {
  // TODO: open MIDI port by name
  const { portName } = await c.req.json<{ portName: string }>();
  return c.json({ ok: true, portName });
});

// ---------------------------------------------------------------------------
// Patch endpoints (stubbed — full implementation in Phase 2)
// ---------------------------------------------------------------------------

app.get("/api/patches", (c) => {
  // TODO: list saved .syx patch files from disk
  return c.json({ patches: [] });
});

app.post("/api/patches/send", async (c) => {
  // TODO: encode patch and send to device via SysEx
  const body = await c.req.json();
  return c.json({ ok: true, body });
});

app.post("/api/patches/request", async (c) => {
  // TODO: send REQUEST_PATCH SysEx and await response
  const body = await c.req.json();
  return c.json({ ok: true, body });
});

// ---------------------------------------------------------------------------
// Sample endpoints (stubbed — full implementation in Phase 5)
// ---------------------------------------------------------------------------

app.get("/api/samples", (c) => {
  // TODO: list sample metadata
  return c.json({ samples: [] });
});

app.post("/api/samples/prepare", async (c) => {
  // TODO: accept multipart audio file, convert to 48kHz/16-bit/mono WAV
  return c.json({ ok: true });
});

export { app };
