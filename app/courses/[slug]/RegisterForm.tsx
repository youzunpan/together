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

type Session = { id: string; label: string };

export default function RegisterForm({
  slug, title, initialName, initialEmail,
  seriesPrice, singleSessionPrice, paymentInfo, sessions,
}: {
  slug: string;
  title: string;
  initialName?: string;
  initialEmail?: string;
  seriesPrice?: string | null;
  singleSessionPrice?: string | null;
  paymentInfo?: string | null;
  sessions?: Session[];
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const allowSingle = !!singleSessionPrice && (sessions?.length ?? 0) > 0;
  const [regType, setRegType] = useState<"series" | "single">("series");
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());

  function toggleSession(id: string) {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("請先閱讀並同意服務條款與隱私政策");
      return;
    }
    if (regType === "single" && selectedSessions.size === 0) {
      setError("請至少選一堂");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("reg_type", regType);
    fd.set("sessions_csv", regType === "single" ? Array.from(selectedSessions).join(",") : "");
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
      {/* 報名類型：整期 vs 單堂（只有 admin 設了單堂價、又有 sessions 才出現） */}
      {allowSingle && (
        <Field label="報名方式">
          <div className="grid grid-cols-2 gap-2">
            <RegTypeOption
              active={regType === "series"}
              title="整期"
              hint={seriesPrice ?? "全期完整參加"}
              onClick={() => setRegType("series")}
            />
            <RegTypeOption
              active={regType === "single"}
              title="單堂"
              hint={singleSessionPrice ?? ""}
              onClick={() => setRegType("single")}
            />
          </div>
        </Field>
      )}

      {/* 匯款資訊（整期 / 單堂共用，獨立區塊） */}
      {paymentInfo && (
        <div
          style={{
            background: "rgba(190,194,63,0.05)",
            border: "1px solid rgba(190,194,63,0.2)",
            borderRadius: 4,
            padding: "0.75rem 0.9rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.55rem",
              letterSpacing: "0.15em",
              color: "rgba(190,194,63,0.7)",
              marginBottom: "0.45rem",
            }}
          >
            匯款資訊
          </p>
          <p
            style={{
              fontSize: "0.82rem",
              color: "rgba(237,236,234,0.75)",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {paymentInfo}
          </p>
        </div>
      )}

      {/* 單堂模式：顯示課表複選 */}
      {regType === "single" && sessions && sessions.length > 0 && (
        <Field label={`選擇要報的堂次（共 ${selectedSessions.size} 堂）`}>
          <div
            className="space-y-1.5"
            style={{
              background: "#1a1b18",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 4,
              padding: "0.6rem 0.85rem",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            {sessions.map((s, i) => {
              const checked = selectedSessions.has(s.id);
              return (
                <label
                  key={s.id}
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                  style={{ padding: "0.35rem 0" }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSession(s.id)}
                    style={{ width: 16, height: 16, accentColor: "#BEC23F", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: "0.65rem",
                      color: "rgba(237,236,234,0.35)",
                      letterSpacing: "0.08em",
                      width: "1.5rem",
                      flexShrink: 0,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: "0.82rem", color: checked ? "#edecea" : "rgba(237,236,234,0.65)", flex: 1 }}>
                    {s.label}
                  </span>
                </label>
              );
            })}
          </div>
        </Field>
      )}

      <Field label="名字">
        <input
          name="name"
          type="text"
          required
          maxLength={60}
          autoComplete="name"
          defaultValue={initialName ?? ""}
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
          defaultValue={initialEmail ?? ""}
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="匯款金額（選填）">
          <input
            name="transfer_amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000000}
            placeholder="3000"
            style={{ ...inputStyle, fontFamily: "var(--font-space-mono)" }}
            onFocus={(e) => (e.target.style.borderColor = "#BEC23F")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </Field>
        <Field label="末四碼（選填）">
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
      </div>
      <p style={{ fontSize: "0.7rem", color: "rgba(237,236,234,0.35)", lineHeight: 1.5, marginTop: "-0.5rem" }}>
        已匯款請填，協助對帳；尚未匯款可留空
      </p>

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

function RegTypeOption({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(190,194,63,0.12)" : "#2c2c2a",
        border: active ? "1px solid #BEC23F" : "1px solid rgba(255,255,255,0.08)",
        color: active ? "#BEC23F" : "rgba(237,236,234,0.55)",
        padding: "0.7rem 0.85rem",
        textAlign: "left",
        cursor: "pointer",
        borderRadius: 4,
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: "0.95rem", marginBottom: hint ? "0.2rem" : 0 }}>{title}</div>
      {hint && (
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.05em", opacity: 0.75 }}>
          {hint}
        </div>
      )}
    </button>
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
