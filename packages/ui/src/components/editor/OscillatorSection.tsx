/**
 * OscillatorSection — Osc1 + Osc2 panels side by side.
 */

import type { OscParams } from "@circuit-tracks/core";
import { usePatchStore } from "../../stores/patchStore.js";
import { Knob } from "../controls/Knob.js";
import { WaveformPicker } from "../controls/WaveformPicker.js";
import { SectionPanel } from "./SectionPanel.js";

// ---------------------------------------------------------------------------
// Single oscillator panel
// ---------------------------------------------------------------------------

interface OscPanelProps {
  oscNum: 1 | 2;
  osc: OscParams;
  onChange: (partial: Partial<OscParams>) => void;
}

function OscPanel({ oscNum, osc, onChange }: OscPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-accent-synth uppercase tracking-widest">
          OSC {oscNum}
        </span>
      </div>

      {/* Waveform picker */}
      <WaveformPicker
        value={osc.wave}
        mode="osc"
        onChange={(wave) => onChange({ wave: wave as OscParams["wave"] })}
      />

      {/* Knob row */}
      <div className="flex flex-wrap gap-3 justify-start">
        <Knob
          value={osc.waveInterpolate}
          label="Interp"
          size={40}
          onChange={(v) => onChange({ waveInterpolate: v })}
        />
        <Knob
          value={osc.pulseWidthIndex}
          label="PW"
          size={40}
          onChange={(v) => onChange({ pulseWidthIndex: v })}
        />
        <Knob
          value={osc.virtualSyncDepth}
          label="VSync"
          size={40}
          onChange={(v) => onChange({ virtualSyncDepth: v })}
        />
        <Knob
          value={osc.density}
          label="Density"
          size={40}
          onChange={(v) => onChange({ density: v })}
        />
        <Knob
          value={osc.densityDetune}
          label="Detune"
          size={40}
          onChange={(v) => onChange({ densityDetune: v })}
        />
        <Knob
          value={osc.semitones}
          label="Semi"
          size={40}
          defaultValue={64}
          onChange={(v) => onChange({ semitones: v })}
        />
        <Knob
          value={osc.cents}
          label="Cents"
          size={40}
          defaultValue={64}
          onChange={(v) => onChange({ cents: v })}
        />
        <Knob
          value={osc.pitchBend}
          label="PBend"
          size={40}
          defaultValue={64}
          onChange={(v) => onChange({ pitchBend: v })}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function OscillatorSection() {
  const osc1 = usePatchStore((s) => s.patch.oscillator1);
  const osc2 = usePatchStore((s) => s.patch.oscillator2);
  const setOsc = usePatchStore((s) => s.setOsc);

  return (
    <SectionPanel title="Oscillators">
      <div className="grid grid-cols-2 gap-6">
        <OscPanel oscNum={1} osc={osc1} onChange={(p) => setOsc(1, p)} />
        <OscPanel oscNum={2} osc={osc2} onChange={(p) => setOsc(2, p)} />
      </div>
    </SectionPanel>
  );
}
