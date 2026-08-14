"use client";

import Link from "next/link";
import { HeaderAuthControl } from "@/components/header-auth-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { useHeroVisibility } from "@/lib/hero-visibility-context";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { heroVisible } = useHeroVisibility();

  return (
    <header
      data-testid="site-header"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card/95 px-6 py-3 font-mono text-sm backdrop-blur"
    >
      <span className="font-medium text-foreground">Thanks, Claude</span>
      <div className="flex items-center gap-4">
        {/* Grouped so both can snap to the far end of the header (via `order`)
            while the login-control slot below is hidden, and back to their
            default position once it's shown — no transition on the reorder
            itself, only on the login slot's own fade below. */}
        <div className={cn("flex items-center gap-4", heroVisible && "order-last")}>
          <Link
            href="/awards"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Awards
          </Link>
          <ThemeToggle />
        </div>
        {/* Always mounted (not conditionally rendered) so the home route gets a
            real opacity/transform fade — matching today's exact sticky-header.tsx
            reveal — while every other route (heroVisible stays default false)
            renders this already-shown with no transition triggered post-mount. */}
        <div
          data-testid="header-auth-fade"
          aria-hidden={heroVisible}
          className={cn(
            "transition-transform transition-opacity duration-300 ease-in-out",
            heroVisible
              ? "-translate-y-full opacity-0 pointer-events-none"
              : "translate-y-0 opacity-100"
          )}
        >
          <HeaderAuthControl />
        </div>
      </div>
    </header>
  );
}
