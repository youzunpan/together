"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { adminRemoveMember, adminResetPassword } from "@/lib/actions/profile";

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
  // 重設密碼後顯示給 admin 看一次
  const [resetResult, setResetResult] = useState<{ name: string; pw: string } | null>(null);
  const [resetConfirmId, setResetConfirmId] = useState<string | null>(null);
  const [resetting, startReset] = useTransition();

  function handleRemove(id: string) {
    setError("");
    start(async () => {
      const res = await adminRemoveMember(id);
      if (res.error) setError(res.error);
      else setConfirmId(null);
    });
  }

  function handleReset(id: string) {
    setError("");
    startReset(async () => {
      const res = await adminResetPassword(id);
      if (res.error) {
        setError(res.error);
      } else if (res.ok) {
        setResetResult({ name: res.displayName ?? "", pw: res.password ?? "" });
      }
      setResetConfirmId(null);
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
                    {busy ? "..." : "確定移除"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfirmId(null); setError(""); }}
                    disabled={busy}
                    style={cancelBtnStyle}
                  >
                    取消
                  </button>
                </div>
              ) : resetConfirmId === m.id ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReset(m.id)}
                    disabled={resetting}
                    style={{
                      background: "#BEC23F", color: "#1a1b18", border: "none",
                      padding: "0.35rem 0.6rem", fontFamily: "var(--font-space-mono)",
                      fontSize: "0.6rem", letterSpacing: "0.1em",
                      cursor: resetting ? "default" : "pointer", borderRadius: 4,
                    }}
                  >
                    {resetting ? "..." : "確定重設"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setResetConfirmId(null); setError(""); }}
                    disabled={resetting}
                    style={cancelBtnStyle}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setResetConfirmId(m.id)}
                    title="幫這位成員設一組臨時密碼，再私下傳給他"
                    style={{
                      background: "transparent", color: "rgba(190,194,63,0.65)",
                      border: "1px solid rgba(190,194,63,0.3)",
                      padding: "0.35rem 0.6rem", fontFamily: "var(--font-space-mono)",
                      fontSize: "0.6rem", letterSpacing: "0.1em",
                      cursor: "pointer", borderRadius: 4,
                    }}
                  >
                    重設密碼
                  </button>
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
                </div>
              )
            )}
          </div>
        );
      })}

      {/* 重設密碼結果：modal-ish */}
      {resetResult && (
        <div
          onClick={() => setResetResult(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1a1b18", border: "1px solid rgba(190,194,63,0.3)",
              borderRadius: 6, padding: "1.5rem 1.25rem", maxWidth: 360, width: "100%",
            }}
          >
            <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", color: "rgba(190,194,63,0.7)", marginBottom: "0.5rem" }}>
              已重設 {resetResult.name} 的密碼
            </p>
            <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.6)", lineHeight: 1.6, marginBottom: "1rem" }}>
              私下把這組臨時密碼傳給他，請他登入後到設定頁自己改一組好記的。
            </p>
            <div
              style={{
                fontFamily: "var(--font-space-mono)", fontSize: "1.5rem",
                letterSpacing: "0.1em", color: "#BEC23F",
                background: "rgba(190,194,63,0.08)", border: "1px solid rgba(190,194,63,0.25)",
                padding: "1rem", borderRadius: 4, textAlign: "center",
                userSelect: "all", marginBottom: "1rem",
              }}
            >
              {resetResult.pw}
            </div>
            <p style={{ fontSize: "0.7rem", color: "rgba(237,236,234,0.4)", textAlign: "center", lineHeight: 1.6 }}>
              ⚠️ 關掉這個視窗後就看不到了。記得先複製。
            </p>
            <button
              type="button"
              onClick={() => setResetResult(null)}
              className="btn-primary"
              style={{ width: "100%", padding: "0.55rem", fontSize: "0.75rem", letterSpacing: "0.12em", marginTop: "1rem" }}
            >
              我記下來了
            </button>
          </div>
        </div>
      )}
      {error && (
        <p style={{ fontSize: "0.75rem", color: "#D65C6A", padding: "0.5rem 1rem", background: "#2c2c2a" }}>
          {error}
        </p>
      )}
    </div>
  );
}

const cancelBtnStyle: React.CSSProperties = {
  background: "transparent",
  color: "rgba(237,236,234,0.4)",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "0.35rem 0.6rem",
  fontFamily: "var(--font-space-mono)",
  fontSize: "0.6rem",
  letterSpacing: "0.1em",
  cursor: "pointer",
  borderRadius: 4,
};
