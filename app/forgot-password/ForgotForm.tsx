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
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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
      <div className="text-center space-y-2">
        <p style={{ fontSize: "1rem", color: "#edecea" }}>重設密碼信已寄出。</p>
        <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.4)", lineHeight: 1.6 }}>
          請去信箱查收，<br />點信中的連結回來設定新密碼。
        </p>
        <p style={{ fontSize: "0.7rem", color: "rgba(237,236,234,0.3)", marginTop: "1rem" }}>
          沒收到？等個一兩分鐘再去找。
        </p>
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
