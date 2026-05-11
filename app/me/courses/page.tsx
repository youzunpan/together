// /me/courses — 學生個人課程頁
// 上半：「你的課程」— 學生已報名的（含已過去 / 進行中 / 未來的）
// 下半：「開放報名中」— 學生還沒報名的、status='published' 的課程

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
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
  status: "draft" | "published" | "closed";
};

type MyRegistrationRow = {
  status: string;
  created_at: string;
  course: CourseRow | null;
};

function formatStart(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: APP_TZ,
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function statusLabel(s: string): { text: string; color: string } {
  if (s === "pending") return { text: "待處理", color: "rgba(237,236,234,0.5)" };
  if (s === "confirmed") return { text: "已確認", color: "#BEC23F" };
  return { text: s, color: "rgba(237,236,234,0.4)" };
}

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const emailLower = user.email?.toLowerCase() ?? "";

  // 用 service role 撈（已經 auth check 過了，撈自己的資料沒 RLS 問題比較穩）
  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // 你的課程：user_id 或 email match
  const { data: myRegsRaw } = await sb
    .from("registrations")
    .select(`
      status, created_at,
      course:courses(id, slug, title, subtitle, format, duration_type, start_at, end_at, schedule_note, capacity, status)
    `)
    .or(`user_id.eq.${user.id},email.eq.${emailLower}`)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .returns<MyRegistrationRow[]>();
  const myRegs = (myRegsRaw ?? []).filter((r) => r.course);
  const myCourseIds = new Set(myRegs.map((r) => r.course!.id));

  // 所有開放報名中的課程（不過濾，已報名的會在「你的課程」也出現一次，
  // 這裡保留資訊性，但會用 ✓ 標記已報名）
  const { data: openRaw } = await sb
    .from("courses")
    .select("id, slug, title, subtitle, format, duration_type, start_at, end_at, schedule_note, capacity, status")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<CourseRow[]>();
  const openCourses = openRaw ?? [];

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-8 flex items-center justify-between">
        <Link
          href="/me"
          style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.4)", width: "3rem" }}
        >
          ← BACK
        </Link>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.2)" }}>
          COURSES
        </p>
        <span style={{ width: "3rem" }} />
      </header>

      <h1 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.5rem", color: "#edecea", fontWeight: 400, marginBottom: "0.25rem" }}>
        課程
      </h1>
      <p style={{ fontSize: "0.78rem", color: "rgba(237,236,234,0.4)", lineHeight: 1.7, marginBottom: "2rem" }}>
        老師近期開課動態，跟你自己報名過的紀錄都在這裡。
      </p>

      {/* 你的課程 */}
      <section className="mb-8">
        <p style={sectionLabel}>你的課程 · YOUR REGISTRATIONS</p>
        {myRegs.length === 0 ? (
          <p style={emptyStyle}>還沒有報名紀錄。</p>
        ) : (
          <div className="space-y-2">
            {myRegs.map((r) => {
              const c = r.course!;
              const s = statusLabel(r.status);
              return (
                <Link
                  key={c.id}
                  href={`/courses/${c.slug}`}
                  style={cardStyle}
                  className="block hover:opacity-90 transition-opacity"
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <p style={{ fontSize: "1rem", color: "#edecea", lineHeight: 1.4, flex: 1, marginRight: "0.5rem" }}>
                      {c.title}
                    </p>
                    <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: s.color, flexShrink: 0 }}>
                      ✓ {s.text}
                    </span>
                  </div>
                  {c.subtitle && (
                    <p style={subtitleStyle}>{c.subtitle}</p>
                  )}
                  <p style={metaStyle}>
                    {formatStart(c.start_at)}
                    {c.schedule_note && c.duration_type === "series" ? ` · ${c.schedule_note}` : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 開放報名中 */}
      <section>
        <p style={sectionLabel}>開放報名中 · OPEN</p>
        {openCourses.length === 0 ? (
          <p style={emptyStyle}>目前沒有開放中的課程。</p>
        ) : (
          <div className="space-y-2">
            {openCourses.map((c) => {
              const isMine = myCourseIds.has(c.id);
              return (
                <Link
                  key={c.id}
                  href={`/courses/${c.slug}`}
                  style={cardStyle}
                  className="block hover:opacity-90 transition-opacity"
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <p style={{ fontSize: "1rem", color: "#edecea", lineHeight: 1.4, flex: 1, marginRight: "0.5rem" }}>
                      {c.title}
                    </p>
                    {isMine && (
                      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#BEC23F", flexShrink: 0 }}>
                        ✓ 已報名
                      </span>
                    )}
                  </div>
                  {c.subtitle && (
                    <p style={subtitleStyle}>{c.subtitle}</p>
                  )}
                  <p style={metaStyle}>
                    {formatStart(c.start_at)}
                    {c.schedule_note && c.duration_type === "series" ? ` · ${c.schedule_note}` : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: "0.6rem",
  letterSpacing: "0.18em",
  color: "rgba(237,236,234,0.3)",
  marginBottom: "0.75rem",
};

const cardStyle: React.CSSProperties = {
  background: "#2c2c2a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "var(--r-card)",
  padding: "1rem 1.1rem",
  textDecoration: "none",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "0.82rem",
  color: "rgba(237,236,234,0.55)",
  lineHeight: 1.55,
  marginBottom: "0.4rem",
};

const metaStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: "0.62rem",
  letterSpacing: "0.08em",
  color: "rgba(237,236,234,0.4)",
};

const emptyStyle: React.CSSProperties = {
  fontSize: "0.82rem",
  color: "rgba(237,236,234,0.3)",
  padding: "1rem 0",
  textAlign: "center",
};
