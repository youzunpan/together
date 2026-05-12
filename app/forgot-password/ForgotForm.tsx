"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.75rem 1rem", fontSize: "16px", color: "#edecea",
  outline: "none", fontFamily: "var(--font-space-mono)",
  borderRadius: 4,
};

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();
    // 直接導到 /reset-password（純路徑，避開 Supabase 萬用字元無法 match query string 的限制）
    // /reset-password 頁面的 supabase-js 會自動把 URL 上的 code 交換成 session（detectSessionInUrl: true）
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <p style={{ fontSize: "1rem", color: "#edecea" }}>重設密碼信已寄出。</p>
        <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.5)", lineHeight: 1.7 }}>
          請去信箱查收，<br />點信中的連結回來設定新密碼。
        </p>
        <div style={{
          background: "rgba(190,194,63,0.05)",
          border: "1px solid rgba(190,194,63,0.15)",
          borderRadius: 4,
          padding: "0.85rem 1rem",
          marginTop: "1rem",
          textAlign: "left",
        }}>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(190,194,63,0.8)", marginBottom: "0.5rem" }}>
            收不到？
          </p>
          <ul style={{ fontSize: "0.75rem", color: "rgba(237,236,234,0.55)", lineHeight: 1.7, paddingLeft: "1rem", listStyle: "disc" }}>
            <li>看看 <b>垃圾信</b>（spam）資料夾</li>
            <li>請在 <b>同一裝置 / 同一個瀏覽器</b> 點信中連結</li>
            <li>連結只能用一次，10 分鐘內點開最保險</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.5)", lineHeight: 1.6, marginBottom: "0.5rem" }}>
        填申請時用的 email，我們會寄一封重設密碼的信給你。
      </p>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com" required autoComplete="email"
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = "#BEC23F"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />

      {error && <p style={{ fontSize: "0.75rem", color: "#D65C6A" }}>{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full"
        style={{ width: "100%", letterSpacing: "0.12em" }}>
        {loading ? "寄送中..." : "寄重設密碼信"}
      </button>
    </form>
  );
}
