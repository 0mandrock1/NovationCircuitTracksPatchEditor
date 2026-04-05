/**
 * MIDI device and message types used across server and UI.
 */

export interface MidiDevice {
  id: string;
  name: string;
  type: "input" | "output";
  isCircuitTracks: boolean;
}

export interface SysExMessage {
  /** Full message bytes including F0 header and F7 terminator */
  bytes: Uint8Array;
  /** Timestamp when message was received (ms since epoch) */
  timestamp: number;
}

/** Incoming MIDI CC event */
export interface CcEvent {
  channel: number; // 1–16
  cc: number; // 0–127
  value: number; // 0–127
}

/** Incoming MIDI Program Change event */
export interface ProgramChangeEvent {
  channel: number;
  program: number; // 0–127
}

/** Events broadcast from server to UI via WebSocket */
export type MidiWsEvent =
  | { type: "device.connected"; devices: MidiDevice[] }
  | { type: "device.disconnected"; deviceId: string }
  | { type: "patch.received"; synth: 1 | 2; slot: number; data: number[] }
  | { type: "sample.received"; slot: number; data: number[] }
  | { type: "sysex.ack"; messageId: string }
  | { type: "sysex.error"; messageId: string; error: string }
  | { type: "cc.received"; event: CcEvent };

/** Commands sent from UI to server via WebSocket */
export type MidiWsCommand =
  | { type: "device.connect"; portName: string }
  | { type: "patch.request"; synth: 1 | 2; slot: number }
  | { type: "patch.send"; synth: 1 | 2; slot: number; data: number[] }
  | { type: "cc.send"; channel: number; cc: number; value: number }
  | { type: "sample.request"; slot: number }
  | { type: "sample.send"; slot: number; data: number[] };
