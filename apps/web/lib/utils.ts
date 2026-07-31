import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The one place the "no icon set" default lives — every award display reads
// an award's icon through `getAwardIcon` instead of hard-coding a fallback.
export const DEFAULT_AWARD_ICON = "🎖️";

export function getAwardIcon(icon: string | null | undefined): string {
  return icon && icon.trim() !== "" ? icon : DEFAULT_AWARD_ICON;
}
