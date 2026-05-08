"use client";

// 對某課程報名者廣播信件的 dialog
// 用途：課程成立通知、課前提醒、課程取消、補充資訊等

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { sendCourseEmail } from "@/lib/actions/registrations";
import type { CourseRow } from "./CoursesTab";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#2c2c2a",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "0.6rem 0.85rem",
  fontSize: "16px",
  color: "#edecea",
  outline: "none",
  borderRadius: 4,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: "0.6rem",
  letterSpacing: "0.12em",
  color: "rgba(237,236,234,0.55)",
  display: "block",
  marginBottom: "0.4rem",
};

const helperStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  color: "rgba(237,236,234,0.4)",
  marginTop: "0.3rem",
  lineHeight: 1.5,
};

export default function CourseEmailDialog({
  open,
  onOpenChange,
  course,
  pendingCount,
  confirmedCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseRow;
  pendingCount: number;
  confirmedCount: number;
}) {
  const [subject, setSubject] = useState(`同在 · 關於「${course.title}」`);
  const [body, setBody] = useState("");
  const [includePending, setIncludePending] = useState(true);
  const [includeConfirmed, setIncludeConfirmed] = useState(true);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const recipientCount =
    (includePending ? pendingCount : 0) + (includeConfirmed ? confirmedCount : 0);

  function applyTemplate(kind: "confirmed" | "reminder" | "cancelled") {
    if (kind === "confirmed") {
      setSubject(`同在 · 「${course.title}」課程成立通知`);
      setBody(
        `{name}，

報名的「${course.title}」已經確認開課，謝謝你的支持。

詳細的上課時間與地點都在課程頁，如果有任何問題或需要調整，歡迎直接回信。

期待見到你。

— 樽`,
      );
    } else if (kind === "reminder") {
      setSubject(`同在 · 「${course.title}」課前提醒`);
      setBody(
        `{name}，

提醒一下「${course.title}」即將開始，請記得：

· 提早 5–10 分鐘到（或上線）
· 帶你需要的物品（毯子、水、舒適的衣著）
· 把通知關掉，給自己一段安靜的時間

期待見到你。

— 樽`,
      );
    } else if (kind === "cancelled") {
      setSubject(`同在 · 「${course.title}」課程調整通知`);
      setBody(
        `{name}，

很抱歉要通知你，「${course.title}」需要調整安排。

[請在這裡說明：取消、改期、或其他變動]

如果你已經完成繳費，我會盡快與你確認退費或保留至下一期的方式。

抱歉造成不便，有任何問題歡迎直接回信。

— 樽`,
      );
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("include_pending", includePending ? "1" : "0");
    fd.set("include_confirmed", includeConfirmed ? "1" : "0");
    start(async () => {
      const res = await sendCourseEmail(course.id, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setResult({ sent: res.sent ?? 0, failed: res.failed ?? 0 });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-lg !max-h-[90vh] overflow-y-auto"
        style={{
          background: "#1a1b18",
          color: "#edecea",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <DialogTitle
          style={{
            fontFamily: "var(--font-noto-serif)",
            fontSize: "1.05rem",
            color: "#edecea",
            fontWeight: 400,
            paddingRight: "2rem",
          }}
        >
          寄信給「{course.title}」報名者
        </DialogTitle>

        {result ? (
          <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
            <p style={{ fontSize: "1rem", color: "#BEC23F", marginBottom: "0.5rem" }}>
              已寄出 {result.sent} 封
              {result.failed > 0 ? `（失敗 ${result.failed} 封）` : ""}
            </p>
            {result.failed > 0 && (
              <p style={{ fontSize: "0.75rem", color: "rgba(237,236,234,0.5)", lineHeight: 1.6 }}>
                失敗詳情看 server console（npm run dev 那個視窗）
              </p>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn-primary"
              style={{ padding: "0.55rem 1.5rem", marginTop: "1rem", letterSpacing: "0.12em" }}
            >
              完成
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Quick templates */}
            <div>
              <p style={labelStyle}>快速模板（套用後可以再改）</p>
              <div className="flex flex-wrap gap-1.5">
                <TemplateButton onClick={() => applyTemplate("confirmed")}>
                  📋 課程成立通知
                </TemplateButton>
                <TemplateButton onClick={() => applyTemplate("reminder")}>
                  ⏰ 課前提醒
                </TemplateButton>
                <TemplateButton onClick={() => applyTemplate("cancelled")}>
                  🛑 課程調整
                </TemplateButton>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <p style={labelStyle}>收件對象</p>
              <div className="space-y-1.5">
                <Checkbox
                  checked={includePending}
                  onChange={setIncludePending}
                  label={`待處理 ${pendingCount} 人`}
                  disabled={pendingCount === 0}
                />
                <Checkbox
                  checked={includeConfirmed}
                  onChange={setIncludeConfirmed}
                  label={`已確認 ${confirmedCount} 人`}
                  disabled={confirmedCount === 0}
                />
              </div>
              <p style={helperStyle}>
                取消的報名者不會收到。
              </p>
            </div>

            <div>
              <label style={labelStyle}>主旨 *</label>
              <input
                name="subject"
                type="text"
                required
                maxLength={200}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>內容 *</label>
              <textarea
                name="body"
                required
                rows={12}
                maxLength={5000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={"大家好，\n\n…\n\n— 樽"}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, fontFamily: "inherit" }}
              />
              <p style={helperStyle}>
                可以用{" "}
                <code
                  style={{
                    background: "rgba(190,194,63,0.15)",
                    padding: "1px 5px",
                    borderRadius: 2,
                    color: "#BEC23F",
                    fontFamily: "var(--font-space-mono)",
                    fontSize: "0.7rem",
                  }}
                >
                  {"{name}"}
                </code>{" "}
                自動代入學員名字、{" "}
                <code
                  style={{
                    background: "rgba(190,194,63,0.15)",
                    padding: "1px 5px",
                    borderRadius: 2,
                    color: "#BEC23F",
                    fontFamily: "var(--font-space-mono)",
                    fontSize: "0.7rem",
                  }}
                >
                  {"{course_title}"}
                </code>{" "}
                代入課程名。換行會保留。
              </p>
            </div>

            {error && <p style={{ fontSize: "0.8rem", color: "#D65C6A" }}>{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={pending}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(237,236,234,0.6)",
                  padding: "0.65rem",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  borderRadius: 4,
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={pending || recipientCount === 0}
                className="btn-primary"
                style={{
                  flex: 2,
                  letterSpacing: "0.12em",
                  padding: "0.65rem",
                  opacity: pending || recipientCount === 0 ? 0.5 : 1,
                }}
              >
                {pending
                  ? "寄送中..."
                  : recipientCount === 0
                  ? "沒有收件人"
                  : `寄出 ${recipientCount} 封`}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TemplateButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "rgba(190,194,63,0.08)",
        border: "1px solid rgba(190,194,63,0.3)",
        color: "#BEC23F",
        padding: "0.4rem 0.7rem",
        fontSize: "0.75rem",
        cursor: "pointer",
        borderRadius: 3,
      }}
    >
      {children}
    </button>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: "#BEC23F" }}
      />
      <span style={{ fontSize: "0.85rem", color: "#edecea" }}>{label}</span>
    </label>
  );
}
