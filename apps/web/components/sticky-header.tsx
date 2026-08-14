"use client";

import { useEffect, useState, type RefObject } from "react";
import { HeaderAuthControl } from "@/components/header-auth-control";
import { cn } from "@/lib/utils";

export function useIsScrolledPast(ref: RefObject<HTMLElement | null>): boolean {
  const [isScrolledPast, setIsScrolledPast] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsScrolledPast(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return isScrolledPast;
}

export function StickyHeader({ visible }: { visible: boolean }) {
  return (
    <div
      data-testid="sticky-header"
      aria-hidden={!visible}
      className={cn(
        "fixed top-0 inset-x-0 z-50 flex items-center justify-between border-b border-border bg-card/95 px-6 py-3 font-mono text-sm backdrop-blur transition-transform transition-opacity duration-300 ease-in-out",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <span className="font-medium text-foreground">Thanks, Claude</span>
      <HeaderAuthControl />
    </div>
  );
}
