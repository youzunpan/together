"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { adminRemoveMember } from "@/lib/actions/profile";

type Member = {
  id: string;
  display_name: string;
  avatar_letter: string;
  avatar_color: string;
  role: string;
  created_at: string;
};

export default function MembersTab({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [error, setError] = useState("");

  function handleRemove(id: string) {
    setError("");
    start(async () => {
      const res = await adminRemoveMember(id);
      if (res.error) setError(res.error);
      else setConfirmId(null);
    });
  }

  if (members.length === 0) {
    return (
      <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.2)", textAlign: "center", padding: "3rem 0" }}>
        還沒有成員。
      </p>
    );
  }

  return (
    <div className="space-y-px" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
      {members.map((m) => {
        const isMe = m.id === currentUserId;
        const isAdmin = m.role === "admin";
        const isConfirming = confirmId === m.id;

        return (
          <div
            key={m.id}
            style={{ background: "#2c2c2a", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0.875rem 1rem" }}
            className="flex items-center gap-3"
          >
            <Link
              href={`/u/${m.id}`}
              className="flex-1 min-w-0 flex items-center gap-3 hover:opacity-80 transition-opacity"
              style={{ textDecoration: "none" }}
            >
              <div
                className={`avatar-${m.avatar_color} flex-shrink-0 flex items-center justify-center font-medium`}
                style={{ width: 32, height: 32, fontSize: "0.8rem" }}
              >
                {m.avatar_letter}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "0.875rem", color: "#edecea" }}>{m.display_name}</p>
                <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.25)", letterSpacing: "0.08em", marginTop: "0.2rem" }}>
                  {m.role.toUpperCase()} · {new Date(m.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" }).toUpperCase()}
                </p>
              </div>
            </Link>

            {!isMe && !isAdmin && (
              isConfirming ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id)}
                    disabled={busy}
                    style={{
                      background: "#D65C6A", color: "#1a1b18", border: "none",
                      padding: "0.35rem 0.6rem", fontFamily: "var(--font-space-mono)",
                      fontSize: "0.6rem", letterSpacing: "0.1em",
                      cursor: busy ? "default" : "pointer", borderRadius: 4,
                    }}
                  >
                    {busy ? "..." : "移除"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfirmId(null); setError(""); }}
                    disabled={busy}
                    style={{
                      background: "transparent", color: "rgba(237,236,234,0.4)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      padding: "0.35rem 0.6rem", fontFamily: "var(--font-space-mono)",
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
                  onClick={() => setConfirmId(m.id)}
                  title="移除這位成員（不可還原）"
                  style={{
                    background: "transparent", color: "rgba(214,92,106,0.5)",
                    border: "1px solid rgba(214,92,106,0.2)",
                    padding: "0.35rem 0.6rem", fontFamily: "var(--font-space-mono)",
                    fontSize: "0.6rem", letterSpacing: "0.1em",
                    cursor: "pointer", borderRadius: 4,
                  }}
                >
                  移除
                </button>
              )
            )}
          </div>
        );
      })}
      {error && (
        <p style={{ fontSize: "0.75rem", color: "#D65C6A", padding: "0.5rem 1rem", background: "#2c2c2a" }}>
          {error}
        </p>
      )}
    </div>
  );
}
