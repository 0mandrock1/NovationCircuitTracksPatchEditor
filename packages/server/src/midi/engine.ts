/**
 * MidiEngine — JZZ-backed MIDI I/O for the Circuit Tracks server.
 *
 * Responsibilities:
 *   - Port enumeration (inputs + outputs)
 *   - Opening / closing a device connection by port name
 *   - SysEx send queue with 20 ms inter-message gating
 *   - CC send (immediate, bypass queue)
 *   - SysEx receive callbacks (parsed from raw MIDI input stream)
 *   - Port hotplug change notifications
 */

import { INTER_MESSAGE_DELAY_MS } from "@circuit-tracks/core";

// JZZ is a CommonJS module; require() is the reliable import path in Bun
const JZZ = require("jzz") as (...args: unknown[]) => Promise<JzzEngine>;

// Minimal structural types for JZZ objects we interact with
interface JzzPort {
  send(data: number[]): Promise<void>;
  connect(handler: (msg: number[]) => void): JzzPort;
  close(): Promise<void>;
}
interface JzzEngine {
  info(): {
    inputs: Array<{ name: string; manufacturer?: string }>;
    outputs: Array<{ name: string; manufacturer?: string }>;
  };
  refresh(): Promise<JzzEngine>;
  openMidiIn(arg?: string | number): Promise<JzzPort>;
  openMidiOut(arg?: string | number): Promise<JzzPort>;
  onChange(fn: () => void): { connect: (fn: () => void) => void };
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MidiPortInfo {
  name: string;
  manufacturer: string | undefined;
}

export interface MidiDeviceList {
  inputs: MidiPortInfo[];
  outputs: MidiPortInfo[];
}

export type SysExHandler = (data: Uint8Array) => void;
export type PortChangeHandler = (devices: MidiDeviceList) => void;

// ---------------------------------------------------------------------------
// SysEx send queue — enforces INTER_MESSAGE_DELAY_MS minimum gap
// ---------------------------------------------------------------------------

class SysExQueue {
  private readonly queue: Uint8Array[] = [];
  private running = false;
  private lastSentAt = 0;

  constructor(private readonly sendFn: (data: Uint8Array) => Promise<void>) {}

  push(data: Uint8Array): void {
    this.queue.push(data);
    if (!this.running) this.processNext();
  }

  private processNext(): void {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }
    this.running = true;
    const elapsed = Date.now() - this.lastSentAt;
    const wait = Math.max(0, INTER_MESSAGE_DELAY_MS - elapsed);
    setTimeout(async () => {
      const msg = this.queue.shift();
      if (msg) {
        try {
          await this.sendFn(msg);
        } catch (err) {
          console.error("[MIDI] SysEx send error:", err);
        }
        this.lastSentAt = Date.now();
      }
      this.processNext();
    }, wait);
  }
}

// ---------------------------------------------------------------------------
// MidiEngine
// ---------------------------------------------------------------------------

export class MidiEngine {
  private jzz: JzzEngine | null = null;
  private outputPort: JzzPort | null = null;
  private inputPort: JzzPort | null = null;
  private queue: SysExQueue | null = null;

  private readonly sysexHandlers = new Set<SysExHandler>();
  private readonly portChangeHandlers = new Set<PortChangeHandler>();

  connectedOutputName: string | null = null;
  connectedInputName: string | null = null;

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------

  async init(): Promise<void> {
    if (this.jzz) return;
    this.jzz = await JZZ();
    // Watch for hotplug events
    this.jzz
      .onChange(() => {
        this.emitPortChange();
      })
      .connect(() => {});
    console.log("[MIDI] JZZ engine ready");
  }

  private async ensureInit(): Promise<JzzEngine> {
    if (!this.jzz) await this.init();
    if (!this.jzz) throw new Error("JZZ failed to initialise");
    return this.jzz;
  }

  // ---------------------------------------------------------------------------
  // Port enumeration
  // ---------------------------------------------------------------------------

  async listDevices(): Promise<MidiDeviceList> {
    const engine = await this.ensureInit();
    const refreshed = await engine.refresh(); // returns updated engine with current port list
    const info = refreshed.info();
    return {
      inputs: info.inputs.map((p) => ({ name: p.name, manufacturer: p.manufacturer })),
      outputs: info.outputs.map((p) => ({ name: p.name, manufacturer: p.manufacturer })),
    };
  }

  // ---------------------------------------------------------------------------
  // Connect / disconnect
  // ---------------------------------------------------------------------------

  async connect(outputName: string, inputName: string): Promise<void> {
    await this.disconnect();
    const engine = await this.ensureInit();

    const outputPort = await engine.openMidiOut(outputName);
    this.outputPort = outputPort;
    this.connectedOutputName = outputName;

    this.queue = new SysExQueue(async (data: Uint8Array) => {
      await outputPort.send(Array.from(data));
    });

    this.inputPort = await engine.openMidiIn(inputName);
    this.connectedInputName = inputName;

    // Collect SysEx across JZZ message callbacks
    let sysexBuf: number[] = [];
    this.inputPort.connect((msg: number[]) => {
      for (const b of msg) {
        if (b === 0xf0) {
          sysexBuf = [b];
        } else if (b === 0xf7) {
          sysexBuf.push(b);
          const data = new Uint8Array(sysexBuf);
          for (const h of this.sysexHandlers) h(data);
          sysexBuf = [];
        } else if (sysexBuf.length > 0) {
          sysexBuf.push(b);
        }
      }
    });

    console.log(`[MIDI] Connected: out=${outputName}, in=${inputName}`);
  }

  async disconnect(): Promise<void> {
    if (this.inputPort) {
      try {
        await this.inputPort.close();
      } catch {}
      this.inputPort = null;
      this.connectedInputName = null;
    }
    if (this.outputPort) {
      try {
        await this.outputPort.close();
      } catch {}
      this.outputPort = null;
      this.connectedOutputName = null;
    }
    this.queue = null;
  }

  get isConnected(): boolean {
    return this.outputPort !== null;
  }

  // ---------------------------------------------------------------------------
  // Send
  // ---------------------------------------------------------------------------

  /** Queue a SysEx message with 20 ms inter-message gating. */
  sendSysEx(data: Uint8Array): void {
    if (!this.queue) {
      console.warn("[MIDI] sendSysEx: not connected");
      return;
    }
    this.queue.push(data);
  }

  /** Send a CC message immediately (bypasses the SysEx queue). */
  async sendCC(channel: number, cc: number, value: number): Promise<void> {
    if (!this.outputPort) {
      console.warn("[MIDI] sendCC: not connected");
      return;
    }
    const status = 0xb0 | (channel & 0x0f);
    await this.outputPort.send([status, cc & 0x7f, value & 0x7f]);
  }

  // ---------------------------------------------------------------------------
  // Event subscriptions
  // ---------------------------------------------------------------------------

  onSysEx(handler: SysExHandler): () => void {
    this.sysexHandlers.add(handler);
    return () => this.sysexHandlers.delete(handler);
  }

  onPortChange(handler: PortChangeHandler): () => void {
    this.portChangeHandlers.add(handler);
    return () => this.portChangeHandlers.delete(handler);
  }

  private async emitPortChange(): Promise<void> {
    try {
      const devices = await this.listDevices();
      for (const h of this.portChangeHandlers) h(devices);
    } catch {}
  }
}

// Singleton instance shared across the server process
export const midiEngine = new MidiEngine();
