import "./globals.css";
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
          <header>
            <ThemeToggle />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
