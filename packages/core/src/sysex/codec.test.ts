/**
 * Round-trip tests for patch encode ↔ decode.
 *
 * These tests verify that:
 * 1. A default patch survives encode → decode without data loss.
 * 2. Custom parameter values survive the round-trip.
 * 3. SysEx messages have correct framing (header, length, terminator).
 */

import { describe, expect, test } from "bun:test";
import { encodePayload } from "./builder.js";
import { buildReplacePatchMessage, buildRequestPatchMessage } from "./builder.js";
import {
  CIRCUIT_TRACKS_HEADER,
  MessageType,
  PATCH_DATA_LENGTH,
  PATCH_SYSEX_LENGTH,
  SYSEX_END,
} from "./constants.js";
import { defaultPatch } from "./defaults.js";
import { parsePayload } from "./parser.js";

// ---------------------------------------------------------------------------
// Payload round-trip
// ---------------------------------------------------------------------------

describe("Patch payload round-trip", () => {
  test("default patch survives encode → decode", () => {
    const original = defaultPatch();
    const encoded = encodePayload(original);
    const decoded = parsePayload(encoded);

    expect(decoded.name).toBe(original.name);
    expect(decoded.voice.polyphonyMode).toBe(original.voice.polyphonyMode);
    expect(decoded.voice.portamentoTime).toBe(original.voice.portamentoTime);
    expect(decoded.filter.cutoff).toBe(original.filter.cutoff);
    expect(decoded.filter.resonance).toBe(original.filter.resonance);
    expect(decoded.oscillator1.waveform).toBe(original.oscillator1.waveform);
    expect(decoded.oscillator1.coarse).toBe(original.oscillator1.coarse);
    expect(decoded.oscillator1.fine).toBe(original.oscillator1.fine);
    expect(decoded.envelope1.attack).toBe(original.envelope1.attack);
    expect(decoded.envelope1.sustain).toBe(original.envelope1.sustain);
    expect(decoded.lfo1.waveform).toBe(original.lfo1.waveform);
    expect(decoded.lfo1.rate).toBe(original.lfo1.rate);
    expect(decoded.effects.reverb.level).toBe(original.effects.reverb.level);
  });

  test("custom parameter values survive round-trip", () => {
    const patch = defaultPatch();
    patch.name = "TestPatch";
    patch.filter.cutoff = 42;
    patch.filter.resonance = 100;
    patch.oscillator1.waveform = 4; // Square
    patch.oscillator1.coarse = 48; // +24 semitones
    patch.envelope1.attack = 90;
    patch.envelope1.sustain = 50;
    patch.lfo1.rate = 99;
    patch.lfo1.sync = 1;
    patch.effects.reverb.level = 80;
    patch.effects.distortion.drive = 64;
    patch.modMatrix[0]!.source = "lfo1";
    patch.modMatrix[0]!.destination = "filterCutoff";
    patch.modMatrix[0]!.depth = 100;

    const decoded = parsePayload(encodePayload(patch));

    expect(decoded.name).toBe("TestPatch");
    expect(decoded.filter.cutoff).toBe(42);
    expect(decoded.filter.resonance).toBe(100);
    expect(decoded.oscillator1.waveform).toBe(4);
    expect(decoded.oscillator1.coarse).toBe(48);
    expect(decoded.envelope1.attack).toBe(90);
    expect(decoded.envelope1.sustain).toBe(50);
    expect(decoded.lfo1.rate).toBe(99);
    expect(decoded.lfo1.sync).toBe(1);
    expect(decoded.effects.reverb.level).toBe(80);
    expect(decoded.effects.distortion.drive).toBe(64);
    expect(decoded.modMatrix[0]!.source).toBe("lfo1");
    expect(decoded.modMatrix[0]!.destination).toBe("filterCutoff");
    expect(decoded.modMatrix[0]!.depth).toBe(100);
  });

  test("encoded payload is exactly PATCH_DATA_LENGTH bytes", () => {
    const data = encodePayload(defaultPatch());
    expect(data.length).toBe(PATCH_DATA_LENGTH);
  });

  test("all 20 mod matrix slots round-trip", () => {
    const patch = defaultPatch();
    patch.modMatrix[5]!.source = "env2";
    patch.modMatrix[5]!.destination = "osc2Pitch";
    patch.modMatrix[5]!.depth = 32;
    patch.modMatrix[19]!.source = "velocity";
    patch.modMatrix[19]!.destination = "filterResonance";
    patch.modMatrix[19]!.depth = 110;

    const decoded = parsePayload(encodePayload(patch));
    expect(decoded.modMatrix[5]!.source).toBe("env2");
    expect(decoded.modMatrix[5]!.destination).toBe("osc2Pitch");
    expect(decoded.modMatrix[5]!.depth).toBe(32);
    expect(decoded.modMatrix[19]!.source).toBe("velocity");
    expect(decoded.modMatrix[19]!.destination).toBe("filterResonance");
    expect(decoded.modMatrix[19]!.depth).toBe(110);
  });
});

// ---------------------------------------------------------------------------
// SysEx message framing
// ---------------------------------------------------------------------------

describe("SysEx message framing", () => {
  test("Replace Patch message has correct length", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    expect(msg.length).toBe(PATCH_SYSEX_LENGTH);
  });

  test("Replace Patch message starts with Circuit Tracks header", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    for (let i = 0; i < CIRCUIT_TRACKS_HEADER.length; i++) {
      expect(msg[i]).toBe(CIRCUIT_TRACKS_HEADER[i]);
    }
  });

  test("Replace Patch message ends with F7", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    expect(msg[msg.length - 1]).toBe(SYSEX_END);
  });

  test("Replace Patch message type byte is REPLACE_PATCH", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 7);
    expect(msg[5]).toBe(MessageType.REPLACE_PATCH);
  });

  test("slot number is encoded correctly", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 42);
    expect(msg[7]).toBe(42);
  });

  test("synth 1 encoded as 0x00", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    expect(msg[6]).toBe(0x00);
  });

  test("synth 2 encoded as 0x01", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 2, 0);
    expect(msg[6]).toBe(0x01);
  });

  test("Request Patch message structure", () => {
    const msg = buildRequestPatchMessage(1, 5);
    // F0 00 20 29 02 <msg_type> <synth> <slot> F7
    expect(msg[0]).toBe(0xf0);
    expect(msg[msg.length - 1]).toBe(SYSEX_END);
    expect(msg[5]).toBe(MessageType.REQUEST_PATCH);
    expect(msg[6]).toBe(0x00); // synth 1
    expect(msg[7]).toBe(5); // slot
  });
});

// ---------------------------------------------------------------------------
// Name encoding
// ---------------------------------------------------------------------------

describe("Patch name encoding", () => {
  test("name is trimmed to 15 characters", () => {
    const patch = defaultPatch();
    patch.name = "VeryLongPatchNameThatExceeds15Chars";
    const decoded = parsePayload(encodePayload(patch));
    expect(decoded.name.length).toBeLessThanOrEqual(15);
  });

  test("empty name decodes as empty string", () => {
    const patch = defaultPatch();
    patch.name = "";
    const decoded = parsePayload(encodePayload(patch));
    expect(decoded.name).toBe("");
  });
});
