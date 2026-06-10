"use client";

// 給「同心 owner」用的追加邀請按鈕。
// 點開彈一個 dialog，內含 MemberPicker；送出時呼叫 addInvites。
// 已邀請過的人會在 picker 內 disabled，避免重複。

import { useState, useTransition } from "react";
import { addInvites } from "@/lib/actions/calls";
import MemberPicker from "./MemberPicker";

export default function InviteMoreButton({ callId }: { callId: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function close() {
    setOpen(false);
    setSelected([]);
    setError("");
  }

  function send() {
    setError("");
    if (selected.length === 0) {
      setError("至少選一個人");
      return;
    }
    start(async () => {
      const res = await addInvites(callId, selected);
      if (res.error) {
        setError(res.error);
        return;
      }
      close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "transparent",
          border: "1px solid rgba(190,194,63,0.4)",
          color: "#BEC23F",
          padding: "0.3rem 0.7rem",
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        + 邀請
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            background: "rgba(26,27,24,0.85)",
            padding: "1rem",
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            style={{
              background: "#1a1b18",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--r-card)",
              padding: "1rem",
              maxWidth: 420,
              width: "100%",
              maxHeight: "calc(100dvh - 4rem)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <p style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              color: "rgba(237,236,234,0.5)",
              marginBottom: "0.75rem",
            }}>
              追加邀請
            </p>

            <div style={{ flex: 1, overflow: "hidden" }}>
              <MemberPicker
                callId={callId}
                selected={selected}
                onChange={setSelected}
              />
            </div>

            {error && (
              <p style={{ fontSize: "0.7rem", color: "#D65C6A", marginTop: "0.5rem" }}>{error}</p>
            )}

            <div className="flex gap-2" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(237,236,234,0.5)",
                  padding: "0.55rem",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  cursor: pending ? "default" : "pointer",
                  borderRadius: 4,
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={send}
                disabled={pending || selected.length === 0}
                style={{
                  flex: 1,
                  background: selected.length > 0 ? "#BEC23F" : "transparent",
                  border: selected.length > 0 ? "none" : "1px solid rgba(255,255,255,0.1)",
                  color: selected.length > 0 ? "#1a1b18" : "rgba(237,236,234,0.3)",
                  padding: "0.55rem",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  cursor: selected.length > 0 && !pending ? "pointer" : "default",
                  borderRadius: 4,
                }}
              >
                {pending ? "..." : `送出邀請${selected.length > 0 ? ` (${selected.length})` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
