"use client";

import { useState, useTransition } from "react";
import { createCall } from "@/lib/actions/calls";
import { taipeiDateKey } from "@/lib/tz";
import MemberPicker from "./MemberPicker";

export default function CreateCallForm() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(taipeiDateKey()); // 預設今天
  const [time, setTime] = useState(""); // 時間留空，使用者自填
  const [duration, setDuration] = useState(""); // 時長自填
  const [message, setMessage] = useState("");
  const [showInvitePicker, setShowInvitePicker] = useState(false);
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date || !time) {
      setError("請選擇日期與時間");
      return;
    }
    const durNum = Number(duration);
    if (!durNum || durNum < 1 || durNum > 240) {
      setError("時長請填 1–240 分鐘");
      return;
    }

    const fd = new FormData();
    fd.set("scheduled_at", `${date}T${time}`); // server action 會用 +08:00 解析
    fd.set("duration_min", String(durNum));
    fd.set("message", message);
    fd.set("invitee_ids", JSON.stringify(inviteeIds));
    start(async () => {
      const res = await createCall(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        setMessage("");
        setDate(taipeiDateKey());
        setTime("");
        setDuration("");
        setInviteeIds([]);
        setShowInvitePicker(false);
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-space-mono)",
    fontSize: "0.55rem",
    letterSpacing: "0.15em",
    color: "rgba(237,236,234,0.35)",
    marginBottom: "0.3rem",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a1b18",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "0.6rem 0.75rem",
    fontSize: "0.85rem",
    color: "#edecea",
    outline: "none",
    borderRadius: 4,
    fontFamily: "var(--font-space-mono)",
  };

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

      {/* 日期 + 時間（拆開：日期預設今天、時間空白） */}
      <label style={labelStyle}>WHEN</label>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 6, marginBottom: "0.875rem" }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          placeholder="--:--"
          style={inputStyle}
        />
      </div>

      {/* 時長：自填 */}
      <label style={labelStyle}>DURATION · 分鐘</label>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={240}
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="例如 20"
        required
        style={{ ...inputStyle, marginBottom: "0.875rem" }}
      />

      {/* 一句話 */}
      <label style={labelStyle}>MESSAGE · 選填</label>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 80))}
        placeholder="想說的話（選填）"
        maxLength={80}
        style={{ ...inputStyle, fontFamily: "inherit", marginBottom: "0.875rem" }}
      />

      {/* 邀請對象（選填）：toggle 展開 picker。沒勾的話這場 call 一樣會在
          /feed 顯示，只是沒有特別通知任何人，大家自己 opt-in */}
      <div style={{ marginBottom: "0.875rem" }}>
        <button
          type="button"
          onClick={() => setShowInvitePicker((v) => !v)}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.12em",
            color: inviteeIds.length > 0 ? "#BEC23F" : "rgba(237,236,234,0.5)",
            cursor: "pointer",
          }}
        >
          {showInvitePicker ? "▾" : "▸"} 邀請特定人{inviteeIds.length > 0 ? `（${inviteeIds.length}）` : "（選填）"}
        </button>
        {showInvitePicker && (
          <div style={{ marginTop: "0.5rem" }}>
            <MemberPicker selected={inviteeIds} onChange={setInviteeIds} />
            <p style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.55rem",
              letterSpacing: "0.08em",
              color: "rgba(237,236,234,0.3)",
              marginTop: "0.4rem",
              lineHeight: 1.5,
            }}>
              被邀請的人會收到通知。沒勾的人在 /feed 一樣看得到、可以自己加入。
            </p>
          </div>
        )}
      </div>

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
