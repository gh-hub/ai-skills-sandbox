import "./globals.css";
import Link from "next/link";
import { Providers } from "./providers";
import { ThemeToggle } from "@/components/theme-toggle";

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
          <header className="flex items-center justify-end gap-4 px-6 py-4">
            <Link
              href="/awards"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Awards
            </Link>
            <ThemeToggle />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
