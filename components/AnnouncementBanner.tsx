"use client";

// 學生看的公告 banner。同一則公告 ✕ 一次後 localStorage 記住該 id，下次不顯示；
// admin 發新公告（新 id）會重新出現。

import { useEffect, useState } from "react";

const KEY_PREFIX = "announcement-dismissed-";

export default function AnnouncementBanner({
  id,
  body,
}: {
  id: string;
  body: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(`${KEY_PREFIX}${id}`);
    if (!dismissed) setShow(true);
  }, [id]);

  function dismiss() {
    try { localStorage.setItem(`${KEY_PREFIX}${id}`, "1"); } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <section
      style={{
        background: "rgba(190,194,63,0.08)",
        border: "1px solid rgba(190,194,63,0.3)",
        borderRadius: "var(--r-card)",
        padding: "0.875rem 1rem",
        marginTop: "0.75rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#BEC23F",
          marginTop: "0.45rem",
          flexShrink: 0,
        }}
      />
      <p
        style={{
          flex: 1,
          fontSize: "0.875rem",
          color: "#edecea",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {body}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="關閉公告"
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          color: "rgba(237,236,234,0.4)",
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.7rem",
          cursor: "pointer",
          marginTop: "0.1rem",
        }}
      >
        ✕
      </button>
    </section>
  );
}
