/**
 * EnvelopeSection — three ADSR envelopes with visualizers.
 * Env3's first parameter is "Delay" (not velocity).
 */

import type { EnvelopeParams } from "@circuit-tracks/core";
import { usePatchStore } from "../../stores/patchStore.js";
import { ADSRDisplay } from "../controls/ADSRDisplay.js";
import { Knob } from "../controls/Knob.js";
import { SectionPanel } from "./SectionPanel.js";

const ENV_LABELS: [string, string][] = [
  ["ENV 1", "Velocity"],
  ["ENV 2", "Velocity"],
  ["ENV 3", "Delay"],
];

interface EnvPanelProps {
  envNum: 1 | 2 | 3;
  env: EnvelopeParams;
  onChange: (key: keyof EnvelopeParams, value: number) => void;
}

function EnvPanel({ envNum, env, onChange }: EnvPanelProps) {
  const [label, firstLabel] = ENV_LABELS[envNum - 1] as [string, string];
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-mono text-accent-synth uppercase tracking-widest">
        {label}
      </span>
      <ADSRDisplay
        attack={env.attack}
        decay={env.decay}
        sustain={env.sustain}
        release={env.release}
        width={140}
        height={52}
      />
      <div className="flex gap-2">
        <Knob
          value={env.velocityOrDelay}
          label={firstLabel}
          size={36}
          onChange={(v) => onChange("velocityOrDelay", v)}
        />
        <Knob value={env.attack} label="A" size={36} onChange={(v) => onChange("attack", v)} />
        <Knob value={env.decay} label="D" size={36} onChange={(v) => onChange("decay", v)} />
        <Knob value={env.sustain} label="S" size={36} onChange={(v) => onChange("sustain", v)} />
        <Knob value={env.release} label="R" size={36} onChange={(v) => onChange("release", v)} />
      </div>
    </div>
  );
}

export function EnvelopeSection() {
  const env1 = usePatchStore((s) => s.patch.envelope1);
  const env2 = usePatchStore((s) => s.patch.envelope2);
  const env3 = usePatchStore((s) => s.patch.envelope3);
  const setEnvelope = usePatchStore((s) => s.setEnvelope);

  return (
    <SectionPanel title="Envelopes">
      <div className="grid grid-cols-3 gap-6">
        <EnvPanel envNum={1} env={env1} onChange={(k, v) => setEnvelope(1, k, v)} />
        <EnvPanel envNum={2} env={env2} onChange={(k, v) => setEnvelope(2, k, v)} />
        <EnvPanel envNum={3} env={env3} onChange={(k, v) => setEnvelope(3, k, v)} />
      </div>
    </SectionPanel>
  );
}
