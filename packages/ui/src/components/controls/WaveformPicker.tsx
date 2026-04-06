/**
 * WaveformPicker — oscillator waveform selector grid.
 *
 * Shows 30 waveform cells (0–29 for oscillators, 0–37 for LFOs) as a grid
 * of small SVG icons. Clicking a cell calls onChange with the waveform index.
 */

// Waveform display names for oscillators (30 waveforms, 0-29)
const OSC_WAVE_NAMES: string[] = [
  "Sine",
  "Triangle",
  "Saw",
  "Ramp",
  "Square",
  "Pulse 10",
  "Pulse 20",
  "Pulse 30",
  "Pulse 40",
  "Pulse 50",
  "Pulse 60",
  "Pulse 70",
  "Pulse 80",
  "Pulse 90",
  "Res1",
  "Res2",
  "Res3",
  "Res4",
  "Res5",
  "Res6",
  "Res7",
  "Res8",
  "Saw+",
  "Saw-",
  "Tri+",
  "Tri-",
  "Org1",
  "Org2",
  "Org3",
  "Org4",
];

// LFO waveforms (38 waveforms, 0-37)
const LFO_WAVE_NAMES: string[] = [
  ...OSC_WAVE_NAMES,
  "Arp1",
  "Arp2",
  "Arp3",
  "Seq1",
  "Seq2",
  "Seq3",
  "Seq4",
  "Seq5",
];

/** Minimal SVG paths for a handful of recognisable wave shapes */
const WAVE_PATHS: Record<string, string> = {
  Sine: "M0,8 C2,0 6,0 8,8 S14,16 16,8",
  Triangle: "M0,16 L8,0 L16,16",
  Saw: "M0,16 L16,0 M16,0 L16,16",
  Ramp: "M0,0 L16,16 M0,16 L0,0",
  Square: "M0,16 L0,4 L8,4 L8,12 L16,12 L16,0",
};

function WaveIcon({ name, size = 16 }: { name: string; size?: number }) {
  const path = WAVE_PATHS[name] ?? WAVE_PATHS.Square;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{name}</title>
      <path d={path} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WaveformPickerProps {
  value: number;
  mode?: "osc" | "lfo";
  onChange: (wave: number) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WaveformPicker({
  value,
  mode = "osc",
  onChange,
  className = "",
}: WaveformPickerProps) {
  const names = mode === "lfo" ? LFO_WAVE_NAMES : OSC_WAVE_NAMES;
  const cols = 6;

  return (
    <div
      className={`inline-grid gap-px ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {names.map((name, i) => {
        const active = i === value;
        return (
          <button
            key={name}
            type="button"
            title={`${i}: ${name}`}
            onClick={() => onChange(i)}
            className={[
              "flex items-center justify-center w-8 h-8 rounded transition-colors text-[8px] font-mono",
              active
                ? "bg-accent-synth text-black"
                : "bg-panel-surface text-gray-500 hover:bg-panel-highlight hover:text-white",
            ].join(" ")}
          >
            {i < 5 ? <WaveIcon name={name} size={14} /> : <span>{i}</span>}
          </button>
        );
      })}
    </div>
  );
}

export { OSC_WAVE_NAMES, LFO_WAVE_NAMES };
