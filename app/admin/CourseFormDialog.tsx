"use client";

// 新增/編輯課程的 dialog 表單。所有欄位都在同一個畫面，必要時 scroll。
// 上課日期改為 sessions list（每堂課獨立資料）：
// - single：1 個 datetime 輸入
// - series：可一鍵產生「從 X 起、每 7 天一次、共 N 次」，再手動增刪
// 表單送出時把 sessions 序列化成 hidden input `sessions_json`。

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createCourse, updateCourse } from "@/lib/actions/courses";
import { taipeiDatetimeLocal, APP_TZ } from "@/lib/tz";

export type CourseFormSession = {
  session_at_local: string; // "YYYY-MM-DDTHH:mm" 台北牆上時間
  note: string | null;
};

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
  single_session_price: string | null;
  capacity: number;
  cover_image_url: string | null;
  status: "draft" | "published" | "closed";
  sessions: CourseFormSession[];
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

// 既有課程沒有 sessions 時的 fallback：用 start_at 種一筆
function seedSessionsFromCourse(course: CourseFormCourse | null): CourseFormSession[] {
  if (!course) return [];
  if (course.sessions.length > 0) return course.sessions;
  return [{ session_at_local: taipeiDatetimeLocal(new Date(course.start_at)), note: null }];
}

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
  const [sessions, setSessions] = useState<CourseFormSession[]>(seedSessionsFromCourse(course));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // 確保 single 只有 1 場、series 至少 1 場
    let toSave = sessions.filter((s) => s.session_at_local);
    if (durationType === "single" && toSave.length > 1) toSave = [toSave[0]];
    if (toSave.length === 0) {
      setError("請至少加 1 個上課日期");
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("sessions_json", JSON.stringify(toSave));

    start(async () => {
      const res = isEdit && course ? await updateCourse(course.id, fd) : await createCourse(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      onOpenChange(false);
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
                onChange={(v) => {
                  const next = v as "single" | "series";
                  setDurationType(next);
                  // single 切到 series：保留現有 1 場；series 切到 single：只留第 1 場
                  if (next === "single" && sessions.length > 1) {
                    setSessions([sessions[0]]);
                  }
                }}
                options={[
                  { value: "single", label: "單次" },
                  { value: "series", label: "長期" },
                ]}
              />
            </div>
          </div>

          {/* 上課日期 */}
          <div>
            <label style={labelStyle}>{durationType === "single" ? "上課時間 *" : "上課日期 *"}</label>
            {durationType === "single" ? (
              <SingleSession
                value={sessions[0]?.session_at_local ?? taipeiDatetimeLocal()}
                onChange={(v) => setSessions([{ session_at_local: v, note: null }])}
              />
            ) : (
              <SeriesSessions sessions={sessions} onChange={setSessions} />
            )}
            <p style={helperStyle}>台灣時間（UTC+8）</p>
          </div>

          <div>
            <label style={labelStyle}>備註（選填）</label>
            <input
              name="schedule_note"
              type="text"
              maxLength={120}
              defaultValue={course?.schedule_note ?? ""}
              placeholder="例：建議準時到，請帶毯子"
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
            <label style={labelStyle}>整期費用 + 轉帳資訊</label>
            <textarea
              name="price_note"
              rows={3}
              maxLength={500}
              defaultValue={course?.price_note ?? ""}
              placeholder={"例：3000 元 / 8 堂\n台新銀行 (812) 帳號 1234-5678-9000，戶名 樽"}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
            />
          </div>

          <div>
            <label style={labelStyle}>單堂費用（選填，留空不開放單堂報名）</label>
            <input
              name="single_session_price"
              type="text"
              maxLength={120}
              defaultValue={course?.single_session_price ?? ""}
              placeholder="例：500 元 / 堂"
              style={inputStyle}
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

// =========================================================
// Single class：單一 datetime 輸入
// =========================================================
function SingleSession({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}

// =========================================================
// Series：一鍵產生 + 手動增刪
// =========================================================
function SeriesSessions({
  sessions,
  onChange,
}: {
  sessions: CourseFormSession[];
  onChange: (s: CourseFormSession[]) => void;
}) {
  const [genStart, setGenStart] = useState<string>(taipeiDatetimeLocal());
  const [genCount, setGenCount] = useState<number>(8);
  // 多選星期幾。0=日、1=一、…、6=六。初始預設為 genStart 那天的星期幾，
  // 之後使用者可以自由 toggle 加減其他天。
  const [genDays, setGenDays] = useState<number[]>(() => {
    const d = new Date(`${taipeiDatetimeLocal()}:00+08:00`);
    return isNaN(d.getTime()) ? [1] : [d.getDay()];
  });

  function toggleDay(day: number) {
    setGenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  function generate() {
    if (!genStart || genCount < 1) return;
    const startDate = new Date(`${genStart}:00+08:00`);
    if (isNaN(startDate.getTime())) return;

    // 沒勾任何天 → 退化成「每週一次」（用 start 那天的星期幾）
    const days = genDays.length > 0 ? genDays : [startDate.getDay()];

    // 抓 start 那一週的「週日 00:00」(在台北時區) 當基準點，再從這裡推算每場
    const startWeekSunday = new Date(startDate);
    startWeekSunday.setDate(startDate.getDate() - startDate.getDay());
    startWeekSunday.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);

    const result: CourseFormSession[] = [];
    for (let w = 0; w < genCount; w++) {
      for (const day of days) {
        const session = new Date(startWeekSunday);
        session.setDate(startWeekSunday.getDate() + w * 7 + day);
        // 跳過 start 之前的場次（如果 start=週三、選了週一+三，第一週的週一會被跳掉）
        if (session.getTime() >= startDate.getTime()) {
          result.push({ session_at_local: taipeiDatetimeLocal(session), note: null });
        }
      }
    }
    onChange(result);
  }

  function addOne() {
    const last = sessions[sessions.length - 1];
    const baseTime = last
      ? new Date(`${last.session_at_local}:00+08:00`).getTime() + 7 * 86400000
      : Date.now();
    onChange([
      ...sessions,
      { session_at_local: taipeiDatetimeLocal(new Date(baseTime)), note: null },
    ]);
  }

  function removeAt(i: number) {
    onChange(sessions.filter((_, idx) => idx !== i));
  }

  function updateAt(i: number, patch: Partial<CourseFormSession>) {
    onChange(sessions.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function formatPreview(local: string): string {
    if (!local) return "";
    const d = new Date(`${local}:00+08:00`);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("zh-TW", {
      timeZone: APP_TZ,
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return (
    <div className="space-y-3">
      {/* 一鍵產生 */}
      <div
        style={{
          background: "rgba(190,194,63,0.06)",
          border: "1px dashed rgba(190,194,63,0.25)",
          borderRadius: 4,
          padding: "0.65rem 0.75rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            color: "rgba(237,236,234,0.55)",
            marginBottom: "0.5rem",
          }}
        >
          一鍵產生（從這時起、每週指定天、共 N 週）
        </p>
        <div className="flex flex-col gap-2">
          <input
            type="datetime-local"
            value={genStart}
            onChange={(e) => setGenStart(e.target.value)}
            style={{ ...inputStyle, padding: "0.5rem 0.7rem" }}
          />
          {/* 每週幾（多選） */}
          <div className="flex gap-1.5">
            {[
              { day: 1, label: "一" },
              { day: 2, label: "二" },
              { day: 3, label: "三" },
              { day: 4, label: "四" },
              { day: 5, label: "五" },
              { day: 6, label: "六" },
              { day: 0, label: "日" },
            ].map(({ day, label }) => {
              const active = genDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  style={{
                    flex: 1,
                    padding: "0.4rem 0",
                    background: active ? "rgba(190,194,63,0.2)" : "transparent",
                    border: `1px solid ${active ? "rgba(190,194,63,0.4)" : "rgba(255,255,255,0.1)"}`,
                    color: active ? "#BEC23F" : "rgba(237,236,234,0.45)",
                    fontFamily: "var(--font-noto-serif)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    borderRadius: 3,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 items-center">
            <span style={{ fontSize: "0.75rem", color: "rgba(237,236,234,0.5)" }}>共</span>
            <input
              type="number"
              min={1}
              max={52}
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
              style={{ ...inputStyle, width: "5rem", padding: "0.5rem 0.7rem", textAlign: "center" }}
            />
            <span style={{ fontSize: "0.75rem", color: "rgba(237,236,234,0.5)" }}>週</span>
            <button
              type="button"
              onClick={generate}
              style={{
                marginLeft: "auto",
                background: "rgba(190,194,63,0.15)",
                border: "1px solid rgba(190,194,63,0.4)",
                color: "#BEC23F",
                padding: "0.45rem 0.85rem",
                fontFamily: "var(--font-space-mono)",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                cursor: "pointer",
                borderRadius: 3,
              }}
            >
              產生
            </button>
          </div>
        </div>
        <p style={{ ...helperStyle, marginTop: "0.5rem" }}>
          按產生會覆蓋下面的清單。產生後可以個別調整，或刪掉某一場（例如那週停課）。
        </p>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "rgba(237,236,234,0.35)", textAlign: "center", padding: "1rem 0" }}>
          還沒有上課日期，按上面「產生」或下面「+ 加一個日期」
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <div
              key={i}
              style={{
                background: "#2c2c2a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 4,
                padding: "0.5rem 0.65rem",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: "0.6rem",
                    color: "rgba(237,236,234,0.4)",
                    letterSpacing: "0.08em",
                    minWidth: "1.6rem",
                    textAlign: "right",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  type="datetime-local"
                  value={s.session_at_local}
                  onChange={(e) => updateAt(i, { session_at_local: e.target.value })}
                  style={{ ...inputStyle, padding: "0.4rem 0.55rem", flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  title="移除這一場"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(214,92,106,0.3)",
                    color: "rgba(214,92,106,0.7)",
                    padding: "0.35rem 0.55rem",
                    cursor: "pointer",
                    borderRadius: 3,
                    fontSize: "0.85rem",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: "0.6rem",
                  color: "rgba(237,236,234,0.4)",
                  letterSpacing: "0.06em",
                  marginTop: "0.35rem",
                  paddingLeft: "2.6rem",
                }}
              >
                {formatPreview(s.session_at_local)}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addOne}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px dashed rgba(255,255,255,0.15)",
          color: "rgba(237,236,234,0.5)",
          padding: "0.55rem",
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          cursor: "pointer",
          borderRadius: 3,
        }}
      >
        + 加一個日期
      </button>
    </div>
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
