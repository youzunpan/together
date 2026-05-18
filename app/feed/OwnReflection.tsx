"use client";

// 自己的 sit 卡，心得區塊：顯示文字 + 編/刪小按鈕；點編就 inline 編輯。
// 心得本來就空也 ok — 會顯示「＋ 加心得」。
// 「刪」= 把 reflection 設成 null，整筆 sit 紀錄保留（streak、總分鐘不動）。

import { useState, useTransition } from "react";
import { updateReflection } from "@/lib/actions/sits";

const MAX_LEN = 140;

export default function OwnReflection({
  sitId,
  initialReflection,
  isLeft,
  reflectionColor,
  dimColor,
  lightBg,
}: {
  sitId: string;
  initialReflection: string | null;
  isLeft: boolean;
  reflectionColor: string;
  dimColor: string;
  lightBg: boolean;
}) {
  const [reflection, setReflection] = useState<string | null>(initialReflection);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialReflection ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const align: "left" | "right" = isLeft ? "right" : "left";

  function startEdit() {
    setDraft(reflection ?? "");
    setError("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
  }

  function save() {
    setError("");
    start(async () => {
      const res = await updateReflection(sitId, draft);
      if (res.error) {
        setError(res.error);
        return;
      }
      setReflection(draft.trim() || null);
      setEditing(false);
    });
  }

  function clear() {
    setError("");
    start(async () => {
      const res = await updateReflection(sitId, null);
      if (res.error) {
        setError(res.error);
        return;
      }
      setReflection(null);
      setDraft("");
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="mt-2" style={{ textAlign: align }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
          maxLength={MAX_LEN}
          disabled={pending}
          rows={3}
          autoFocus
          placeholder="今天坐完，留一個字、一句話、一段感覺都可以。"
          className="reflection-text"
          style={{
            width: "100%",
            background: lightBg ? "rgba(0,0,0,0.04)" : "#1a1b18",
            border: `1px solid ${lightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"}`,
            padding: "0.45rem 0.6rem",
            fontSize: "16px", // 避免 iOS 自動 zoom
            color: lightBg ? "#1a1b18" : "#edecea",
            outline: "none",
            borderRadius: 4,
            resize: "vertical",
            textAlign: "left",
          }}
        />
        <div className="flex items-center justify-between" style={{ marginTop: "0.4rem" }}>
          <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: dimColor }}>
            {draft.length > 0 ? `${MAX_LEN - draft.length}` : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={pending}
              style={{
                background: "transparent",
                border: `1px solid ${lightBg ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)"}`,
                color: dimColor,
                padding: "0.3rem 0.9rem",
                fontFamily: "var(--font-space-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                cursor: pending ? "default" : "pointer",
                borderRadius: 4,
              }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              style={{
                background: "#BEC23F",
                border: "none",
                color: "#1a1b18",
                padding: "0.3rem 1.1rem",
                fontFamily: "var(--font-space-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                cursor: pending ? "default" : "pointer",
                borderRadius: 4,
              }}
            >
              {pending ? "..." : "儲存"}
            </button>
          </div>
        </div>
        {error && (
          <p style={{ fontSize: "0.65rem", color: "#D65C6A", textAlign: "left", marginTop: "0.3rem" }}>{error}</p>
        )}
      </div>
    );
  }

  // 非編輯模式
  if (reflection) {
    return (
      <div className="mt-2" style={{ textAlign: align }}>
        <p
          className="reflection-text"
          style={{
            fontSize: "0.82rem",
            color: reflectionColor,
            lineHeight: 1.55,
          }}
        >
          {reflection}
        </p>
        <div
          className="flex items-center gap-3"
          style={{ marginTop: "0.3rem", justifyContent: isLeft ? "flex-end" : "flex-start" }}
        >
          <button
            type="button"
            onClick={startEdit}
            disabled={pending}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.55rem",
              letterSpacing: "0.08em",
              color: dimColor,
              cursor: "pointer",
            }}
          >
            編
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={pending}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.55rem",
              letterSpacing: "0.08em",
              color: "rgba(214,92,106,0.45)",
              cursor: "pointer",
            }}
          >
            刪
          </button>
        </div>
      </div>
    );
  }

  // reflection 為空 → 給「＋ 加心得」
  return (
    <div className="mt-2" style={{ textAlign: align }}>
      <button
        type="button"
        onClick={startEdit}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.08em",
          color: dimColor,
          cursor: "pointer",
        }}
      >
        ＋ 加心得
      </button>
    </div>
  );
}
