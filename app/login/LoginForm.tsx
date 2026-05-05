"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const URL_ERROR_MESSAGES: Record<string, string> = {
  unapproved: "你的申請還沒通過審核，或尚未申請加入。",
  auth: "登入連結無效或已過期。",
  "no-email": "登入資料異常。",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.08)",
  // fontSize 必須 ≥ 16px，否則 iOS Safari 點進去會自動放大畫面
  padding: "0.75rem 1rem", fontSize: "16px", color: "#edecea",
  outline: "none", fontFamily: "var(--font-space-mono)",
  borderRadius: 4,
};

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError && URL_ERROR_MESSAGES[urlError]) setError(URL_ERROR_MESSAGES[urlError]);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLinkSent(false); setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      if (err.message.toLowerCase().includes("invalid")) setError("email 或密碼不正確。");
      else setError(err.message);
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  async function handleEmailLink() {
    setError(""); setLinkSent(false);
    if (!email) { setError("請先填 email"); return; }
    setLinkLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 不允許用 magic link 自助開帳號（必須先通過審核）
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/feed`,
      },
    });
    setLinkLoading(false);
    if (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes("signup") || msg.includes("not allowed") || msg.includes("not found")) {
        setError("這個 email 還沒通過審核，或不存在。");
      } else {
        setError(err.message);
      }
      return;
    }
    setLinkSent(true);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="space-y-3">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com" required autoComplete="email"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#BEC23F"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />

        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="密碼" required autoComplete="current-password"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#BEC23F"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />

        {error && <p style={{ fontSize: "0.75rem", color: "#D65C6A" }}>{error}</p>}
        {linkSent && (
          <p style={{ fontSize: "0.75rem", color: "#BEC23F" }}>
            登入連結已寄出，請去信箱查收。
          </p>
        )}

        <button type="submit" disabled={loading || linkLoading} className="btn-primary w-full"
          style={{ width: "100%", letterSpacing: "0.12em" }}>
          {loading ? "..." : "登入"}
        </button>
      </form>

      {/* 用 email 寄登入連結（也用於忘記密碼） */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", textAlign: "center" }}>
        <button type="button" onClick={handleEmailLink} disabled={loading || linkLoading || linkSent}
          style={{
            background: "transparent", border: "none", padding: 0,
            fontFamily: "var(--font-space-mono)", fontSize: "0.7rem",
            letterSpacing: "0.1em", color: linkSent ? "rgba(190,194,63,0.6)" : "rgba(237,236,234,0.5)",
            cursor: (loading || linkLoading || linkSent) ? "default" : "pointer",
            textDecoration: "underline", textUnderlineOffset: "3px",
          }}>
          {linkLoading ? "寄送中..." : linkSent ? "已寄出" : "忘記密碼？用 email 寄登入連結"}
        </button>
      </div>
    </div>
  );
}
