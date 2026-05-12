"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError && URL_ERROR_MESSAGES[urlError]) setError(URL_ERROR_MESSAGES[urlError]);
    // 預先快取 /feed：登入成功後跳過去會比較順
    router.prefetch("/feed");
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();

    // 15 秒 timeout：若 Supabase auth 卡住（網路抖動 / 服務短暫不通），
    // 不要讓使用者永久停在「登入中...」
    const authPromise = supabase.auth.signInWithPassword({ email, password });
    const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ error: { message: "timeout" } }), 15000),
    );

    const result = await Promise.race([authPromise, timeoutPromise]);
    const err = "error" in result ? result.error : null;

    if (err) {
      setLoading(false);
      const msg = err.message.toLowerCase();
      if (msg === "timeout") {
        setError("連線太慢，請檢查網路後再試一次。");
      } else if (msg.includes("invalid")) {
        setError("email 或密碼不正確。");
      } else {
        setError(err.message);
      }
      return;
    }
    // 成功：保持 loading 狀態到 /feed 載完，避免按鈕先變回「登入」造成卡住的錯覺
    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="space-y-3">
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

        <button type="submit" disabled={loading} className="btn-primary w-full login-btn"
          style={{
            width: "100%",
            letterSpacing: "0.12em",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "wait" : "pointer",
            touchAction: "manipulation", // 避開 iOS 雙擊縮放 300ms 延遲
          }}>
          {loading ? "登入中..." : "登入"}
        </button>
        <style>{`
          .login-btn:active:not(:disabled) {
            transform: scale(0.97);
            transition: transform 0.05s ease-out;
          }
        `}</style>
      </form>

      <div style={{ textAlign: "center", paddingTop: "0.5rem" }}>
        <Link href="/forgot-password"
          style={{
            fontFamily: "var(--font-space-mono)", fontSize: "0.7rem",
            letterSpacing: "0.1em", color: "rgba(237,236,234,0.4)",
            textDecoration: "underline", textUnderlineOffset: "3px",
          }}>
          忘記密碼？
        </Link>
      </div>
    </div>
  );
}
