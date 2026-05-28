"use client";

import { useState, useTransition } from "react";
import { approveApplication, rejectApplication, deleteApplication } from "@/lib/actions/applications";

type Application = {
  id: string; email: string; display_name: string; note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string; reviewed_at: string | null;
};

const STATUS_STYLE: Record<Application["status"], { label: string; color: string }> = {
  pending:  { label: "PENDING",  color: "#BEC23F" },
  approved: { label: "APPROVED", color: "rgba(190,194,63,0.5)" },
  rejected: { label: "REJECTED", color: "rgba(214,92,106,0.7)" },
};

export default function ApplicationsTab({ applications }: { applications: Application[] }) {
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = filter === "pending" ? applications.filter(a => a.status === "pending") : applications;

  function run(id: string, fn: (id: string) => Promise<{ error?: string; ok?: boolean }>) {
    setBusyId(id);
    start(async () => {
      const res = await fn(id);
      setBusyId(null);
      if (res.error) alert(res.error);
    });
  }

  return (
    <div>
      <div className="flex gap-1 mb-4" style={{ background: "#2c2c2a", padding: "2px", borderRadius: 4 }}>
        {(["pending", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              flex: 1, padding: "0.5rem", fontFamily: "var(--font-space-mono)", fontSize: "0.65rem",
              letterSpacing: "0.12em", border: "none", cursor: "pointer", borderRadius: 3,
              background: filter === f ? "#BEC23F" : "transparent",
              color: filter === f ? "#1a1b18" : "rgba(237,236,234,0.4)",
            }}>
            {f === "pending" ? "待審" : "全部"}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.2)", textAlign: "center", padding: "3rem 0" }}>
          沒有{filter === "pending" ? "待審" : ""}申請。
        </p>
      )}

      <div className="space-y-px" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
        {list.map(app => {
          const status = STATUS_STYLE[app.status];
          const isBusy = busyId === app.id && pending;
          return (
            <div key={app.id} style={{ background: "#2c2c2a", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "1rem" }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.95rem", color: "#edecea" }}>{app.display_name}</p>
                  <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.7rem", color: "rgba(237,236,234,0.4)", marginTop: "0.2rem", wordBreak: "break-all" }}>
                    {app.email}
                  </p>
                </div>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", color: status.color, flexShrink: 0 }}>
                  {status.label}
                </span>
              </div>

              {app.note && (
                <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.55)", lineHeight: 1.6, marginBottom: "0.75rem", whiteSpace: "pre-wrap" }}>
                  {app.note}
                </p>
              )}

              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.2)", letterSpacing: "0.08em", marginBottom: app.status === "pending" ? "0.75rem" : 0 }}>
                {new Date(app.created_at).toLocaleString("en-US", { timeZone: "Asia/Taipei", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).toUpperCase()}
              </p>

              {app.status === "pending" && (
                <div className="flex gap-2">
                  <button disabled={isBusy} onClick={() => run(app.id, approveApplication)}
                    className="btn-primary" style={{ flex: 1, letterSpacing: "0.1em", fontSize: "0.7rem", padding: "0.55rem" }}>
                    {isBusy ? "..." : "通過 + 寄信"}
                  </button>
                  <button disabled={isBusy} onClick={() => run(app.id, rejectApplication)}
                    style={{
                      flex: 1, background: "transparent", border: "1px solid rgba(214,92,106,0.4)",
                      color: "rgba(214,92,106,0.9)", padding: "0.55rem", fontFamily: "var(--font-space-mono)",
                      fontSize: "0.7rem", letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4,
                    }}>
                    拒絕
                  </button>
                </div>
              )}

              {app.status !== "pending" && (
                <button disabled={isBusy} onClick={() => { if (confirm("刪除這筆申請？")) run(app.id, deleteApplication); }}
                  style={{
                    marginTop: "0.5rem", background: "none", border: "none", padding: 0,
                    color: "rgba(237,236,234,0.3)", fontFamily: "var(--font-space-mono)",
                    fontSize: "0.6rem", letterSpacing: "0.08em", cursor: "pointer",
                  }}>
                  DELETE
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
