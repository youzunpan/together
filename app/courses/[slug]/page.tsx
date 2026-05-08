// /courses/[slug] — 課程詳情 + 報名表單
// status='draft' 視為不存在（404）；'published' 顯示表單；'closed' 顯示已截止訊息。

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { APP_TZ } from "@/lib/tz";
import RegisterForm from "./RegisterForm";

type CourseDetail = {
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
  registered_count: number;
  seats_left: number;
};

type CourseSession = {
  id: string;
  session_at: string;
  note: string | null;
};

function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: APP_TZ,
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const fieldLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: "0.6rem",
  letterSpacing: "0.15em",
  color: "rgba(237,236,234,0.4)",
  textTransform: "uppercase",
  marginBottom: "0.35rem",
};

const fieldValueStyle: React.CSSProperties = {
  fontSize: "0.95rem",
  color: "#edecea",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
};

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses_with_count")
    .select("*")
    .eq("slug", slug)
    .in("status", ["published", "closed"])
    .single<CourseDetail>();

  if (!course) notFound();

  const { data: sessionsData } = await supabase
    .from("course_sessions")
    .select("id, session_at, note")
    .eq("course_id", course.id)
    .order("session_at", { ascending: true })
    .returns<CourseSession[]>();
  const sessions = sessionsData ?? [];

  const isFull = course.seats_left <= 0;
  const isClosed = course.status === "closed";
  const canRegister = !isClosed && !isFull;

  return (
    <article>
      {/* 麵包屑 */}
      <p style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/courses"
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            color: "rgba(237,236,234,0.4)",
            textDecoration: "none",
          }}
        >
          ← 所有課程
        </Link>
      </p>

      {/* 標題 */}
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.4)", marginBottom: "0.5rem" }}>
          <span>{course.format === "online" ? "線上課" : "實體課"}</span>
          <span style={{ margin: "0 0.5rem", color: "rgba(237,236,234,0.2)" }}>·</span>
          <span>{course.duration_type === "series" ? "長期班" : "單次"}</span>
        </p>
        <h1 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "2rem", color: "#edecea", lineHeight: 1.3, marginBottom: course.subtitle ? "0.4rem" : 0 }}>
          {course.title}
        </h1>
        {course.subtitle && (
          <p style={{ fontSize: "1rem", color: "rgba(237,236,234,0.6)", lineHeight: 1.6 }}>
            {course.subtitle}
          </p>
        )}
      </header>

      {/* 封面圖 */}
      {course.cover_image_url && (
        <div style={{ marginBottom: "2rem", borderRadius: 6, overflow: "hidden", background: "#2c2c2a" }}>
          {/* 直接用 img；Next 16 預設不需 next/image，且封面用 admin 自填的外部 URL */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={course.cover_image_url} alt={course.title} style={{ width: "100%", display: "block" }} />
        </div>
      )}

      {/* 介紹 */}
      {course.description && (
        <section style={{ marginBottom: "2rem" }}>
          <p style={fieldLabelStyle}>課程介紹</p>
          <p style={fieldValueStyle}>{course.description}</p>
        </section>
      )}

      {/* 課程資訊 */}
      <section style={{ marginBottom: "2.5rem", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "1.5rem" }}>
        <div className="space-y-4">
          {/* 上課日期 */}
          <div>
            <p style={fieldLabelStyle}>
              {course.duration_type === "series" ? `上課日期 · 共 ${sessions.length} 堂` : "上課時間"}
            </p>
            {sessions.length === 0 ? (
              <p style={fieldValueStyle}>{formatFullDateTime(course.start_at)}</p>
            ) : course.duration_type === "single" ? (
              <p style={fieldValueStyle}>{formatFullDateTime(sessions[0].session_at)}</p>
            ) : (
              <ol style={{ ...fieldValueStyle, paddingLeft: 0, listStyle: "none", margin: 0 }}>
                {sessions.map((s, i) => (
                  <li
                    key={s.id}
                    style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", padding: "0.25rem 0" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: "0.65rem",
                        color: "rgba(237,236,234,0.4)",
                        letterSpacing: "0.08em",
                        minWidth: "1.5rem",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{formatFullDateTime(s.session_at)}</span>
                    {s.note && (
                      <span style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.55)" }}>
                        · {s.note}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {course.schedule_note && <Field label="備註" value={course.schedule_note} />}
          {course.location && (
            <Field
              label={course.format === "online" ? "線上資訊" : "地點"}
              value={course.location}
            />
          )}
          {course.price_note && <Field label="費用" value={course.price_note} />}
          <Field
            label="名額"
            value={
              isFull
                ? `已額滿（${course.capacity} 人）`
                : `餘 ${course.seats_left} / ${course.capacity} 名額`
            }
            valueColor={isFull ? "#D65C6A" : "#BEC23F"}
          />
        </div>
      </section>

      {/* 報名 */}
      <section>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.4)", textAlign: "center", marginBottom: "1.5rem" }}>
          ── 報名 ──
        </p>

        {!canRegister ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6 }}>
            <p style={{ fontSize: "1rem", color: "#D65C6A", marginBottom: "0.5rem" }}>
              {isClosed ? "此課程已截止報名" : "此課程已額滿"}
            </p>
            <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.4)", lineHeight: 1.6 }}>
              下次有新課程開放會在
              <Link href="/courses" style={{ color: "#BEC23F", textDecoration: "underline", textUnderlineOffset: 3, marginLeft: 4, marginRight: 4 }}>
                課程列表
              </Link>
              公告。
            </p>
          </div>
        ) : (
          <RegisterForm slug={course.slug} title={course.title} />
        )}
      </section>
    </article>
  );
}

function Field({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div>
      <p style={fieldLabelStyle}>{label}</p>
      <p style={{ ...fieldValueStyle, color: valueColor ?? "#edecea" }}>{value}</p>
    </div>
  );
}
