"use client";

// sit 卡下方的回應區塊。
// - 預設摺疊，顯示「回應 N 則 ▼」
// - 展開後列出所有回應 + 輸入框（如果使用者還沒回應過）
// - 自己的回應有刪除按鈕

import { useEffect, useState, useTransition } from "react";
import { postReply, deleteReply, updateReply } from "@/lib/actions/replies";

export type ReplyRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  // 顯示用：作者頭像 + 名字（從 join 撈進來，丟給這個 component）
  display_name: string;
  avatar_letter: string;
  avatar_color: string;
};

const MAX_LEN = 40;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return "剛剛";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`;
  return d.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
}

export default function SitReplies({
  sitId,
  replies,
  currentUserId,
  lightBg = false,
}: {
  sitId: string;
  replies: ReplyRow[];
  currentUserId: string;
  lightBg?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [delPending, startDel] = useTransition();
  const [list, setList] = useState(replies);
  // 編輯中的 reply id；同時只能編輯一則
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editError, setEditError] = useState("");
  const [editPending, startEdit] = useTransition();

  // 從 /me 的「新回應」section 點過來時 URL 是 /feed#sit-<id>，自動展開
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === `#sit-${sitId}`) {
      setOpen(true);
    }
  }, [sitId]);

  // 只允許同時開一張卡的回應 — 自己一開就廣播；別人廣播就把自己關掉
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (open) {
      window.dispatchEvent(new CustomEvent("sit-reply-opened", { detail: { sitId } }));
    }
  }, [open, sitId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onOther(e: Event) {
      const detail = (e as CustomEvent<{ sitId: string }>).detail;
      if (detail && detail.sitId !== sitId) setOpen(false);
    }
    window.addEventListener("sit-reply-opened", onOther);
    return () => window.removeEventListener("sit-reply-opened", onOther);
  }, [sitId]);

  const myReply = list.find((r) => r.user_id === currentUserId);
  const count = list.length;

  function handlePost() {
    setError("");
    if (!text.trim()) return;
    start(async () => {
      const res = await postReply(sitId, text);
      if (res.error) {
        setError(res.error);
        return;
      }
      // optimistic：暫時用 placeholder，等 server 重 fetch 會覆蓋
      setList((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          user_id: currentUserId,
          body: text.trim(),
          created_at: new Date().toISOString(),
          display_name: "你",
          avatar_letter: "我",
          avatar_color: "purple",
        },
      ]);
      setText("");
    });
  }

  function handleDelete(replyId: string) {
    startDel(async () => {
      const res = await deleteReply(replyId);
      if (res.error) return;
      setList((prev) => prev.filter((r) => r.id !== replyId));
    });
  }

  function startEditReply(reply: ReplyRow) {
    setEditingId(reply.id);
    setEditDraft(reply.body);
    setEditError("");
  }

  function cancelEditReply() {
    setEditingId(null);
    setEditDraft("");
    setEditError("");
  }

  function saveEditReply(replyId: string) {
    setEditError("");
    if (!editDraft.trim()) {
      setEditError("請寫點什麼");
      return;
    }
    startEdit(async () => {
      const res = await updateReply(replyId, editDraft);
      if (res.error) {
        setEditError(res.error);
        return;
      }
      const newBody = editDraft.trim();
      setList((prev) => prev.map((r) => (r.id === replyId ? { ...r, body: newBody } : r)));
      setEditingId(null);
      setEditDraft("");
    });
  }

  const textColor = lightBg ? "rgba(26,27,24,0.55)" : "rgba(237,236,234,0.55)";
  const dimColor = lightBg ? "rgba(26,27,24,0.4)" : "rgba(237,236,234,0.4)";

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {/* 摺疊 toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "transparent",
          border: "none",
          padding: "0.25rem 0",
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          color: textColor,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span>
          {count === 0 ? "回應" : `${count} 則`}
          <span aria-hidden style={{ marginLeft: "0.3rem", opacity: 0.5 }}>
            {open ? "▲" : "▼"}
          </span>
        </span>
      </button>

      {open && (
        <div className="space-y-2" style={{ marginTop: "0.5rem", paddingLeft: "0.25rem" }}>
          {/* 既有回應 */}
          {list.map((r) => {
            const isMine = r.user_id === currentUserId;
            return (
              <div key={r.id} className="flex items-start gap-2">
                <div
                  className={`avatar-${r.avatar_color} flex-shrink-0 flex items-center justify-center font-medium`}
                  style={{ width: 22, height: 22, fontSize: "0.6rem" }}
                  aria-hidden
                >
                  {r.avatar_letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2" style={{ marginBottom: "0.1rem" }}>
                    <span style={{ fontSize: "0.72rem", color: textColor }}>{r.display_name}</span>
                    <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", letterSpacing: "0.06em", color: dimColor }}>
                      {formatTime(r.created_at)}
                    </span>
                    {isMine && !r.id.startsWith("temp-") && editingId !== r.id && (
                      <div className="flex items-center gap-2" style={{ marginLeft: "auto" }}>
                        <button
                          type="button"
                          onClick={() => startEditReply(r)}
                          disabled={delPending || editPending}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            fontFamily: "var(--font-space-mono)",
                            fontSize: "0.55rem",
                            letterSpacing: "0.06em",
                            color: dimColor,
                            cursor: "pointer",
                          }}
                        >
                          編
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          disabled={delPending || editPending}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            fontFamily: "var(--font-space-mono)",
                            fontSize: "0.55rem",
                            letterSpacing: "0.06em",
                            color: "rgba(214,92,106,0.45)",
                            cursor: "pointer",
                          }}
                        >
                          刪
                        </button>
                      </div>
                    )}
                  </div>
                  {editingId === r.id ? (
                    <div className="space-y-1.5" style={{ marginTop: "0.2rem" }}>
                      <input
                        type="text"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_LEN))}
                        maxLength={MAX_LEN}
                        disabled={editPending}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); saveEditReply(r.id); }
                          if (e.key === "Escape") { e.preventDefault(); cancelEditReply(); }
                        }}
                        style={{
                          width: "100%",
                          background: lightBg ? "rgba(0,0,0,0.04)" : "#1a1b18",
                          border: `1px solid ${lightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"}`,
                          padding: "0.4rem 0.6rem",
                          fontSize: "16px",
                          color: lightBg ? "#1a1b18" : "#edecea",
                          outline: "none",
                          borderRadius: 4,
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: dimColor }}>
                          {editDraft.length > 0 ? `${MAX_LEN - editDraft.length}` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={cancelEditReply}
                            disabled={editPending}
                            style={{
                              background: "transparent",
                              border: `1px solid ${lightBg ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)"}`,
                              color: dimColor,
                              padding: "0.25rem 0.7rem",
                              fontFamily: "var(--font-space-mono)",
                              fontSize: "0.55rem",
                              letterSpacing: "0.08em",
                              cursor: editPending ? "default" : "pointer",
                              borderRadius: 4,
                            }}
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditReply(r.id)}
                            disabled={editPending || !editDraft.trim()}
                            style={{
                              background: editDraft.trim() ? "#BEC23F" : "transparent",
                              border: editDraft.trim() ? "none" : `1px solid ${lightBg ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)"}`,
                              color: editDraft.trim() ? "#1a1b18" : dimColor,
                              padding: "0.25rem 0.9rem",
                              fontFamily: "var(--font-space-mono)",
                              fontSize: "0.55rem",
                              letterSpacing: "0.08em",
                              cursor: editDraft.trim() && !editPending ? "pointer" : "default",
                              borderRadius: 4,
                            }}
                          >
                            {editPending ? "..." : "儲存"}
                          </button>
                        </div>
                      </div>
                      {editError && (
                        <p style={{ fontSize: "0.6rem", color: "#D65C6A" }}>{editError}</p>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.82rem", color: lightBg ? "#1a1b18" : "#edecea", lineHeight: 1.5, wordBreak: "break-word" }}>
                      {r.body}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* 還沒回應 → 顯示輸入框（上下兩列，配合窄畫面） */}
          {!myReply && (
            <div style={{ marginTop: "0.5rem" }} className="space-y-1.5">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                placeholder="留言"
                maxLength={MAX_LEN}
                disabled={pending}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handlePost(); } }}
                style={{
                  width: "100%",
                  background: lightBg ? "rgba(0,0,0,0.04)" : "#1a1b18",
                  border: `1px solid ${lightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"}`,
                  padding: "0.45rem 0.7rem",
                  fontSize: "16px",
                  color: lightBg ? "#1a1b18" : "#edecea",
                  outline: "none",
                  borderRadius: 4,
                }}
              />
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: dimColor }}>
                  {text.length > 0 ? `${MAX_LEN - text.length}` : ""}
                </span>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={pending || !text.trim()}
                  style={{
                    background: text.trim() ? "#BEC23F" : "transparent",
                    border: text.trim() ? "none" : `1px solid ${lightBg ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)"}`,
                    color: text.trim() ? "#1a1b18" : dimColor,
                    padding: "0.4rem 1.25rem",
                    fontFamily: "var(--font-space-mono)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    cursor: text.trim() && !pending ? "pointer" : "default",
                    borderRadius: 4,
                  }}
                >
                  {pending ? "..." : "送出"}
                </button>
              </div>
              {error && (
                <p style={{ fontSize: "0.65rem", color: "#D65C6A" }}>{error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
