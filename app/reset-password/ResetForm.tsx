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

  // 信件連結會直接帶 ?code=... 進來，supabase-js 在 client 初始化時會自動
  // 把 code 交換成 session（detectSessionInUrl: true 預設值）。需要等
  // INITIAL_SESSION 事件才知道有沒有成功交換。
  useEffect(() => {
    const supabase = createClient();
    let resolved = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION 一定會在 client 啟動時觸發一次（不管有沒有 session）
      // PASSWORD_RECOVERY / SIGNED_IN 是密碼回復成功的事件
      if (event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        resolved = true;
        setAuthed(!!session?.user);
      }
    });

    // 保險：5 秒沒任何事件就視為失效（理論上不會走到這條）
    const timer = setTimeout(() => {
      if (!resolved) setAuthed(false);
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
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
