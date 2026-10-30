import { useRef } from "react";

export function SplitHandle({
  orientation,
  label,
  value,
  min,
  max,
  step,
  scale = 1,
  reverse = false,
  onChange,
}: {
  orientation: "vertical" | "horizontal";
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  scale?: number;
  reverse?: boolean;
  onChange: (value: number) => void;
}) {
  const drag = useRef<{ coordinate: number; value: number } | null>(null);
  const apply = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  return (
    <div
      className={`split-handle split-${orientation}`}
      role="separator"
      aria-label={label}
      aria-orientation={orientation}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      title={`${label} · drag or use arrow keys`}
      onPointerDown={(event) => {
        event.preventDefault();
        drag.current = {
          coordinate:
            orientation === "vertical" ? event.clientX : event.clientY,
          value,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (
          !drag.current ||
          !event.currentTarget.hasPointerCapture(event.pointerId)
        )
          return;
        const coordinate =
          orientation === "vertical" ? event.clientX : event.clientY;
        apply(
          drag.current.value +
            (coordinate - drag.current.coordinate) * scale * (reverse ? -1 : 1),
        );
      }}
      onPointerUp={(event) => {
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onKeyDown={(event) => {
        const increase = orientation === "vertical" ? "ArrowRight" : "ArrowUp";
        const decrease = orientation === "vertical" ? "ArrowLeft" : "ArrowDown";
        if ([increase, decrease, "Home", "End"].includes(event.key)) {
          event.preventDefault();
          apply(
            event.key === "Home"
              ? min
              : event.key === "End"
                ? max
                : value + (event.key === increase ? step : -step),
          );
        }
      }}
    >
      <span />
    </div>
  );
}
