import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Blocky rectangles that make up the mark, traced from the source icon's
 * pixel geometry on a 512x512 canvas: a wide head with two eye slits, a
 * full-width flange, a body, and four feet.
 */
const RECTS: { x: number; y: number; width: number; height: number }[] = [
  { x: 64, y: 107, width: 384, height: 66 },
  { x: 64, y: 173, width: 64, height: 61 },
  { x: 160, y: 173, width: 192, height: 61 },
  { x: 384, y: 173, width: 64, height: 61 },
  { x: 0, y: 234, width: 512, height: 66 },
  { x: 64, y: 300, width: 384, height: 64 },
  { x: 96, y: 364, width: 32, height: 63 },
  { x: 160, y: 364, width: 32, height: 63 },
  { x: 320, y: 364, width: 32, height: 63 },
  { x: 384, y: 364, width: 32, height: 63 },
];

export interface SparkMarkProps
  extends Omit<React.SVGProps<SVGSVGElement>, "size"> {
  /** Rendered width and height, in pixels. Defaults to 32. */
  size?: number;
}

/**
 * Uses `currentColor` for the fill, so it inherits whatever text-color
 * utility is applied to it (defaults to `text-primary`, overridable via
 * `className`) and recolors automatically between light and dark mode
 * along with the rest of the theme. No background — transparent by default.
 */
export function SparkMark({ size = 32, className, ...props }: SparkMarkProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-hidden="true"
      className={cn("text-primary", className)}
      {...props}
    >
      {RECTS.map(({ x, y, width, height }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={width}
          height={height}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
