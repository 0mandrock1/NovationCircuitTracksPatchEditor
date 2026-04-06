/**
 * EffectsSection — distortion, chorus, and EQ parameters.
 */

import { usePatchStore } from "../../stores/patchStore.js";
import { Knob } from "../controls/Knob.js";
import { SectionPanel } from "./SectionPanel.js";

const DIST_TYPES = ["Off", "Valve", "Clip", "Foldback", "Crusher", "Mech", "Asym"] as const;

export function EffectsSection() {
  const fx = usePatchStore((s) => s.patch.fx);
  const setFx = usePatchStore((s) => s.setFx);

  return (
    <SectionPanel title="Effects">
      <div className="grid grid-cols-3 gap-6">
        {/* Distortion */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-accent-synth uppercase tracking-widest">
            Distortion
          </span>
          <div className="flex gap-2">
            <Knob
              value={fx.distortionLevel}
              label="Level"
              size={40}
              onChange={(v) => setFx({ distortionLevel: v })}
            />
            <Knob
              value={fx.distortionCompensation}
              label="Comp"
              size={40}
              onChange={(v) => setFx({ distortionCompensation: v })}
            />
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
              Type
            </span>
            <div className="flex flex-wrap gap-1">
              {DIST_TYPES.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFx({ distortionType: i as typeof fx.distortionType })}
                  className={[
                    "px-1.5 py-0.5 text-[8px] font-mono rounded transition-colors",
                    fx.distortionType === i
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

        {/* Chorus */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-accent-synth uppercase tracking-widest">
            Chorus
          </span>
          <div className="flex flex-wrap gap-2">
            <Knob
              value={fx.chorusLevel}
              label="Level"
              size={36}
              onChange={(v) => setFx({ chorusLevel: v })}
            />
            <Knob
              value={fx.chorusRate}
              label="Rate"
              size={36}
              onChange={(v) => setFx({ chorusRate: v })}
            />
            <Knob
              value={fx.chorusRateSync}
              label="Sync"
              size={36}
              onChange={(v) => setFx({ chorusRateSync: v })}
            />
            <Knob
              value={fx.chorusFeedback}
              label="Feedbk"
              size={36}
              onChange={(v) => setFx({ chorusFeedback: v })}
            />
            <Knob
              value={fx.chorusModDepth}
              label="Depth"
              size={36}
              onChange={(v) => setFx({ chorusModDepth: v })}
            />
            <Knob
              value={fx.chorusDelay}
              label="Delay"
              size={36}
              onChange={(v) => setFx({ chorusDelay: v })}
            />
          </div>
        </div>

        {/* EQ */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-accent-synth uppercase tracking-widest">
            EQ
          </span>
          <div className="flex flex-wrap gap-2">
            <Knob
              value={fx.eqBassFrequency}
              label="BassF"
              size={36}
              defaultValue={64}
              onChange={(v) => setFx({ eqBassFrequency: v })}
            />
            <Knob
              value={fx.eqBassLevel}
              label="BassL"
              size={36}
              defaultValue={64}
              onChange={(v) => setFx({ eqBassLevel: v })}
            />
            <Knob
              value={fx.eqMidFrequency}
              label="MidF"
              size={36}
              defaultValue={64}
              onChange={(v) => setFx({ eqMidFrequency: v })}
            />
            <Knob
              value={fx.eqMidLevel}
              label="MidL"
              size={36}
              defaultValue={64}
              onChange={(v) => setFx({ eqMidLevel: v })}
            />
            <Knob
              value={fx.eqTrebleFrequency}
              label="TrebF"
              size={36}
              defaultValue={64}
              onChange={(v) => setFx({ eqTrebleFrequency: v })}
            />
            <Knob
              value={fx.eqTrebleLevel}
              label="TrebL"
              size={36}
              defaultValue={64}
              onChange={(v) => setFx({ eqTrebleLevel: v })}
            />
          </div>
        </div>
      </div>
    </SectionPanel>
  );
}
