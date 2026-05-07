// /courses — 公開課程列表
// 顯示 status='published' 的課程，按開課時間升冪。
// 過去超過 7 天的課程不顯示（即使 admin 忘了關，也不會看到舊的）。

import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { APP_TZ } from "@/lib/tz";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  format: "online" | "offline";
  duration_type: "single" | "series";
  start_at: string;
  end_at: string | null;
  schedule_note: string | null;
  capacity: number;
  registered_count: number;
  seats_left: number;
};

function formatMonthYear(iso: string): string {
  return new Date(iso)
    .toLocaleString("en-US", { timeZone: APP_TZ, month: "short", year: "numeric" })
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: APP_TZ,
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatDateRange(course: CourseRow): string {
  if (course.duration_type === "series" && course.end_at) {
    const a = new Date(course.start_at).toLocaleString("zh-TW", { timeZone: APP_TZ, month: "numeric", day: "numeric" });
    const b = new Date(course.end_at).toLocaleString("zh-TW", { timeZone: APP_TZ, month: "numeric", day: "numeric" });
    return `${a} – ${b}`;
  }
  return formatDate(course.start_at);
}

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: courses } = await supabase
    .from("courses_with_count")
    .select("id, slug, title, subtitle, format, duration_type, start_at, end_at, schedule_note, capacity, registered_count, seats_left")
    .eq("status", "published")
    .gte("start_at", sevenDaysAgo)
    .order("start_at", { ascending: true })
    .returns<CourseRow[]>();

  const list = courses ?? [];

  return (
    <div>
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.4)", marginBottom: "1rem", textAlign: "center" }}>
        正在開放報名的課程
      </p>

      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <p style={{ fontSize: "0.95rem", color: "rgba(237,236,234,0.4)", lineHeight: 1.7 }}>
            目前沒有開放報名的課程。
            <br />
            新課程會在這裡公告。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((c) => {
            const full = c.seats_left <= 0;
            return (
              <Link
                key={c.id}
                href={`/courses/${c.slug}`}
                style={{
                  display: "block",
                  background: "#2c2c2a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 6,
                  padding: "1.25rem 1.25rem",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
                className="hover:border-[#BEC23F]/30"
              >
                <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.35)", marginBottom: "0.5rem" }}>
                  {formatMonthYear(c.start_at)}
                </p>

                <h2 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.35rem", color: "#edecea", lineHeight: 1.3, marginBottom: c.subtitle ? "0.25rem" : "0.75rem" }}>
                  {c.title}
                </h2>
                {c.subtitle && (
                  <p style={{ fontSize: "0.85rem", color: "rgba(237,236,234,0.55)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                    {c.subtitle}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap" style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.08em", color: "rgba(237,236,234,0.5)" }}>
                  <span style={{ padding: "0.2rem 0.5rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                    {c.format === "online" ? "線上" : "實體"}
                  </span>
                  <span style={{ padding: "0.2rem 0.5rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                    {c.duration_type === "series" ? "長期班" : "單次"}
                  </span>
                  <span>·</span>
                  <span>{formatDateRange(c)}</span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.08em", color: full ? "#D65C6A" : "#BEC23F" }}>
                    {full ? "已額滿" : `餘 ${c.seats_left} / ${c.capacity} 名額`}
                  </span>
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "rgba(237,236,234,0.4)" }}>
                    了解 →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
