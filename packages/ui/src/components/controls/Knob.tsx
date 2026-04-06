/**
 * Knob — SVG rotary control with mouse drag.
 *
 * - Drag up/down: fine adjustment (1 px = 1 unit)
 * - Shift+drag: coarse (1 px = 0.25 unit)
 * - Double-click: reset to defaultValue
 * - Displays current value as tooltip on hover
 *
 * Range:  min..max (both inclusive)
 * Value:  raw integer in [min, max]
 */

import { useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  defaultValue?: number;
  label?: string;
  size?: number;
  /** Called on every change (including drag) */
  onChange: (value: number) => void;
  /** Called when mouse is released (commit change) */
  onCommit?: (value: number) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function clampTo(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Start angle (7 o'clock, clockwise from 12 o'clock, in degrees) */
const START_ANGLE = -150;
/** End angle (5 o'clock) */
const END_ANGLE = 150;

function valueToAngle(value: number, min: number, max: number): number {
  const t = max === min ? 0 : (value - min) / (max - min);
  return START_ANGLE + t * (END_ANGLE - START_ANGLE);
}

function polarToXY(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Knob({
  value,
  min = 0,
  max = 127,
  defaultValue,
  label,
  size = 48,
  onChange,
  onCommit,
  className = "",
}: KnobProps) {
  const def = defaultValue ?? Math.round((min + max) / 2);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(value);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = value;

      const onMove = (me: MouseEvent) => {
        if (!dragging.current) return;
        const dy = startY.current - me.clientY; // up = positive
        const scale = me.shiftKey ? 0.25 : 1;
        onChange(clampTo(startValue.current + dy * scale, min, max));
      };

      const onUp = (me: MouseEvent) => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        const dy = startY.current - me.clientY;
        const scale = me.shiftKey ? 0.25 : 1;
        onCommit?.(clampTo(startValue.current + dy * scale, min, max));
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [value, min, max, onChange, onCommit]
  );

  const onDoubleClick = useCallback(() => {
    onChange(def);
    onCommit?.(def);
  }, [def, onChange, onCommit]);

  // SVG drawing
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const angle = valueToAngle(value, min, max);
  const arcStart = polarToXY(START_ANGLE, r, cx, cy);
  const arcEnd = polarToXY(angle, r, cx, cy);
  const largeArc = angle - START_ANGLE > 180 ? 1 : 0;
  const indicatorEnd = polarToXY(angle, r - 4, cx, cy);

  const trackPath = `M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 1 1 ${polarToXY(END_ANGLE, r, cx, cy).x} ${polarToXY(END_ANGLE, r, cx, cy).y}`;
  const valuePath =
    angle > START_ANGLE
      ? `M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`
      : "";

  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        className="cursor-ns-resize select-none"
      >
        <title>
          {label ? `${label}: ` : ""}
          {value}
        </title>
        {/* Track (full arc) */}
        <path d={trackPath} fill="none" stroke="#2a2a2a" strokeWidth={3} strokeLinecap="round" />
        {/* Value arc */}
        {valuePath && (
          <path d={valuePath} fill="none" stroke="#ff6b35" strokeWidth={3} strokeLinecap="round" />
        )}
        {/* Knob body */}
        <circle cx={cx} cy={cy} r={r - 6} fill="#1e1e1e" stroke="#333" strokeWidth={1} />
        {/* Indicator dot */}
        <circle cx={indicatorEnd.x} cy={indicatorEnd.y} r={2} fill="#ff6b35" />
      </svg>
      {label && (
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider leading-none">
          {label}
        </span>
      )}
    </div>
  );
}
