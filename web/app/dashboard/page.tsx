"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [cellId, setCellId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ memory: string; files: string[]; messageCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("claw_cell_id");
    setCellId(id);
    if (id) loadStatus(id);
    else setLoading(false);
  }, []);

  async function loadStatus(id: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cell_id: id }),
      });
      const data = await res.json();
      if (!data.error) setStatus(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  if (!cellId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] mb-4" style={{ color: "var(--text-dim)" }}>No Claw launched yet.</p>
          <a href="/" className="px-6 py-2 rounded-lg text-[13px]" style={{ background: "var(--accent)", color: "#0a0a0a" }}>
            Launch your Claw
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3" style={{ textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: "20px" }}>🦞</span>
            <span className="font-medium text-[15px]">Claw</span>
          </a>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(92,219,127,0.1)", color: "var(--green)" }}>running</span>
        </div>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Powered by{" "}
          <a href="https://oncell.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>oncell</a>
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-xl font-medium mb-6">Dashboard</h1>

        {/* Cell info */}
        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
          <div className="text-[11px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>CELL</div>
          <code className="text-[12px]" style={{ color: "var(--text-dim)" }}>{cellId}</code>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }} />
            ))}
          </div>
        ) : status ? (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-2xl font-light" style={{ color: "var(--accent)" }}>{status.messageCount}</div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Messages</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-2xl font-light" style={{ color: "var(--accent)" }}>{status.files.length}</div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Files</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-2xl font-light" style={{ color: "var(--accent)" }}>{status.memory.split("\n").filter(Boolean).length}</div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Memories</div>
              </div>
            </div>

            {/* Memory */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
              <div className="text-[11px] font-medium mb-3" style={{ color: "var(--text-muted)" }}>MEMORY</div>
              {status.memory ? (
                <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-dim)" }}>{status.memory}</div>
              ) : (
                <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>No memories yet. Start chatting to build memory.</div>
              )}
            </div>

            {/* Files */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
              <div className="text-[11px] font-medium mb-3" style={{ color: "var(--text-muted)" }}>FILES</div>
              {status.files.length > 0 ? (
                <div className="space-y-1">
                  {status.files.map((f) => (
                    <div key={f} className="text-[13px] flex items-center gap-2" style={{ color: "var(--text-dim)" }}>
                      <span style={{ color: "var(--text-muted)" }}>📄</span> {f}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>No files yet. Ask Claw to save notes.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>Could not load status. Cell may be paused.</div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => cellId && loadStatus(cellId)}
            className="text-[12px] px-4 py-2 rounded-lg"
            style={{ color: "var(--text-dim)", border: "1px solid var(--border)" }}
          >
            Refresh
          </button>
          <button
            onClick={() => { localStorage.removeItem("claw_cell_id"); window.location.href = "/"; }}
            className="text-[12px] px-4 py-2 rounded-lg"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
