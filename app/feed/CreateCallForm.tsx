"use client";

import { useState, useTransition } from "react";
import { createCall } from "@/lib/actions/calls";
import { taipeiDatetimeLocal } from "@/lib/tz";

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60];

// 預設時間：今天/明天的下一個整點，至少 30 分鐘後
function defaultScheduledLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  // 進到下一個整點
  if (now.getMinutes() > 0) {
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
  }
  now.setSeconds(0);
  return taipeiDatetimeLocal(now);
}

export default function CreateCallForm() {
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledLocal());
  const [durationMin, setDurationMin] = useState(20);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("scheduled_at", scheduledAt);
    fd.set("duration_min", String(durationMin));
    fd.set("message", message);
    start(async () => {
      const res = await createCall(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        setMessage("");
        setScheduledAt(defaultScheduledLocal());
        setDurationMin(20);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px dashed rgba(190,194,63,0.3)",
          color: "rgba(190,194,63,0.7)",
          padding: "0.7rem",
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          borderRadius: "var(--r-card)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(190,194,63,0.6)";
          e.currentTarget.style.color = "#BEC23F";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(190,194,63,0.3)";
          e.currentTarget.style.color = "rgba(190,194,63,0.7)";
        }}
      >
        + 開一場同心
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: "#2c2c2a",
        border: "1px solid rgba(190,194,63,0.3)",
        padding: "1rem",
        borderRadius: "var(--r-card)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.18em",
          color: "rgba(237,236,234,0.4)",
          marginBottom: "0.75rem",
        }}
      >
        開一場同心
      </p>

      {/* 時間 */}
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.55rem",
          letterSpacing: "0.15em",
          color: "rgba(237,236,234,0.35)",
          marginBottom: "0.3rem",
        }}
      >
        WHEN
      </label>
      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        required
        style={{
          width: "100%",
          background: "#1a1b18",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "0.6rem 0.75rem",
          fontSize: "0.85rem",
          color: "#edecea",
          outline: "none",
          borderRadius: 4,
          fontFamily: "var(--font-space-mono)",
          marginBottom: "0.875rem",
        }}
      />

      {/* 時長 */}
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.55rem",
          letterSpacing: "0.15em",
          color: "rgba(237,236,234,0.35)",
          marginBottom: "0.3rem",
        }}
      >
        DURATION
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginBottom: "0.875rem" }}>
        {DURATION_PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setDurationMin(m)}
            style={{
              padding: "0.5rem 0",
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.7rem",
              background: durationMin === m ? "#BEC23F" : "#1a1b18",
              color: durationMin === m ? "#1a1b18" : "rgba(237,236,234,0.4)",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 一句話 */}
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.55rem",
          letterSpacing: "0.15em",
          color: "rgba(237,236,234,0.35)",
          marginBottom: "0.3rem",
        }}
      >
        MESSAGE · 選填
      </label>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 80))}
        placeholder="想說的話（選填）"
        maxLength={80}
        style={{
          width: "100%",
          background: "#1a1b18",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "0.6rem 0.75rem",
          fontSize: "0.85rem",
          color: "#edecea",
          outline: "none",
          borderRadius: 4,
          marginBottom: "0.875rem",
        }}
      />

      {error && (
        <p style={{ fontSize: "0.75rem", color: "#D65C6A", marginBottom: "0.75rem" }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary"
          style={{ flex: 1, padding: "0.55rem", fontSize: "0.75rem", letterSpacing: "0.1em" }}
        >
          {pending ? "..." : "邀請同坐"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="btn-ghost"
          style={{ padding: "0.55rem 1rem", fontSize: "0.75rem", letterSpacing: "0.1em" }}
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
