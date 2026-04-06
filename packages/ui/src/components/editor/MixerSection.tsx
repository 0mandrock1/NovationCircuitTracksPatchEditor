/**
 * MixerSection — osc1/osc2 levels, ring mod, noise, pre/post FX levels.
 */

import { usePatchStore } from "../../stores/patchStore.js";
import { Knob } from "../controls/Knob.js";
import { SectionPanel } from "./SectionPanel.js";

export function MixerSection() {
  const mixer = usePatchStore((s) => s.patch.mixer);
  const setMixer = usePatchStore((s) => s.setMixer);

  return (
    <SectionPanel title="Mixer">
      <div className="flex flex-wrap gap-3">
        <Knob
          value={mixer.osc1Level}
          label="OSC1"
          size={40}
          defaultValue={100}
          onChange={(v) => setMixer({ osc1Level: v })}
        />
        <Knob
          value={mixer.osc2Level}
          label="OSC2"
          size={40}
          onChange={(v) => setMixer({ osc2Level: v })}
        />
        <Knob
          value={mixer.ringModLevel}
          label="Ring"
          size={40}
          onChange={(v) => setMixer({ ringModLevel: v })}
        />
        <Knob
          value={mixer.noiseLevel}
          label="Noise"
          size={40}
          onChange={(v) => setMixer({ noiseLevel: v })}
        />
        <div className="w-px bg-panel-border mx-1 self-stretch" />
        <Knob
          value={mixer.preFxLevel}
          label="PreFX"
          size={40}
          defaultValue={100}
          onChange={(v) => setMixer({ preFxLevel: v })}
        />
        <Knob
          value={mixer.postFxLevel}
          label="PostFX"
          size={40}
          defaultValue={100}
          onChange={(v) => setMixer({ postFxLevel: v })}
        />
      </div>
    </SectionPanel>
  );
}
