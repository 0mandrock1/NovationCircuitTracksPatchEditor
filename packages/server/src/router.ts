/**
 * Hono router: defines all REST API endpoints.
 * WebSocket upgrade is handled in index.ts via Bun.serve.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { midiEngine } from "./midi/engine.js";

const app = new Hono();

// Allow requests from the Vite dev server (localhost:5173)
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
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
// Device endpoints
// ---------------------------------------------------------------------------

app.get("/api/devices", async (c) => {
  const devices = await midiEngine.listDevices();
  return c.json({
    devices,
    connected: {
      output: midiEngine.connectedOutputName,
      input: midiEngine.connectedInputName,
    },
  });
});

app.post("/api/devices/connect", async (c) => {
  const { outputName, inputName } = await c.req.json<{
    outputName: string;
    inputName: string;
  }>();
  try {
    await midiEngine.connect(outputName, inputName);
    return c.json({ ok: true, outputName, inputName });
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

app.post("/api/devices/disconnect", async (c) => {
  await midiEngine.disconnect();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Patch endpoints (stubbed — SysEx send is via WebSocket in Phase 2)
// ---------------------------------------------------------------------------

app.get("/api/patches", (c) => {
  // TODO Phase 3: list saved .syx patch files from disk
  return c.json({ patches: [] });
});

app.post("/api/patches/send", async (c) => {
  // TODO Phase 3: encode patch and send to device via SysEx
  const body = await c.req.json();
  return c.json({ ok: true, body });
});

app.post("/api/patches/request", async (c) => {
  // TODO Phase 3: send REQUEST_PATCH SysEx and await response
  const body = await c.req.json();
  return c.json({ ok: true, body });
});

// ---------------------------------------------------------------------------
// Sample endpoints (stubbed — full implementation in Phase 5)
// ---------------------------------------------------------------------------

app.get("/api/samples", (c) => {
  // TODO Phase 5: list sample metadata
  return c.json({ samples: [] });
});

app.post("/api/samples/prepare", async (_c) => {
  // TODO Phase 5: accept multipart audio file, convert to 48kHz/16-bit/mono WAV
  return _c.json({ ok: true });
});

export { app };
