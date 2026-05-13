"use client";

import { useState } from "react";
import { submitApplication } from "@/lib/actions/applications";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#edecea", outline: "none",
  borderRadius: 4,
};

export default function ApplyForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!agreed) { setError("請先閱讀並同意服務條款與隱私政策"); return; }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await submitApplication(fd);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-2">
        <p style={{ fontSize: "1rem", color: "#edecea" }}>申請已送出。</p>
        <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.4)", lineHeight: 1.6 }}>
          通常 24 小時內審核完成，<br />通過後就可以用你填的 email 和密碼登入。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="seq-label block mb-1.5">EMAIL</label>
        <input name="email" type="email" required placeholder="your@email.com"
          style={{ ...inputStyle, fontFamily: "var(--font-space-mono)" }}
          onFocus={e => e.target.style.borderColor = "#BEC23F"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      </div>
      <div>
        <label className="seq-label block mb-1.5">顯示名稱</label>
        <input name="display_name" type="text" required maxLength={40} placeholder="大拙"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#BEC23F"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      </div>
      <div>
        <label className="seq-label block mb-1.5">密碼（至少 6 字）</label>
        <input name="password" type="password" required minLength={6} placeholder="登入用的密碼"
          autoComplete="new-password"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#BEC23F"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      </div>
      <div>
        <label className="seq-label block mb-1.5">你是誰介紹的 / 怎麼找到這裡</label>
        <textarea name="note" rows={3} maxLength={200} placeholder="簡短自介（可留空）"
          style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
          onFocus={e => e.target.style.borderColor = "#BEC23F"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      </div>
      {/* 雙向同意 */}
      <label
        className="flex items-start gap-2 cursor-pointer select-none"
        style={{ marginTop: "0.5rem", paddingTop: "0.5rem" }}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{
            marginTop: "0.2rem",
            width: 16, height: 16, accentColor: "#BEC23F",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "0.75rem", color: "rgba(237,236,234,0.55)", lineHeight: 1.6 }}>
          我已閱讀並同意
          <a href="/terms" target="_blank" rel="noreferrer" style={{ color: "#BEC23F", textDecoration: "underline", textUnderlineOffset: 3, marginLeft: 3, marginRight: 3 }}>
            服務條款
          </a>
          與
          <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: "#BEC23F", textDecoration: "underline", textUnderlineOffset: 3, marginLeft: 3 }}>
            隱私政策
          </a>
        </span>
      </label>

      {error && <p style={{ fontSize: "0.75rem", color: "#D65C6A" }}>{error}</p>}
      <button type="submit" disabled={loading || !agreed} className="btn-primary w-full"
        style={{
          width: "100%", letterSpacing: "0.12em",
          opacity: (!agreed || loading) ? 0.5 : 1,
        }}>
        {loading ? "SENDING..." : "送出申請"}
      </button>
    </form>
  );
}
