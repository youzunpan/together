"use client";

import { useState, useTransition } from "react";
import { clearAllErrors } from "@/lib/actions/errors";

export type ErrorRow = {
  id: string;
  created_at: string;
  source: string;
  route: string | null;
  user_id: string | null;
  user_agent: string | null;
  message: string;
  stack: string | null;
  meta: Record<string, unknown> | null;
};

const sourceLabel: Record<string, string> = {
  "server-action": "SERVER",
  "react-error": "REACT",
  client: "CLIENT",
  "api-route": "API",
  other: "OTHER",
};

function formatTime(iso: string): string {
  // 短格式：MM/DD HH:mm（窄手機放得下）
  const d = new Date(iso);
  return d.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ErrorsTab({ errors }: { errors: ErrorRow[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [clearing, startClear] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleClear() {
    startClear(async () => {
      await clearAllErrors();
      setConfirm(false);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.3)" }}>
          {errors.length === 0 ? "沒有錯誤" : `${errors.length} 筆錯誤（最新在最上面）`}
        </p>
        {errors.length > 0 && (
          confirm ? (
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={handleClear}
                disabled={clearing}
                style={{
                  background: "#D65C6A", color: "#1a1b18", border: "none",
                  padding: "0.35rem 0.75rem", fontFamily: "var(--font-space-mono)",
                  fontSize: "0.6rem", letterSpacing: "0.1em",
                  cursor: clearing ? "default" : "pointer", borderRadius: 4,
                }}
              >
                {clearing ? "..." : "確定全清"}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                disabled={clearing}
                style={{
                  background: "transparent", color: "rgba(237,236,234,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "0.35rem 0.75rem", fontFamily: "var(--font-space-mono)",
                  fontSize: "0.6rem", letterSpacing: "0.1em",
                  cursor: "pointer", borderRadius: 4,
                }}
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              style={{
                background: "transparent", color: "rgba(214,92,106,0.7)",
                border: "1px solid rgba(214,92,106,0.3)",
                padding: "0.35rem 0.75rem", fontFamily: "var(--font-space-mono)",
                fontSize: "0.6rem", letterSpacing: "0.1em",
                cursor: "pointer", borderRadius: 4,
              }}
            >
              清空
            </button>
          )
        )}
      </div>

      {errors.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.2)", textAlign: "center", padding: "3rem 0" }}>
          目前沒有任何錯誤紀錄。✨
        </p>
      ) : (
        <div className="space-y-px" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
          {errors.map((e) => {
            const isOpen = openIds.has(e.id);
            return (
              <div key={e.id} style={{ background: "#2c2c2a", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <button
                  type="button"
                  onClick={() => toggle(e.id)}
                  className="w-full text-left"
                  style={{
                    background: "transparent", border: "none",
                    padding: "0.75rem 1rem", cursor: "pointer", color: "inherit",
                  }}
                >
                  <div className="flex items-baseline flex-wrap" style={{ gap: "0.4rem 0.5rem" }}>
                    <span style={{
                      fontFamily: "var(--font-space-mono)", fontSize: "0.55rem",
                      letterSpacing: "0.08em",
                      color: e.source === "react-error" ? "#D65C6A" : "rgba(237,236,234,0.4)",
                      flexShrink: 0,
                    }}>
                      {sourceLabel[e.source] ?? e.source.toUpperCase()}
                    </span>
                    {e.route && (
                      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: "rgba(237,236,234,0.35)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.route}
                      </span>
                    )}
                    <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: "rgba(237,236,234,0.25)", marginLeft: "auto", flexShrink: 0 }}>
                      {formatTime(e.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#edecea", marginTop: "0.35rem", lineHeight: 1.4, wordBreak: "break-word" }}>
                    {e.message}
                  </p>
                </button>
                {isOpen && (
                  <div style={{ background: "#1a1b18", padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.04)", fontFamily: "var(--font-space-mono)", fontSize: "0.7rem", color: "rgba(237,236,234,0.55)" }}>
                    {e.user_id && (
                      <div style={{ marginBottom: "0.5rem" }}>
                        <span style={{ color: "rgba(237,236,234,0.3)" }}>USER:</span> {e.user_id}
                      </div>
                    )}
                    {e.user_agent && (
                      <div style={{ marginBottom: "0.5rem", wordBreak: "break-all" }}>
                        <span style={{ color: "rgba(237,236,234,0.3)" }}>UA:</span> {e.user_agent}
                      </div>
                    )}
                    {e.stack && (
                      <div style={{ marginBottom: "0.5rem" }}>
                        <span style={{ color: "rgba(237,236,234,0.3)" }}>STACK:</span>
                        <pre style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.65rem", color: "rgba(237,236,234,0.4)", lineHeight: 1.4 }}>
                          {e.stack}
                        </pre>
                      </div>
                    )}
                    {e.meta && Object.keys(e.meta).length > 0 && (
                      <div>
                        <span style={{ color: "rgba(237,236,234,0.3)" }}>META:</span>
                        <pre style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.65rem", color: "rgba(237,236,234,0.4)" }}>
                          {JSON.stringify(e.meta, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
