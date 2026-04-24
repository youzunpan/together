"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "gongxiu_welcome_dismissed";

export default function WelcomeCard() {
  const [show, setShow] = useState(false);
  useEffect(() => { if (!localStorage.getItem(STORAGE_KEY)) setShow(true); }, []);
  function dismiss() { localStorage.setItem(STORAGE_KEY, "1"); setShow(false); }
  if (!show) return null;

  return (
    <div className="mt-3 flex items-start justify-between gap-3"
      style={{ background: "#272725", border: "1px solid rgba(190,194,63,0.2)", borderLeft: "2px solid #BEC23F", padding: "0.875rem 1rem" }}>
      <p style={{ fontSize: "0.825rem", color: "rgba(237,236,234,0.5)", lineHeight: 1.7 }}>
        歡迎加入同在。這裡沒有讚、沒有留言、只有看見彼此在坐。
      </p>
      <button onClick={dismiss} style={{ color: "rgba(237,236,234,0.2)", flexShrink: 0, marginTop: 2 }}
        className="hover:opacity-60 transition-opacity" aria-label="關閉">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
