import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claw — Your Personal AI Assistant",
  description: "Get your own AI assistant with persistent memory. Remembers everything, saves files, learns about you. Powered by OnCell.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
        {children}
      </body>
    </html>
  );
}
