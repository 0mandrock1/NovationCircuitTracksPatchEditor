/**
 * ModMatrixSection — 20-slot modulation matrix.
 *
 * Each slot: Source1 × Source2 → Destination with Depth.
 * Sources are non-contiguous: 0,4,5,6,7,8,9,10,11.
 */

import type { ModMatrixDestination, ModMatrixSlot, ModMatrixSource } from "@circuit-tracks/core";
import { usePatchStore } from "../../stores/patchStore.js";
import { Knob } from "../controls/Knob.js";
import { SectionPanel } from "./SectionPanel.js";

const SOURCE_NAMES: Record<number, string> = {
  0: "None",
  4: "LFO1",
  5: "LFO2",
  6: "Env1",
  7: "Env2",
  8: "Env3",
  9: "Vel",
  10: "KeyTrack",
  11: "ModWhl",
};
const SOURCE_VALUES = [0, 4, 5, 6, 7, 8, 9, 10, 11] as const;

const DEST_NAMES: string[] = [
  "None",
  "Osc1 Pitch",
  "Osc2 Pitch",
  "Osc1+2 Pitch",
  "Osc1 Wave",
  "Osc2 Wave",
  "Osc1 PW",
  "Osc2 PW",
  "Osc1 VSync",
  "Osc2 VSync",
  "Osc1 Level",
  "Osc2 Level",
  "Noise Level",
  "RingMod Level",
  "Filter Freq",
  "Filter Reso",
  "Filter Drive",
  "LFO1 Rate",
];

interface SourceSelectProps {
  value: ModMatrixSource;
  label: string;
  onChange: (v: ModMatrixSource) => void;
}

function SourceSelect({ value, label, onChange }: SourceSelectProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as ModMatrixSource)}
        className="bg-panel-highlight text-gray-300 text-[9px] font-mono rounded px-1 py-0.5 border border-panel-border focus:border-accent-synth outline-none"
      >
        {SOURCE_VALUES.map((v) => (
          <option key={v} value={v}>
            {SOURCE_NAMES[v]}
          </option>
        ))}
      </select>
    </div>
  );
}

interface DestSelectProps {
  value: ModMatrixDestination;
  onChange: (v: ModMatrixDestination) => void;
}

function DestSelect({ value, onChange }: DestSelectProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">Dest</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as ModMatrixDestination)}
        className="bg-panel-highlight text-gray-300 text-[9px] font-mono rounded px-1 py-0.5 border border-panel-border focus:border-accent-synth outline-none"
      >
        {DEST_NAMES.map((name, i) => (
          <option key={name} value={i}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ModMatrixSection() {
  const modMatrix = usePatchStore((s) => s.patch.modMatrix);
  const setModSlot = usePatchStore((s) => s.setModSlot);

  return (
    <SectionPanel title="Mod Matrix">
      <div className="overflow-x-auto">
        <table className="w-full text-[9px] font-mono border-collapse">
          <thead>
            <tr className="text-gray-600 uppercase tracking-wider">
              <th className="text-left pb-1 pr-2">#</th>
              <th className="text-left pb-1 pr-2">Source 1</th>
              <th className="text-left pb-1 pr-2">Source 2</th>
              <th className="text-left pb-1 pr-2">Depth</th>
              <th className="text-left pb-1">Destination</th>
            </tr>
          </thead>
          <tbody>
            {(modMatrix as unknown as ModMatrixSlot[]).map((slot, i) => (
              <tr key={i} className="border-t border-panel-border">
                <td className="pr-2 py-1 text-gray-600">{i + 1}</td>
                <td className="pr-2 py-1">
                  <SourceSelect
                    value={slot.source1}
                    label=""
                    onChange={(v) => setModSlot(i, { source1: v })}
                  />
                </td>
                <td className="pr-2 py-1">
                  <SourceSelect
                    value={slot.source2}
                    label=""
                    onChange={(v) => setModSlot(i, { source2: v })}
                  />
                </td>
                <td className="pr-2 py-1">
                  <Knob
                    value={slot.depth}
                    size={28}
                    defaultValue={64}
                    onChange={(v) => setModSlot(i, { depth: v })}
                  />
                </td>
                <td className="py-1">
                  <DestSelect
                    value={slot.destination}
                    onChange={(v) => setModSlot(i, { destination: v })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionPanel>
  );
}
