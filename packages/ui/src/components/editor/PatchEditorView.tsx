/**
 * PatchEditorView — main patch editor layout.
 *
 * Top bar: patch name + synth selector + send/receive buttons.
 * Tabs: Oscillators | Filter+Mixer | Envelopes | LFOs | FX | Mod Matrix | Macros
 */

import { useState } from "react";
import { useMidiStore } from "../../stores/midiStore.js";
import { usePatchStore } from "../../stores/patchStore.js";
import { EffectsSection } from "./EffectsSection.js";
import { EnvelopeSection } from "./EnvelopeSection.js";
import { FilterSection } from "./FilterSection.js";
import { LfoSection } from "./LfoSection.js";
import { MacroSection } from "./MacroSection.js";
import { MixerSection } from "./MixerSection.js";
import { ModMatrixSection } from "./ModMatrixSection.js";
import { OscillatorSection } from "./OscillatorSection.js";

type Tab = "osc" | "filter" | "env" | "lfo" | "fx" | "mod" | "macro";

const TABS: { id: Tab; label: string }[] = [
  { id: "osc", label: "Oscillators" },
  { id: "filter", label: "Filter" },
  { id: "env", label: "Envelopes" },
  { id: "lfo", label: "LFOs" },
  { id: "fx", label: "FX" },
  { id: "mod", label: "Mod Matrix" },
  { id: "macro", label: "Macros" },
];

export function PatchEditorView() {
  const [activeTab, setActiveTab] = useState<Tab>("osc");
  const { patch, synth, dirty, setName, buildSysEx } = usePatchStore();
  const { connectedOutputId, sendSysEx, requestPatch } = useMidiStore();

  const handleSend = () => {
    sendSysEx(buildSysEx());
  };

  const handleReceive = () => {
    requestPatch(synth);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Patch header bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-panel-surface border-b border-panel-border shrink-0">
        {/* Name input */}
        <input
          type="text"
          value={patch.name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent border border-panel-border rounded px-2 py-0.5 font-mono text-sm text-white focus:border-accent-synth outline-none w-44"
          placeholder="Patch Name"
        />

        {/* Dirty indicator */}
        {dirty && (
          <span className="text-[9px] font-mono text-accent-synth animate-pulse">UNSAVED</span>
        )}

        <div className="flex-1" />

        {/* Synth selector */}
        <div className="flex gap-1">
          {([1, 2] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => usePatchStore.setState({ synth: s })}
              className={[
                "px-2 py-0.5 text-[9px] font-mono rounded transition-colors",
                synth === s
                  ? "bg-accent-synth text-black font-semibold"
                  : "bg-panel-highlight text-gray-400 hover:text-white",
              ].join(" ")}
            >
              SYNTH {s}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={handleReceive}
          disabled={!connectedOutputId}
          className="px-3 py-1 text-[9px] font-mono rounded border border-panel-border text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 transition-colors"
        >
          ↓ GET
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!connectedOutputId}
          className="px-3 py-1 text-[9px] font-mono rounded bg-accent-synth text-black font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          ↑ SEND
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 px-4 border-b border-panel-border bg-panel-bg shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-accent-synth text-accent-synth"
                : "border-transparent text-gray-500 hover:text-gray-300",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "osc" && <OscillatorSection />}
        {activeTab === "filter" && (
          <div className="flex flex-col gap-4">
            <FilterSection />
            <MixerSection />
          </div>
        )}
        {activeTab === "env" && <EnvelopeSection />}
        {activeTab === "lfo" && <LfoSection />}
        {activeTab === "fx" && <EffectsSection />}
        {activeTab === "mod" && <ModMatrixSection />}
        {activeTab === "macro" && <MacroSection />}
      </div>
    </div>
  );
}
