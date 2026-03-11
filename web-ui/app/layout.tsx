import type { Metadata } from "next";
import { Outfit, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Providers } from "@/components/providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Build with Claude - Plugin Marketplace",
  description: "The plugin marketplace for Claude Code. Browse plugins, subagents, commands, skills, and hooks to enhance your AI development workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 pl-60">
              <Topbar />
              <main className="flex-1 pt-12">
                {children}
              </main>
              <footer className="border-t border-border/40">
                <div className="px-8 py-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>
                      Made by <a href="https://github.com/davepoon" className="hover:text-foreground transition-colors">Dave Poon</a>
                    </p>
                    <div className="flex items-center gap-6">
                      <a
                        href="https://github.com/davepoon/buildwithclaude/blob/main/LICENSE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        MIT License
                      </a>
                      <a
                        href="https://github.com/davepoon/buildwithclaude"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
