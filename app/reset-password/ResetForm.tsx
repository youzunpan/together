"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.75rem 1rem", fontSize: "16px", color: "#edecea",
  outline: "none", fontFamily: "var(--font-space-mono)",
  borderRadius: 4,
};

export default function ResetForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);

  // 必須是「點 email 連結 + /auth/callback 換好 session」才會有有效 user
  // 若沒有 session，就提示使用者重新發送
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw.length < 6) { setError("密碼至少 6 個字"); return; }
    if (pw !== pw2) { setError("兩次密碼不一致"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push("/feed");
    router.refresh();
  }

  if (authed === false) {
    return (
      <div className="text-center space-y-2">
        <p style={{ fontSize: "0.9rem", color: "#D65C6A" }}>連結已失效</p>
        <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.4)", lineHeight: 1.6 }}>
          請回 <a href="/forgot-password" style={{ color: "#BEC23F", textDecoration: "underline", textUnderlineOffset: "3px" }}>忘記密碼</a> 重新寄一次信。
        </p>
      </div>
    );
  }

  if (authed === null) {
    return (
      <p className="text-center" style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.4)" }}>
        ...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="password" value={pw} onChange={e => setPw(e.target.value)}
        placeholder="新密碼（至少 6 字）" required autoComplete="new-password"
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = "#BEC23F"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      <input type="password" value={pw2} onChange={e => setPw2(e.target.value)}
        placeholder="再次輸入" required autoComplete="new-password"
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = "#BEC23F"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />

      {error && <p style={{ fontSize: "0.75rem", color: "#D65C6A" }}>{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full"
        style={{ width: "100%", letterSpacing: "0.12em" }}>
        {loading ? "..." : "設定新密碼"}
      </button>
    </form>
  );
}
