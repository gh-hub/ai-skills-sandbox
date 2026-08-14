import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { HeroVisibilityProvider } from "@/lib/hero-visibility-context";

export const metadata = {
  title: "Thanks, Claude",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <HeroVisibilityProvider>
            <SiteHeader />
            {/* pt-16 clears the fixed SiteHeader (border-b + py-3 + a size-9
                icon button ≈ 61px tall) — see PROGRESS notes for ticket 01. */}
            <div className="pt-16">{children}</div>
          </HeroVisibilityProvider>
        </Providers>
      </body>
    </html>
  );
}
