/**
 * LfoSection — two LFOs with waveform, rate, sync, and flag controls.
 */

import type { LfoParams } from "@circuit-tracks/core";
import { usePatchStore } from "../../stores/patchStore.js";
import { Knob } from "../controls/Knob.js";
import { WaveformPicker } from "../controls/WaveformPicker.js";
import { SectionPanel } from "./SectionPanel.js";

const FADE_MODES = ["None", "Fade In", "Fade Out", "Fade I+O"] as const;

interface LfoPanelProps {
  lfoNum: 1 | 2;
  lfo: LfoParams;
  onParam: (partial: Partial<Omit<LfoParams, "flags">>) => void;
  onFlag: (flag: keyof LfoParams["flags"], value: boolean | number) => void;
}

function LfoPanel({ lfoNum, lfo, onParam, onFlag }: LfoPanelProps) {
  const f = lfo.flags;
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-mono text-accent-synth uppercase tracking-widest">
        LFO {lfoNum}
      </span>

      <WaveformPicker
        value={lfo.waveform}
        mode="lfo"
        onChange={(w) => onParam({ waveform: w as LfoParams["waveform"] })}
      />

      <div className="flex flex-wrap gap-2">
        <Knob value={lfo.rate} label="Rate" size={38} onChange={(v) => onParam({ rate: v })} />
        <Knob
          value={lfo.rateSync}
          label="Sync"
          size={38}
          onChange={(v) => onParam({ rateSync: v })}
        />
        <Knob
          value={lfo.phaseOffset}
          label="Phase"
          size={38}
          onChange={(v) => onParam({ phaseOffset: v })}
        />
        <Knob
          value={lfo.slewRate}
          label="Slew"
          size={38}
          onChange={(v) => onParam({ slewRate: v })}
        />
        <Knob value={lfo.delay} label="Delay" size={38} onChange={(v) => onParam({ delay: v })} />
        <Knob
          value={lfo.delaySync}
          label="DSync"
          size={38}
          onChange={(v) => onParam({ delaySync: v })}
        />
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-1">
        {(["oneShot", "keySync", "commonSync", "delayTrigger"] as const).map((flag) => (
          <button
            key={flag}
            type="button"
            onClick={() => onFlag(flag, !f[flag])}
            className={[
              "px-2 py-0.5 text-[9px] font-mono rounded transition-colors",
              f[flag]
                ? "bg-accent-synth text-black font-semibold"
                : "bg-panel-highlight text-gray-400 hover:text-white",
            ].join(" ")}
          >
            {flag === "oneShot"
              ? "1Shot"
              : flag === "keySync"
                ? "KeySync"
                : flag === "commonSync"
                  ? "CSync"
                  : "DTrig"}
          </button>
        ))}
      </div>

      {/* Fade mode */}
      <div className="flex gap-1 flex-wrap">
        {FADE_MODES.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => onFlag("fadeMode", i)}
            className={[
              "px-2 py-0.5 text-[9px] font-mono rounded transition-colors",
              f.fadeMode === i
                ? "bg-accent-synth text-black font-semibold"
                : "bg-panel-highlight text-gray-400 hover:text-white",
            ].join(" ")}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LfoSection() {
  const lfo1 = usePatchStore((s) => s.patch.lfo1);
  const lfo2 = usePatchStore((s) => s.patch.lfo2);
  const setLfo = usePatchStore((s) => s.setLfo);
  const setLfoFlag = usePatchStore((s) => s.setLfoFlag);

  return (
    <SectionPanel title="LFOs">
      <div className="grid grid-cols-2 gap-6">
        <LfoPanel
          lfoNum={1}
          lfo={lfo1}
          onParam={(p) => setLfo(1, p)}
          onFlag={(f, v) => setLfoFlag(1, f, v)}
        />
        <LfoPanel
          lfoNum={2}
          lfo={lfo2}
          onParam={(p) => setLfo(2, p)}
          onFlag={(f, v) => setLfoFlag(2, f, v)}
        />
      </div>
    </SectionPanel>
  );
}
