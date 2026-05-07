"use client";

// 新增/編輯課程的 dialog 表單。所有欄位都在同一個畫面，必要時 scroll。

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createCourse, updateCourse } from "@/lib/actions/courses";
import { taipeiDatetimeLocal } from "@/lib/tz";

export type CourseFormCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  format: "online" | "offline";
  duration_type: "single" | "series";
  start_at: string;
  end_at: string | null;
  schedule_note: string | null;
  location: string | null;
  price_note: string | null;
  capacity: number;
  cover_image_url: string | null;
  status: "draft" | "published" | "closed";
};

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
  marginBottom: "0.35rem",
};

const helperStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  color: "rgba(237,236,234,0.35)",
  marginTop: "0.25rem",
  lineHeight: 1.5,
};

export default function CourseFormDialog({
  open,
  onOpenChange,
  course,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseFormCourse | null; // null = 新增
}) {
  const isEdit = course !== null;
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [format, setFormat] = useState<"online" | "offline">(course?.format ?? "offline");
  const [durationType, setDurationType] = useState<"single" | "series">(course?.duration_type ?? "single");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = isEdit && course
        ? await updateCourse(course.id, fd)
        : await createCourse(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      onOpenChange(false);
    });
  }

  // 開啟時 dialog 內容會 remount，state 預設值用 course 初始化即可

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
            fontSize: "1.1rem",
            color: "#edecea",
            fontWeight: 400,
            paddingRight: "2rem",
          }}
        >
          {isEdit ? "編輯課程" : "新增課程"}
        </DialogTitle>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label style={labelStyle}>標題 *</label>
            <input name="title" type="text" required maxLength={100} defaultValue={course?.title ?? ""} placeholder="例：五月冥想初階班" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>副標</label>
            <input name="subtitle" type="text" maxLength={100} defaultValue={course?.subtitle ?? ""} placeholder="例：八週的入門練習" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>課程介紹</label>
            <textarea
              name="description"
              rows={5}
              maxLength={2000}
              defaultValue={course?.description ?? ""}
              placeholder="這堂課要做什麼、適合誰、需要準備什麼……（保留換行）"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>類型 *</label>
              <SegRadio
                name="format"
                value={format}
                onChange={(v) => setFormat(v as "online" | "offline")}
                options={[
                  { value: "offline", label: "實體" },
                  { value: "online", label: "線上" },
                ]}
              />
            </div>
            <div>
              <label style={labelStyle}>時長 *</label>
              <SegRadio
                name="duration_type"
                value={durationType}
                onChange={(v) => setDurationType(v as "single" | "series")}
                options={[
                  { value: "single", label: "單次" },
                  { value: "series", label: "長期" },
                ]}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>開課時間 *</label>
            <input
              name="start_at"
              type="datetime-local"
              required
              defaultValue={course ? taipeiDatetimeLocal(new Date(course.start_at)) : taipeiDatetimeLocal()}
              style={inputStyle}
            />
            <p style={helperStyle}>台灣時間（UTC+8）</p>
          </div>

          {durationType === "series" && (
            <div>
              <label style={labelStyle}>結束時間（長期班）</label>
              <input
                name="end_at"
                type="datetime-local"
                defaultValue={course?.end_at ? taipeiDatetimeLocal(new Date(course.end_at)) : ""}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>上課時間備註</label>
            <input
              name="schedule_note"
              type="text"
              maxLength={120}
              defaultValue={course?.schedule_note ?? ""}
              placeholder="例：每週三 19:30–21:00，共 8 週"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{format === "online" ? "線上資訊" : "地點"}</label>
            <input
              name="location"
              type="text"
              maxLength={200}
              defaultValue={course?.location ?? ""}
              placeholder={format === "online" ? "例：開課前一週寄送 Zoom 連結" : "例：台北市大安區……"}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>費用 + 轉帳資訊</label>
            <textarea
              name="price_note"
              rows={3}
              maxLength={500}
              defaultValue={course?.price_note ?? ""}
              placeholder={"例：3000 元 / 8 堂\n台新銀行 (812) 帳號 1234-5678-9000，戶名 樽"}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>名額 *</label>
              <input
                name="capacity"
                type="number"
                required
                min={1}
                max={500}
                defaultValue={course?.capacity ?? 12}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>狀態 *</label>
              <select
                name="status"
                defaultValue={course?.status ?? "draft"}
                style={{ ...inputStyle, paddingRight: "2rem" }}
              >
                <option value="draft">草稿</option>
                <option value="published">公開</option>
                <option value="closed">已截止</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>封面圖網址（可選）</label>
            <input
              name="cover_image_url"
              type="url"
              maxLength={500}
              defaultValue={course?.cover_image_url ?? ""}
              placeholder="https://……"
              style={{ ...inputStyle, fontFamily: "var(--font-space-mono)", fontSize: "13px" }}
            />
          </div>

          <div>
            <label style={labelStyle}>網址 slug（可選，留空自動生成）</label>
            <input
              name="slug"
              type="text"
              maxLength={80}
              defaultValue={course?.slug ?? ""}
              placeholder="例：may-basic-2026"
              style={{ ...inputStyle, fontFamily: "var(--font-space-mono)", fontSize: "13px" }}
            />
            <p style={helperStyle}>用於課程網址 /courses/[slug]，沒填會自動產生</p>
          </div>

          {error && (
            <p style={{ fontSize: "0.8rem", color: "#D65C6A" }}>{error}</p>
          )}

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
              disabled={pending}
              className="btn-primary"
              style={{ flex: 2, letterSpacing: "0.12em", padding: "0.65rem", opacity: pending ? 0.5 : 1 }}
            >
              {pending ? "..." : isEdit ? "儲存變更" : "建立課程"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SegRadio({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-1" style={{ background: "#2c2c2a", padding: "2px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)" }}>
      <input type="hidden" name={name} value={value} />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          style={{
            flex: 1,
            padding: "0.5rem",
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            border: "none",
            cursor: "pointer",
            borderRadius: 3,
            background: value === o.value ? "#BEC23F" : "transparent",
            color: value === o.value ? "#1a1b18" : "rgba(237,236,234,0.5)",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
