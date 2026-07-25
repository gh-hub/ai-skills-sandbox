import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Radiating spokes (angle in degrees, length as a fraction of the 24x24
 * viewBox's half-width) that make up the mark. Purely geometric — an
 * original abstract "burst around a center point," not a trace of any
 * existing logo.
 */
const SPOKES: { angle: number; length: number }[] = [
  { angle: 0, length: 10.5 },
  { angle: 45, length: 7.5 },
  { angle: 90, length: 10.5 },
  { angle: 135, length: 7.5 },
  { angle: 180, length: 10.5 },
  { angle: 225, length: 7.5 },
  { angle: 270, length: 10.5 },
  { angle: 315, length: 7.5 },
];

const CENTER = 12;
const INNER_RADIUS = 3.5;

export interface SparkMarkProps
  extends Omit<React.SVGProps<SVGSVGElement>, "size"> {
  /** Rendered width and height, in pixels. Defaults to 32. */
  size?: number;
}

/**
 * An original, hand-built decorative mark: straight spokes of alternating
 * length radiating from a central point, evoking a spark/star burst in the
 * abstract, generic way many brands use — deliberately not a copy or trace
 * of Anthropic's (or anyone else's) actual logo or brand mark.
 *
 * Uses `currentColor` for both the spokes and the center dot, so it inherits
 * whatever text-color utility is applied to it (defaults to `text-primary`,
 * overridable via `className`) and recolors automatically between light and
 * dark mode along with the rest of the theme.
 */
export function SparkMark({ size = 32, className, ...props }: SparkMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-hidden="true"
      className={cn("text-primary", className)}
      {...props}
    >
      <circle cx={CENTER} cy={CENTER} r="2.25" fill="currentColor" />
      {SPOKES.map(({ angle, length }) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = CENTER + Math.cos(rad) * INNER_RADIUS;
        const y1 = CENTER + Math.sin(rad) * INNER_RADIUS;
        const x2 = CENTER + Math.cos(rad) * length;
        const y2 = CENTER + Math.sin(rad) * length;
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
