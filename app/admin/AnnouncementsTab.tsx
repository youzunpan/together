"use client";

import { useState, useTransition } from "react";
import { createAnnouncement, endAnnouncement } from "@/lib/actions/announcements";

type Announcement = {
  id: string;
  body: string;
  created_at: string;
  active: boolean;
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.75rem 1rem", fontSize: "16px", color: "#edecea", outline: "none",
  borderRadius: 4, lineHeight: 1.6, resize: "none",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });
}

export default function AnnouncementsTab({ items }: { items: Announcement[] }) {
  const [body, setBody] = useState("");
  const [posting, startPost] = useTransition();
  const [ending, startEnd] = useTransition();
  const [error, setError] = useState("");
  const [endingId, setEndingId] = useState<string | null>(null);

  const active = items.find((a) => a.active);
  const past = items.filter((a) => !a.active);

  function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!body.trim()) return;
    startPost(async () => {
      const fd = new FormData();
      fd.set("body", body);
      const res = await createAnnouncement(fd);
      if (res.error) setError(res.error);
      else setBody("");
    });
  }

  function handleEnd(id: string) {
    setEndingId(id);
    startEnd(async () => {
      await endAnnouncement(id);
      setEndingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* 發新公告 */}
      <form onSubmit={handlePost}>
        <label className="seq-label block mb-1.5">新公告</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={240}
          placeholder={active ? "（送出後會取代目前的公告）" : "例如：明天 8 點一起坐，歡迎加入。"}
          style={inputStyle}
        />
        <div className="flex items-center justify-between mt-2">
          <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.3)", letterSpacing: "0.08em" }}>
            {body.length} / 240
          </span>
          <button
            type="submit"
            disabled={posting || !body.trim()}
            className="btn-primary"
            style={{
              padding: "0.5rem 1.25rem", fontSize: "0.7rem", letterSpacing: "0.12em",
              opacity: (posting || !body.trim()) ? 0.5 : 1,
            }}
          >
            {posting ? "..." : "發布"}
          </button>
        </div>
        {error && <p style={{ fontSize: "0.75rem", color: "#D65C6A", marginTop: "0.5rem" }}>{error}</p>}
      </form>

      {/* 目前公告 */}
      <div>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.3)", marginBottom: "0.5rem" }}>
          目前公告 · ACTIVE
        </p>
        {active ? (
          <div style={{ background: "rgba(190,194,63,0.08)", border: "1px solid rgba(190,194,63,0.3)", borderRadius: 4, padding: "0.875rem 1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "#edecea", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: "0.5rem" }}>
              {active.body}
            </p>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", color: "rgba(237,236,234,0.35)" }}>
                {formatTime(active.created_at)}
              </span>
              <button
                type="button"
                onClick={() => handleEnd(active.id)}
                disabled={ending && endingId === active.id}
                style={{
                  background: "transparent", border: "1px solid rgba(214,92,106,0.3)",
                  color: "rgba(214,92,106,0.7)", padding: "0.3rem 0.75rem",
                  fontFamily: "var(--font-space-mono)", fontSize: "0.6rem",
                  letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4,
                }}
              >
                {ending && endingId === active.id ? "..." : "結束"}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "rgba(237,236,234,0.25)", padding: "1rem 0", textAlign: "center" }}>
            目前沒有公告
          </p>
        )}
      </div>

      {/* 歷史 */}
      {past.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.3)", marginBottom: "0.5rem" }}>
            歷史 · {past.length} 則
          </p>
          <div className="space-y-px" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
            {past.map((a) => (
              <div key={a.id} style={{ background: "#2c2c2a", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem 1rem" }}>
                <p style={{ fontSize: "0.85rem", color: "rgba(237,236,234,0.6)", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: "0.35rem" }}>
                  {a.body}
                </p>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: "rgba(237,236,234,0.25)", letterSpacing: "0.08em" }}>
                  {formatTime(a.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
