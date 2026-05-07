"use client";

// 公開報名表單：姓名、email、電話 + 同意條款。
// 送出後呼叫 server action submitRegistration → 寫 DB + 寄確認信。

import { useState } from "react";
import { submitRegistration } from "@/lib/actions/registrations";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#2c2c2a",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.75rem 1rem",
  fontSize: "16px", // 16px 防 iOS Safari 自動 zoom
  color: "#edecea",
  outline: "none",
  borderRadius: 4,
};

export default function RegisterForm({ slug, title }: { slug: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("請先閱讀並同意服務條款與隱私政策");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await submitRegistration(slug, fd);
    setLoading(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem 1.25rem",
          background: "rgba(190,194,63,0.08)",
          border: "1px solid rgba(190,194,63,0.3)",
          borderRadius: 6,
        }}
      >
        <p style={{ fontSize: "1rem", color: "#edecea", marginBottom: "0.75rem" }}>
          已收到你報名「{title}」。
        </p>
        <p style={{ fontSize: "0.85rem", color: "rgba(237,236,234,0.5)", lineHeight: 1.7 }}>
          確認信已寄到你填的 email。
          <br />
          樽會在開課前再與你聯繫繳費和上課細節。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="名字">
        <input
          name="name"
          type="text"
          required
          maxLength={60}
          autoComplete="name"
          placeholder="本名 / 筆名 / 暱稱皆可"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#BEC23F")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </Field>

      <Field label="EMAIL">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          style={{ ...inputStyle, fontFamily: "var(--font-space-mono)" }}
          onFocus={(e) => (e.target.style.borderColor = "#BEC23F")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </Field>

      <Field label="LINE ID（選填）">
        <input
          name="line_id"
          type="text"
          maxLength={60}
          placeholder="方便確認與聯繫"
          style={{ ...inputStyle, fontFamily: "var(--font-space-mono)" }}
          onFocus={(e) => (e.target.style.borderColor = "#BEC23F")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </Field>

      <Field label="匯款末四碼（選填）" hint="已匯款請填，協助對帳；尚未匯款可留空">
        <input
          name="transfer_last4"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          placeholder="0000"
          style={{ ...inputStyle, fontFamily: "var(--font-space-mono)", letterSpacing: "0.3em" }}
          onFocus={(e) => (e.target.style.borderColor = "#BEC23F")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </Field>

      <label
        className="flex items-start gap-2 cursor-pointer select-none"
        style={{ marginTop: "0.75rem", paddingTop: "0.5rem" }}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ marginTop: "0.2rem", width: 16, height: 16, accentColor: "#BEC23F", flexShrink: 0 }}
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

      {error && (
        <p style={{ fontSize: "0.8rem", color: "#D65C6A", marginTop: "0.5rem" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !agreed}
        className="btn-primary w-full"
        style={{
          width: "100%",
          letterSpacing: "0.12em",
          marginTop: "0.5rem",
          opacity: !agreed || loading ? 0.5 : 1,
        }}
      >
        {loading ? "SENDING..." : "送出報名"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.15em",
          color: "rgba(237,236,234,0.5)",
          marginBottom: "0.4rem",
        }}
      >
        {label}
      </p>
      {children}
      {hint && (
        <p
          style={{
            fontSize: "0.7rem",
            color: "rgba(237,236,234,0.35)",
            marginTop: "0.3rem",
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
