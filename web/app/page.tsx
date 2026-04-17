"use client";

import { useState } from "react";

export default function Home() {
  const [launching, setLaunching] = useState(false);
  const [cellId, setCellId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("claw_cell_id");
  });
  const [error, setError] = useState("");

  async function handleLaunch() {
    setLaunching(true);
    setError("");

    const userId = crypto.randomUUID();

    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        localStorage.setItem("claw_cell_id", data.cell_id);
        localStorage.setItem("claw_user_id", userId);
        setCellId(data.cell_id);
      }
    } catch {
      setError("Failed to launch. Try again.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "20px" }}>🦞</span>
          <span className="font-medium text-[15px]">Claw</span>
        </div>
        <div className="flex items-center gap-3">
          {cellId && (
            <a href="/dashboard" className="text-[12px] px-3 py-1.5 rounded-lg" style={{ color: "var(--text-dim)", border: "1px solid var(--border)" }}>
              Dashboard
            </a>
          )}
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Powered by{" "}
            <a href="https://oncell.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>oncell</a>
          </span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6">
        {!cellId ? (
          /* Landing */
          <div className="text-center max-w-lg animate-fade-in">
            <div className="text-6xl mb-6">🦞</div>
            <h1 className="text-3xl font-medium mb-3">Your own AI assistant</h1>
            <p className="text-[15px] leading-relaxed mb-2" style={{ color: "var(--text-dim)" }}>
              Get a personal AI that remembers everything, saves your files, and connects to WhatsApp, Telegram, Discord, or Slack.
            </p>
            <p className="text-[13px] mb-8" style={{ color: "var(--text-muted)" }}>
              Persistent memory. Isolated environment. Runs 24/7. Costs almost nothing when idle.
            </p>

            <button
              onClick={handleLaunch}
              disabled={launching}
              className="px-8 py-3 rounded-xl text-[15px] font-medium transition-all disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}
            >
              {launching ? "Launching..." : "Launch your Claw"}
            </button>

            {error && (
              <p className="mt-4 text-[13px]" style={{ color: "#ef4444" }}>{error}</p>
            )}

            <div className="mt-12 grid grid-cols-3 gap-4 text-center">
              {[
                ["🧠", "Persistent Memory", "Remembers across sessions"],
                ["📁", "File Storage", "Save notes, code, docs"],
                ["🔒", "Isolated", "Your own private environment"],
              ].map(([icon, title, desc]) => (
                <div key={title} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                  <div className="text-xl mb-2">{icon}</div>
                  <div className="text-[12px] font-medium mb-1">{title}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Post-launch — connect messaging */
          <div className="text-center max-w-lg animate-fade-in">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(92,219,127,0.1)", border: "1px solid rgba(92,219,127,0.2)" }}>
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-medium mb-2">Your Claw is running</h1>
            <p className="text-[13px] mb-1" style={{ color: "var(--text-dim)" }}>
              Cell: <code className="px-2 py-0.5 rounded text-[11px]" style={{ background: "rgba(255,255,255,0.04)" }}>{cellId}</code>
            </p>
            <p className="text-[13px] mb-8" style={{ color: "var(--text-muted)" }}>
              Now connect a messaging platform to start chatting.
            </p>

            <div className="space-y-3 max-w-sm mx-auto text-left">
              {[
                { name: "WhatsApp", icon: "💬", desc: "Scan QR code with your phone", cmd: "/add-whatsapp" },
                { name: "Telegram", icon: "✈️", desc: "Connect via BotFather token", cmd: "/add-telegram" },
                { name: "Discord", icon: "🎮", desc: "Connect via bot token", cmd: "/add-discord" },
                { name: "Slack", icon: "💼", desc: "Connect via Slack app", cmd: "/add-slack" },
              ].map((platform) => (
                <div key={platform.name} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                  <span className="text-xl shrink-0">{platform.icon}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{platform.name}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{platform.desc}</div>
                  </div>
                  <code className="text-[10px] px-2 py-1 rounded shrink-0" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                    {platform.cmd}
                  </code>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl text-left" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
              <div className="text-[11px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>SETUP</div>
              <div className="text-[12px] font-mono leading-relaxed" style={{ color: "var(--text-dim)" }}>
                <div>1. Install Claude Code: <span style={{ color: "var(--text)" }}>npm install -g @anthropic-ai/claude-code</span></div>
                <div>2. Clone oncell-claw: <span style={{ color: "var(--text)" }}>git clone github.com/oncellai/oncell-claw</span></div>
                <div>3. Run: <span style={{ color: "var(--text)" }}>claude</span></div>
                <div>4. Type: <span style={{ color: "var(--accent)" }}>/add-whatsapp</span></div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-center">
              <a href="/dashboard" className="text-[12px] px-4 py-2 rounded-lg" style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>
                View Dashboard
              </a>
              <button
                onClick={() => { localStorage.removeItem("claw_cell_id"); setCellId(null); }}
                className="text-[12px] px-4 py-2 rounded-lg"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                Launch another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
