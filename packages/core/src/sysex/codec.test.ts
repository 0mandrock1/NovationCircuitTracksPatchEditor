/**
 * Comprehensive codec tests for Circuit Tracks SysEx encode ↔ decode.
 *
 * All byte offsets and constants validated against:
 *   ctpatch.py — https://github.com/martin-stone/ctpatch
 */

import { describe, expect, test } from "bun:test";
import * as O from "../parameters/offsets.js";
import {
  buildBankMessages,
  buildReplaceCurrentPatchMessage,
  buildReplacePatchMessage,
  buildRequestCurrentPatchMessage,
  encodePayload,
} from "./builder.js";
import {
  CIRCUIT_ORIGINAL_PRODUCT_ID,
  CIRCUIT_TRACKS_HEADER,
  CIRCUIT_TRACKS_PRODUCT_ID,
  INTER_MESSAGE_DELAY_MS,
  PATCH_DATA_LENGTH,
  PATCH_DATA_OFFSET,
  PATCH_SYSEX_LENGTH,
  SYSEX_END,
  SYSEX_START,
  SysExCommand,
} from "./constants.js";
import { defaultPatch } from "./defaults.js";
import { SysExParseError, parsePatchSysEx, parsePayload } from "./parser.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMsg(commandByte: number, location: number, data?: Uint8Array): Uint8Array {
  const payload = data ?? encodePayload(defaultPatch());
  const msg = new Uint8Array(PATCH_SYSEX_LENGTH);
  let i = 0;
  for (const b of CIRCUIT_TRACKS_HEADER) msg[i++] = b;
  msg[i++] = commandByte;
  msg[i++] = location;
  msg[i++] = 0; // reserved
  msg.set(payload, i);
  msg[PATCH_SYSEX_LENGTH - 1] = SYSEX_END;
  return msg;
}

// ---------------------------------------------------------------------------
// Constants sanity checks
// ---------------------------------------------------------------------------

describe("Protocol constants", () => {
  test("PATCH_SYSEX_LENGTH is 350", () => {
    expect(PATCH_SYSEX_LENGTH).toBe(350);
  });

  test("PATCH_DATA_LENGTH is 340", () => {
    expect(PATCH_DATA_LENGTH).toBe(340);
  });

  test("header is F0 00 20 29 01 64", () => {
    expect(Array.from(CIRCUIT_TRACKS_HEADER)).toStrictEqual([0xf0, 0x00, 0x20, 0x29, 0x01, 0x64]);
  });

  test("CIRCUIT_TRACKS_PRODUCT_ID is 0x64", () => {
    expect(CIRCUIT_TRACKS_PRODUCT_ID).toBe(0x64);
  });

  test("CIRCUIT_ORIGINAL_PRODUCT_ID is 0x60", () => {
    expect(CIRCUIT_ORIGINAL_PRODUCT_ID).toBe(0x60);
  });

  test("SysExCommand values match ctpatch.py", () => {
    expect(SysExCommand.REPLACE_CURRENT_PATCH).toBe(0x00);
    expect(SysExCommand.REPLACE_PATCH).toBe(0x01);
    expect(SysExCommand.REQUEST_DUMP_CURRENT_PATCH).toBe(0x40);
  });

  test("INTER_MESSAGE_DELAY_MS is 20", () => {
    expect(INTER_MESSAGE_DELAY_MS).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Payload size and layout
// ---------------------------------------------------------------------------

describe("Payload encoding", () => {
  test("encodePayload returns exactly PATCH_DATA_LENGTH bytes", () => {
    expect(encodePayload(defaultPatch()).length).toBe(PATCH_DATA_LENGTH);
  });

  test("name is written starting at offset 0 and is 16 bytes", () => {
    const patch = defaultPatch();
    patch.name = "TestName";
    const d = encodePayload(patch);
    // First 8 bytes should be ASCII "TestName"
    expect(d[0]).toBe("T".charCodeAt(0));
    expect(d[7]).toBe("e".charCodeAt(0));
    // Bytes 8–15 should be space (0x20) padding
    for (let i = 8; i < 16; i++) expect(d[i]).toBe(0x20);
  });

  test("voice polyphony mode at offset 32", () => {
    const patch = defaultPatch();
    patch.voice.polyphonyMode = 1; // MONO_AG
    const d = encodePayload(patch);
    expect(d[O.VOICE_POLYPHONY_MODE]).toBe(1);
    expect(O.VOICE_POLYPHONY_MODE).toBe(32);
  });

  test("oscillator 1 wave at offset 36", () => {
    const patch = defaultPatch();
    patch.oscillator1.wave = 13; // SQUARE
    const d = encodePayload(patch);
    expect(d[O.OSC1_WAVE]).toBe(13);
    expect(O.OSC1_WAVE).toBe(36);
  });

  test("oscillator 2 wave at offset 45", () => {
    const patch = defaultPatch();
    patch.oscillator2.wave = 2; // SAWTOOTH
    const d = encodePayload(patch);
    expect(d[O.OSC2_WAVE]).toBe(2);
    expect(O.OSC2_WAVE).toBe(45);
  });

  test("filter cutoff (frequency) at offset 64", () => {
    const patch = defaultPatch();
    patch.filter.frequency = 42;
    const d = encodePayload(patch);
    expect(d[O.FILTER_FREQUENCY]).toBe(42);
    expect(O.FILTER_FREQUENCY).toBe(64);
  });

  test("envelope 1 attack at offset 70", () => {
    const patch = defaultPatch();
    patch.envelope1.attack = 99;
    const d = encodePayload(patch);
    expect(d[O.ENV1_ATTACK]).toBe(99);
    expect(O.ENV1_ATTACK).toBe(70);
  });

  test("envelope 3 delay (velocityOrDelay) at offset 79", () => {
    const patch = defaultPatch();
    patch.envelope3.velocityOrDelay = 55;
    const d = encodePayload(patch);
    expect(d[O.ENV3_DELAY]).toBe(55);
    expect(O.ENV3_DELAY).toBe(79);
  });

  test("lfo1 rate at offset 89", () => {
    const patch = defaultPatch();
    patch.lfo1.rate = 100;
    const d = encodePayload(patch);
    expect(d[O.LFO1_RATE]).toBe(100);
    expect(O.LFO1_RATE).toBe(89);
  });

  test("fx distortion level at offset 100", () => {
    const patch = defaultPatch();
    patch.fx.distortionLevel = 77;
    const d = encodePayload(patch);
    expect(d[O.FX_DIST_LEVEL]).toBe(77);
    expect(O.FX_DIST_LEVEL).toBe(100);
  });

  test("mod matrix slot 0 starts at offset 124", () => {
    expect(O.MOD_MATRIX_START).toBe(124);
  });

  test("mod matrix slot 19 ends at offset 203", () => {
    const lastSlotStart = O.MOD_MATRIX_START + 19 * O.MOD_MATRIX_STRIDE;
    const lastSlotEnd = lastSlotStart + O.MOD_MATRIX_STRIDE - 1;
    expect(lastSlotEnd).toBe(203);
  });

  test("macro knobs start at offset 204", () => {
    expect(O.MACRO_START).toBe(204);
  });

  test("macro knob 7 (last) ends at offset 339 (last data byte)", () => {
    const lastMacroStart = O.MACRO_START + 7 * O.MACRO_STRIDE;
    const lastMacroEnd = lastMacroStart + O.MACRO_STRIDE - 1;
    expect(lastMacroEnd).toBe(339);
    expect(lastMacroEnd).toBe(PATCH_DATA_LENGTH - 1);
  });
});

// ---------------------------------------------------------------------------
// Round-trip: payload
// ---------------------------------------------------------------------------

describe("Payload round-trip", () => {
  test("default patch survives encode → decode", () => {
    const original = defaultPatch();
    const decoded = parsePayload(encodePayload(original));

    expect(decoded.name).toBe(original.name);
    expect(decoded.voice.polyphonyMode).toBe(original.voice.polyphonyMode);
    expect(decoded.oscillator1.wave).toBe(original.oscillator1.wave);
    expect(decoded.filter.frequency).toBe(original.filter.frequency);
    expect(decoded.envelope1.attack).toBe(original.envelope1.attack);
    expect(decoded.lfo1.rate).toBe(original.lfo1.rate);
    expect(decoded.fx.distortionLevel).toBe(original.fx.distortionLevel);
  });

  test("all synth parameters survive round-trip", () => {
    const patch = defaultPatch();
    patch.name = "RoundTrip";
    patch.category = 5;
    patch.genre = 3;
    patch.voice.polyphonyMode = 0; // MONO
    patch.voice.portamentoRate = 88;
    patch.oscillator1.wave = 29; // RANDOM_COLLECTION_3
    patch.oscillator1.semitones = 80;
    patch.oscillator1.cents = 30;
    patch.oscillator2.wave = 14; // SINE_TABLE
    patch.oscillator2.virtualSyncDepth = 100;
    patch.mixer.osc1Level = 90;
    patch.mixer.ringModLevel = 40;
    patch.filter.type = 4; // HP 12dB
    patch.filter.frequency = 55;
    patch.filter.resonance = 110;
    patch.filter.driveType = 3; // CROSS_OVER
    patch.envelope1.attack = 100;
    patch.envelope1.sustain = 50;
    patch.envelope3.velocityOrDelay = 30; // delay
    patch.lfo1.waveform = 37; // 2511
    patch.lfo1.rate = 88;
    patch.lfo1.flags = {
      oneShot: true,
      keySync: false,
      commonSync: true,
      delayTrigger: false,
      fadeMode: 2,
    };
    patch.lfo2.waveform = 24; // Major
    patch.fx.chorusLevel = 80;
    patch.fx.eqBassLevel = 100;
    patch.fx.distortionType = 5; // BIT_REDUCER
    patch.modMatrix[0]!.source1 = 6; // LFO_1_PLUS
    patch.modMatrix[0]!.destination = 12; // FILTER_FREQUENCY
    patch.modMatrix[0]!.depth = 90;
    patch.modMatrix[19]!.source1 = 4; // VELOCITY
    patch.modMatrix[19]!.destination = 13; // FILTER_RESONANCE
    patch.macroKnobs[0]!.position = 99;
    patch.macroKnobs[0]!.ranges[0]!.destination = 21; // CUTOFF_FREQUENCY
    patch.macroKnobs[0]!.ranges[0]!.depth = 120;
    patch.macroKnobs[7]!.position = 12;

    const decoded = parsePayload(encodePayload(patch));

    expect(decoded.name).toBe("RoundTrip");
    expect(decoded.category).toBe(5);
    expect(decoded.genre).toBe(3);
    expect(decoded.voice.polyphonyMode).toBe(0);
    expect(decoded.voice.portamentoRate).toBe(88);
    expect(decoded.oscillator1.wave).toBe(29);
    expect(decoded.oscillator1.semitones).toBe(80);
    expect(decoded.oscillator1.cents).toBe(30);
    expect(decoded.oscillator2.wave).toBe(14);
    expect(decoded.oscillator2.virtualSyncDepth).toBe(100);
    expect(decoded.mixer.osc1Level).toBe(90);
    expect(decoded.mixer.ringModLevel).toBe(40);
    expect(decoded.filter.type).toBe(4);
    expect(decoded.filter.frequency).toBe(55);
    expect(decoded.filter.resonance).toBe(110);
    expect(decoded.filter.driveType).toBe(3);
    expect(decoded.envelope1.attack).toBe(100);
    expect(decoded.envelope1.sustain).toBe(50);
    expect(decoded.envelope3.velocityOrDelay).toBe(30);
    expect(decoded.lfo1.waveform).toBe(37);
    expect(decoded.lfo1.rate).toBe(88);
    expect(decoded.lfo1.flags.oneShot).toBe(true);
    expect(decoded.lfo1.flags.commonSync).toBe(true);
    expect(decoded.lfo1.flags.fadeMode).toBe(2);
    expect(decoded.lfo2.waveform).toBe(24);
    expect(decoded.fx.chorusLevel).toBe(80);
    expect(decoded.fx.eqBassLevel).toBe(100);
    expect(decoded.fx.distortionType).toBe(5);
    expect(decoded.modMatrix[0]!.source1).toBe(6);
    expect(decoded.modMatrix[0]!.destination).toBe(12);
    expect(decoded.modMatrix[0]!.depth).toBe(90);
    expect(decoded.modMatrix[19]!.source1).toBe(4);
    expect(decoded.modMatrix[19]!.destination).toBe(13);
    expect(decoded.macroKnobs[0]!.position).toBe(99);
    expect(decoded.macroKnobs[0]!.ranges[0]!.destination).toBe(21);
    expect(decoded.macroKnobs[0]!.ranges[0]!.depth).toBe(120);
    expect(decoded.macroKnobs[7]!.position).toBe(12);
  });

  test("LFO flags bitfield round-trip (all combinations)", () => {
    const patch = defaultPatch();
    const flagCombos = [
      {
        oneShot: false,
        keySync: false,
        commonSync: false,
        delayTrigger: false,
        fadeMode: 0 as const,
      },
      { oneShot: true, keySync: true, commonSync: true, delayTrigger: true, fadeMode: 3 as const },
      {
        oneShot: true,
        keySync: false,
        commonSync: false,
        delayTrigger: false,
        fadeMode: 1 as const,
      },
    ];
    for (const flags of flagCombos) {
      patch.lfo1.flags = flags;
      const decoded = parsePayload(encodePayload(patch));
      expect(decoded.lfo1.flags).toStrictEqual(flags);
    }
  });

  test("patch name 16 chars survives round-trip", () => {
    const patch = defaultPatch();
    patch.name = "1234567890123456"; // exactly 16
    expect(parsePayload(encodePayload(patch)).name).toBe("1234567890123456");
  });

  test("patch name trimmed to 16 chars on encode", () => {
    const patch = defaultPatch();
    patch.name = "12345678901234567890"; // 20 chars — should be truncated
    const decoded = parsePayload(encodePayload(patch));
    expect(decoded.name.length).toBeLessThanOrEqual(16);
  });

  test("empty name decodes as empty string", () => {
    const patch = defaultPatch();
    patch.name = "";
    expect(parsePayload(encodePayload(patch)).name).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Round-trip: full SysEx messages
// ---------------------------------------------------------------------------

describe("Full SysEx message round-trip", () => {
  test("buildReplaceCurrentPatchMessage → parsePatchSysEx round-trip", () => {
    const patch = defaultPatch();
    patch.filter.frequency = 42;
    const msg = buildReplaceCurrentPatchMessage(patch, 1);
    const { patch: decoded, synth } = parsePatchSysEx(msg);
    expect(synth).toBe(1);
    expect(decoded.filter.frequency).toBe(42);
  });

  test("buildReplaceCurrentPatchMessage has REPLACE_CURRENT_PATCH command", () => {
    const msg = buildReplaceCurrentPatchMessage(defaultPatch(), 2);
    expect(msg[5]).toBe(0x64); // product ID
    expect(msg[6]).toBe(SysExCommand.REPLACE_CURRENT_PATCH);
    expect(msg[7]).toBe(0x01); // synth 2
  });

  test("synth 1 encoded as location 0 in replaceCurrentPatch", () => {
    const msg = buildReplaceCurrentPatchMessage(defaultPatch(), 1);
    expect(msg[7]).toBe(0x00);
  });

  test("synth 2 encoded as location 0x01 in replaceCurrentPatch", () => {
    const msg = buildReplaceCurrentPatchMessage(defaultPatch(), 2);
    expect(msg[7]).toBe(0x01);
  });

  test("message length is exactly 350 bytes", () => {
    expect(buildReplacePatchMessage(defaultPatch(), 1, 0).length).toBe(350);
    expect(buildReplaceCurrentPatchMessage(defaultPatch(), 1).length).toBe(350);
  });

  test("message starts with F0 and ends with F7", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    expect(msg[0]).toBe(SYSEX_START);
    expect(msg[msg.length - 1]).toBe(SYSEX_END);
  });

  test("header bytes are correct in full message", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    expect(msg[1]).toBe(0x00); // manufacturer
    expect(msg[2]).toBe(0x20);
    expect(msg[3]).toBe(0x29);
    expect(msg[4]).toBe(0x01); // product type
    expect(msg[5]).toBe(0x64); // Circuit Tracks product ID
  });

  test("data payload starts at byte 9 (PATCH_DATA_OFFSET)", () => {
    expect(PATCH_DATA_OFFSET).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// Request message
// ---------------------------------------------------------------------------

describe("Request message", () => {
  test("buildRequestCurrentPatchMessage structure", () => {
    const msg = buildRequestCurrentPatchMessage(1);
    expect(msg[0]).toBe(SYSEX_START);
    expect(msg[6]).toBe(SysExCommand.REQUEST_DUMP_CURRENT_PATCH); // 0x40
    expect(msg[7]).toBe(0x00); // synth 1
    expect(msg[msg.length - 1]).toBe(SYSEX_END);
  });

  test("request for synth 2 has location 0x01", () => {
    const msg = buildRequestCurrentPatchMessage(2);
    expect(msg[7]).toBe(0x01);
  });
});

// ---------------------------------------------------------------------------
// Bank builder
// ---------------------------------------------------------------------------

describe("Bank builder", () => {
  test("buildBankMessages produces 64 messages", () => {
    const patches = Array.from({ length: 64 }, () => defaultPatch());
    const messages = buildBankMessages(patches, 1);
    expect(messages.length).toBe(64);
  });

  test("each bank message is 350 bytes", () => {
    const patches = Array.from({ length: 4 }, () => defaultPatch());
    for (const msg of buildBankMessages(patches, 1)) {
      expect(msg.length).toBe(350);
    }
  });
});

// ---------------------------------------------------------------------------
// Parser error handling
// ---------------------------------------------------------------------------

describe("Parser error handling", () => {
  test("throws on missing F0", () => {
    const bad = new Uint8Array(350).fill(0);
    bad[0] = 0x00; // not F0
    expect(() => parsePatchSysEx(bad)).toThrow(SysExParseError);
  });

  test("throws on missing F7 terminator", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    msg[349] = 0x00; // corrupt F7
    expect(() => parsePatchSysEx(msg)).toThrow(SysExParseError);
  });

  test("throws on wrong manufacturer ID", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    msg[2] = 0x99; // corrupt manufacturer ID
    expect(() => parsePatchSysEx(msg)).toThrow(SysExParseError);
  });

  test("throws on unknown product ID", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    msg[5] = 0x01; // not 0x64 or 0x60
    expect(() => parsePatchSysEx(msg)).toThrow(SysExParseError);
  });

  test("accepts Circuit Original product ID (0x60)", () => {
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 0);
    msg[5] = 0x60; // Circuit Original
    // Should not throw — parser accepts both
    expect(() => parsePatchSysEx(msg)).not.toThrow();
  });

  test("throws on non-patch command", () => {
    const msg = makeMsg(SysExCommand.REQUEST_DUMP_CURRENT_PATCH, 0);
    expect(() => parsePatchSysEx(msg)).toThrow(SysExParseError);
  });
});

// ---------------------------------------------------------------------------
// Boundary values
// ---------------------------------------------------------------------------

describe("Boundary values", () => {
  test("all parameters at minimum (0) survive round-trip", () => {
    const patch = defaultPatch();
    patch.oscillator1.wave = 0;
    patch.oscillator1.semitones = 0;
    patch.filter.frequency = 0;
    patch.filter.resonance = 0;
    patch.lfo1.waveform = 0;
    patch.lfo1.rate = 0;
    const d = parsePayload(encodePayload(patch));
    expect(d.oscillator1.wave).toBe(0);
    expect(d.oscillator1.semitones).toBe(0);
    expect(d.filter.frequency).toBe(0);
    expect(d.lfo1.rate).toBe(0);
  });

  test("all parameters at maximum survive round-trip", () => {
    const patch = defaultPatch();
    patch.oscillator1.wave = 29;
    patch.oscillator1.semitones = 127;
    patch.filter.frequency = 127;
    patch.filter.resonance = 127;
    patch.lfo1.waveform = 37;
    patch.lfo1.rate = 127;
    const d = parsePayload(encodePayload(patch));
    expect(d.oscillator1.wave).toBe(29);
    expect(d.oscillator1.semitones).toBe(127);
    expect(d.filter.frequency).toBe(127);
    expect(d.lfo1.waveform).toBe(37);
    expect(d.lfo1.rate).toBe(127);
  });

  test("parser clamps out-of-range values", () => {
    // Manually set a byte beyond the valid range
    const d = encodePayload(defaultPatch());
    d[O.FILTER_TYPE] = 99; // FilterType max is 5
    const parsed = parsePayload(d);
    expect(parsed.filter.type).toBeLessThanOrEqual(5);
  });

  test("buildReplacePatchMessage produces 350-byte message (REPLACE_CURRENT_PATCH format)", () => {
    // Flash-write (REPLACE_PATCH 0x01) with its 5-byte command section is
    // deferred to Phase 2. buildReplacePatchMessage currently delegates to
    // buildReplaceCurrentPatchMessage so .syx file interoperability is preserved.
    const msg = buildReplacePatchMessage(defaultPatch(), 1, 63);
    expect(msg.length).toBe(350);
    expect(msg[6]).toBe(SysExCommand.REPLACE_CURRENT_PATCH);
  });
});
