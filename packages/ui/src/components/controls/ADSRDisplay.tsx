/**
 * ADSRDisplay — SVG envelope shape visualizer.
 *
 * Draws the classic ADSR curve based on normalized 0–127 parameter values.
 * Attack and Decay/Release map to horizontal time, Sustain to vertical level.
 *
 * Not interactive — pair it with four Knob or Slider controls.
 */

interface ADSRDisplayProps {
  /** 0–127 */
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function ADSRDisplay({
  attack,
  decay,
  sustain,
  release,
  width = 160,
  height = 64,
  color = "#ff6b35",
  className = "",
}: ADSRDisplayProps) {
  const pad = 8;
  const w = width - pad * 2;
  const h = height - pad * 2;

  // Normalise to [0,1]
  const a = attack / 127;
  const d = decay / 127;
  const s = sustain / 127;
  const r = release / 127;

  // Each segment gets proportional share: min 2% so zero values remain visible
  const minFrac = 0.02;
  const aW = w * Math.max(minFrac, 0.25 * a);
  const dW = w * Math.max(minFrac, 0.25 * d);
  const rW = w * Math.max(minFrac, 0.25 * r);
  const sW = Math.max(minFrac * w, w - aW - dW - rW);

  // Vertical: 0 = bottom, 1 = top
  const bot = pad + h;
  const top = pad;
  const susY = pad + h * (1 - s);

  // Key x positions
  const x0 = pad;
  const x1 = pad + aW;
  const x2 = x1 + dW;
  const x3 = x2 + sW;
  const x4 = x3 + rW;

  const d_path = [
    `M ${x0} ${bot}`,
    `L ${x1} ${top}`, // attack: rise to peak
    `L ${x2} ${susY}`, // decay: fall to sustain
    `L ${x3} ${susY}`, // sustain hold
    `L ${x4} ${bot}`, // release: fall to zero
  ].join(" ");

  // Fill area under curve
  const fill_path = `${d_path} L ${x4} ${bot} L ${x0} ${bot} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <title>
        ADSR: A={attack} D={decay} S={sustain} R={release}
      </title>
      {/* Fill */}
      <path d={fill_path} fill={color} opacity={0.12} />
      {/* Stroke */}
      <path d={d_path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      {/* Sustain level guide */}
      <line
        x1={x2}
        y1={susY}
        x2={x3}
        y2={susY}
        stroke={color}
        strokeWidth={1}
        opacity={0.3}
        strokeDasharray="3 2"
      />
    </svg>
  );
}
