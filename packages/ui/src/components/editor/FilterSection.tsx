/**
 * FilterSection — filter routing, type, drive, frequency, resonance, etc.
 */

import type { FilterParams } from "@circuit-tracks/core";
import { usePatchStore } from "../../stores/patchStore.js";
import { Knob } from "../controls/Knob.js";
import { SectionPanel } from "./SectionPanel.js";

const FILTER_TYPES = ["LP12", "LP24", "BP6", "BP12", "HP12", "HP24"] as const;
const DRIVE_TYPES = ["Off", "Soft", "Med", "Hard", "Clip", "Neon", "Mech"] as const;

export function FilterSection() {
  const filter = usePatchStore((s) => s.patch.filter);
  const setFilter = usePatchStore((s) => s.setFilter);

  const setField = (key: keyof FilterParams, value: number) => setFilter(key, value);

  return (
    <SectionPanel title="Filter">
      {/* Type + routing row */}
      <div className="flex gap-4 mb-4 items-center">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Type</span>
          <div className="flex gap-1">
            {FILTER_TYPES.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setField("type", i)}
                className={[
                  "px-2 py-0.5 text-[9px] font-mono rounded transition-colors",
                  filter.type === i
                    ? "bg-accent-synth text-black font-semibold"
                    : "bg-panel-highlight text-gray-400 hover:text-white",
                ].join(" ")}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
            Routing
          </span>
          <div className="flex gap-1">
            {["Serial", "Parallel"].map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setField("routing", i)}
                className={[
                  "px-2 py-0.5 text-[9px] font-mono rounded transition-colors",
                  filter.routing === i
                    ? "bg-accent-synth text-black font-semibold"
                    : "bg-panel-highlight text-gray-400 hover:text-white",
                ].join(" ")}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Knob row */}
      <div className="flex flex-wrap gap-3">
        <Knob
          value={filter.frequency}
          label="Freq"
          size={44}
          defaultValue={127}
          onChange={(v) => setField("frequency", v)}
        />
        <Knob
          value={filter.resonance}
          label="Reso"
          size={44}
          onChange={(v) => setField("resonance", v)}
        />
        <Knob value={filter.drive} label="Drive" size={44} onChange={(v) => setField("drive", v)} />
        <Knob value={filter.track} label="Track" size={44} onChange={(v) => setField("track", v)} />
        <Knob
          value={filter.qNormalise}
          label="Q Norm"
          size={44}
          onChange={(v) => setField("qNormalise", v)}
        />
        <Knob
          value={filter.env2ToFreq}
          label="Env2→F"
          size={44}
          defaultValue={64}
          onChange={(v) => setField("env2ToFreq", v)}
        />
      </div>

      {/* Drive type */}
      <div className="mt-3 flex flex-col gap-1">
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
          Drive Type
        </span>
        <div className="flex gap-1 flex-wrap">
          {DRIVE_TYPES.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => setField("driveType", i)}
              className={[
                "px-2 py-0.5 text-[9px] font-mono rounded transition-colors",
                filter.driveType === i
                  ? "bg-accent-synth text-black font-semibold"
                  : "bg-panel-highlight text-gray-400 hover:text-white",
              ].join(" ")}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </SectionPanel>
  );
}
