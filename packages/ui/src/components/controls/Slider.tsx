/**
 * Slider — vertical or horizontal range control.
 *
 * - Click and drag along the axis to change value
 * - Double-click resets to defaultValue
 */

import { useCallback, useRef } from "react";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  defaultValue?: number;
  label?: string;
  orientation?: "vertical" | "horizontal";
  length?: number;
  thickness?: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  className?: string;
}

function clampTo(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

export function Slider({
  value,
  min = 0,
  max = 127,
  defaultValue,
  label,
  orientation = "vertical",
  length = 80,
  thickness = 20,
  onChange,
  onCommit,
  className = "",
}: SliderProps) {
  const def = defaultValue ?? Math.round((min + max) / 2);

  const startCoord = useRef(0);
  const startValue = useRef(value);
  const dragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startCoord.current = orientation === "vertical" ? e.clientY : e.clientX;
      startValue.current = value;

      const onMove = (me: MouseEvent) => {
        if (!dragging.current) return;
        const coord = orientation === "vertical" ? me.clientY : me.clientX;
        const delta = startCoord.current - coord; // up/right = positive
        const scale = (max - min) / length;
        onChange(clampTo(startValue.current + delta * scale, min, max));
      };

      const onUp = (me: MouseEvent) => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        const coord = orientation === "vertical" ? me.clientY : me.clientX;
        const delta = startCoord.current - coord;
        const scale = (max - min) / length;
        onCommit?.(clampTo(startValue.current + delta * scale, min, max));
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [value, min, max, length, orientation, onChange, onCommit]
  );

  const onDoubleClick = useCallback(() => {
    onChange(def);
    onCommit?.(def);
  }, [def, onChange, onCommit]);

  const pct = max === min ? 0 : (value - min) / (max - min);
  const isV = orientation === "vertical";

  const trackW = isV ? thickness : length;
  const trackH = isV ? length : thickness;
  const thumbSize = thickness - 4;

  // Thumb position
  const thumbX = isV ? 2 : Math.round(pct * (length - thumbSize));
  const thumbY = isV ? Math.round((1 - pct) * (length - thumbSize)) : 2;

  // Fill bar
  const fillW = isV ? thickness - 4 : Math.round(pct * length);
  const fillH = isV ? Math.round(pct * length) : thickness - 4;
  const fillX = isV ? 2 : 0;
  const fillY = isV ? length - fillH - 2 : 2;

  return (
    <div className={`flex ${isV ? "flex-col" : "flex-row"} items-center gap-1 ${className}`}>
      <svg
        width={trackW}
        height={trackH}
        viewBox={`0 0 ${trackW} ${trackH}`}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        className={`${isV ? "cursor-ns-resize" : "cursor-ew-resize"} select-none`}
      >
        <title>
          {label ? `${label}: ` : ""}
          {value}
        </title>
        {/* Track background */}
        <rect
          x={1}
          y={1}
          width={trackW - 2}
          height={trackH - 2}
          rx={3}
          fill="#1a1a1a"
          stroke="#333"
          strokeWidth={1}
        />
        {/* Fill */}
        <rect
          x={fillX}
          y={fillY}
          width={fillW}
          height={fillH}
          rx={2}
          fill="#ff6b35"
          opacity={0.7}
        />
        {/* Thumb */}
        <rect
          x={thumbX}
          y={thumbY}
          width={isV ? thumbSize : 4}
          height={isV ? 4 : thumbSize}
          rx={2}
          fill="#ff6b35"
        />
      </svg>
      {label && (
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider leading-none">
          {label}
        </span>
      )}
    </div>
  );
}
