/**
 * MacroSection — 8 macro knobs, each with 4 range slots.
 */

import { usePatchStore } from "../../stores/patchStore.js";
import { Knob } from "../controls/Knob.js";
import { SectionPanel } from "./SectionPanel.js";

export function MacroSection() {
  const macroKnobs = usePatchStore((s) => s.patch.macroKnobs);
  const setMacroPosition = usePatchStore((s) => s.setMacroPosition);

  return (
    <SectionPanel title="Macro Knobs">
      <div className="flex flex-wrap gap-4">
        {(macroKnobs as typeof macroKnobs).map((macro, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Knob
              value={macro.position}
              label={`M${i + 1}`}
              size={44}
              defaultValue={64}
              onChange={(v) => setMacroPosition(i, v)}
            />
            {/* Range indicators — small dots showing how many ranges are active */}
            <div className="flex gap-0.5">
              {macro.ranges.map((range, r) => (
                <div
                  key={r}
                  className={[
                    "w-1.5 h-1.5 rounded-full",
                    range.destination > 0 ? "bg-accent-synth" : "bg-panel-highlight",
                  ].join(" ")}
                  title={`Range ${r + 1}: dest=${range.destination}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionPanel>
  );
}
