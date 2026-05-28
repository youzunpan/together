import { createClient } from "@/lib/supabase-server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplicationsTab from "./ApplicationsTab";
import SitDeleteButton from "./SitDeleteButton";
import ErrorsTab, { type ErrorRow } from "./ErrorsTab";
import MembersTab from "./MembersTab";
import AnnouncementsTab from "./AnnouncementsTab";
import CoursesTab, { type CourseRow, type RegistrationRow } from "./CoursesTab";
import Link from "next/link";
import { redirect } from "next/navigation";
import { taipeiDatetimeLocal } from "@/lib/tz";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: applications } = await supabase
    .from("applications").select("*").order("created_at", { ascending: false });

  const { data: members } = await supabase
    .from("profiles").select("*").neq("role", "removed").order("created_at", { ascending: false });

  // 最近 7 天的 sits
  const since = new Date();
  since.setDate(since.getDate() - 6); // 今天 + 前 6 天 = 7 天
  since.setHours(0, 0, 0, 0);
  const { data: recentSits } = await supabase
    .from("sits_with_stats").select("*")
    .gte("sat_at", since.toISOString())
    .order("sat_at", { ascending: false });

  // 全部 sits（給管理員清理測試資料用）
  const { data: allSits } = await supabase
    .from("sits_with_stats").select("*")
    .order("sat_at", { ascending: false })
    .limit(500);

  // 錯誤紀錄（最多 200 筆，依 RLS 只有 admin 撈得到）
  const { data: errors } = await supabase
    .from("error_logs").select("*")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<ErrorRow[]>();

  // 公告（active + 最近歷史 50 則）
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, body, created_at, active")
    .order("created_at", { ascending: false })
    .limit(50);

  // 課程（admin 讀直接 query courses 表，可以看到 draft；報名數在 JS 算）
  const { data: rawCourses } = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, description, format, duration_type, start_at, end_at, schedule_note, location, price_note, single_session_price, payment_info, capacity, cover_image_url, status")
    .order("start_at", { ascending: false });
  const { data: rawRegistrations } = await supabase
    .from("registrations")
    .select("id, course_id, name, email, phone, line_id, transfer_last4, transfer_amount, notes, status, created_at, session_ids")
    .order("created_at", { ascending: false });
  const { data: rawSessions } = await supabase
    .from("course_sessions")
    .select("id, course_id, session_at, note")
    .order("session_at", { ascending: true });

  const registrationsList: RegistrationRow[] = rawRegistrations ?? [];
  const coursesList: CourseRow[] = (rawCourses ?? []).map((c) => {
    const active = registrationsList.filter(r => r.course_id === c.id && r.status !== "cancelled").length;
    const sessions = (rawSessions ?? [])
      .filter((s) => s.course_id === c.id)
      .map((s) => ({
        session_at_local: taipeiDatetimeLocal(new Date(s.session_at)),
        note: s.note,
      }));
    return {
      ...c,
      registered_count: active,
      seats_left: Math.max(c.capacity - active, 0),
      sessions,
    };
  });

  const pendingCount = applications?.filter(a => a.status === "pending").length ?? 0;
  const errorCount = errors?.length ?? 0;
  const totalRegistrations = registrationsList.length;

  // 按日聚合（Taipei 時區）
  type DailyStat = { date: string; label: string; memberCount: number; totalMin: number; sits: typeof recentSits };
  const daily: DailyStat[] = [];
  const dayMap = new Map<string, DailyStat>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const dateKey = `${key.getFullYear()}-${String(key.getMonth() + 1).padStart(2, "0")}-${String(key.getDate()).padStart(2, "0")}`;
    const label = i === 0 ? "今天" : i === 1 ? "昨天" : `${i} 天前`;
    const stat: DailyStat = { date: dateKey, label, memberCount: 0, totalMin: 0, sits: [] };
    daily.push(stat);
    dayMap.set(dateKey, stat);
  }
  for (const s of recentSits ?? []) {
    const d = new Date(new Date(s.sat_at).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const stat = dayMap.get(dateKey);
    if (stat) { stat.totalMin += s.duration_min; stat.sits!.push(s); }
  }
  for (const stat of daily) {
    stat.memberCount = new Set((stat.sits ?? []).map(s => s.user_id)).size;
  }

  // 本週榜（7 天）
  const leaderMap = new Map<string, { user_id: string; display_name: string; avatar_letter: string; avatar_color: string; avatar_url: string | null; minutes: number; days: Set<string> }>();
  for (const s of recentSits ?? []) {
    const existing = leaderMap.get(s.user_id);
    const d = new Date(new Date(s.sat_at).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (existing) {
      existing.minutes += s.duration_min;
      existing.days.add(dateKey);
    } else {
      leaderMap.set(s.user_id, {
        user_id: s.user_id, display_name: s.display_name,
        avatar_letter: s.avatar_letter, avatar_color: s.avatar_color, avatar_url: s.avatar_url ?? null,
        minutes: s.duration_min, days: new Set([dateKey]),
      });
    }
  }
  const leaderboard = [...leaderMap.values()].sort((a, b) => b.minutes - a.minutes);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-8">
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.2)", textAlign: "center" }}>
          ADMIN
        </p>
        <div className="flex items-center justify-between mt-1">
          <h1 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.5rem", color: "#edecea", fontWeight: 400 }}>管理後台</h1>
          <a
            href="/api/admin/export"
            download
            title="下載一份 JSON 備份到本機"
            style={{
              fontFamily: "var(--font-space-mono)", fontSize: "0.6rem",
              letterSpacing: "0.12em", color: "rgba(237,236,234,0.4)",
              padding: "0.35rem 0.7rem",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4,
              textDecoration: "none",
            }}
          >
            ⬇ BACKUP
          </a>
        </div>
      </header>

      <Tabs defaultValue="applications">
        {/* 手機版橫向 scroll；桌機照舊全寬 */}
        <TabsList className="w-full mb-6" style={{ background: "#2c2c2a", borderRadius: 4, padding: 0, gap: "1px", overflowX: "auto", overflowY: "hidden", flexWrap: "nowrap" }}>
          <TabsTrigger value="applications" className="flex-1 shrink-0" style={{ borderRadius: 0, fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", minWidth: "5.5rem", whiteSpace: "nowrap" }}>
            APPLY{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex-1 shrink-0" style={{ borderRadius: 0, fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", minWidth: "5.5rem", whiteSpace: "nowrap" }}>
            COURSES{totalRegistrations > 0 ? ` (${totalRegistrations})` : ""}
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 shrink-0" style={{ borderRadius: 0, fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", minWidth: "5.5rem", whiteSpace: "nowrap" }}>
            MEMBERS
          </TabsTrigger>
          <TabsTrigger value="sits" className="flex-1 shrink-0" style={{ borderRadius: 0, fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", minWidth: "5.5rem", whiteSpace: "nowrap" }}>
            SITS
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex-1 shrink-0" style={{ borderRadius: 0, fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", minWidth: "5.5rem", whiteSpace: "nowrap" }}>
            ERRORS{errorCount > 0 ? ` (${errorCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="announce" className="flex-1 shrink-0" style={{ borderRadius: 0, fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", minWidth: "5.5rem", whiteSpace: "nowrap" }}>
            ANNOUNCE
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <ApplicationsTab applications={applications ?? []} />
        </TabsContent>

        <TabsContent value="courses">
          <CoursesTab courses={coursesList} registrations={registrationsList} />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab members={members ?? []} currentUserId={user.id} />
        </TabsContent>

        <TabsContent value="sits">
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.3)", marginBottom: "0.75rem" }}>
            LAST 7 DAYS · BY DAY
          </p>
          <div className="space-y-px mb-6" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
            {daily.map(d => (
              <div key={d.date} style={{ background: "#2c2c2a", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem 1rem" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-3">
                    <span style={{ fontSize: "0.875rem", color: "#edecea" }}>{d.label}</span>
                    <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.3)", letterSpacing: "0.08em" }}>
                      {d.date.slice(5).replace("-", "/")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.7rem", color: "rgba(237,236,234,0.5)" }}>
                      {d.memberCount} <span style={{ fontSize: "0.55rem", color: "rgba(237,236,234,0.3)", letterSpacing: "0.08em" }}>PEOPLE</span>
                    </span>
                    <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.85rem", color: "#BEC23F" }}>
                      {d.totalMin}<span style={{ fontSize: "0.55rem", color: "rgba(237,236,234,0.3)", marginLeft: "0.2rem" }}>MIN</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.3)", marginBottom: "0.75rem" }}>
            THIS WEEK · BY MEMBER
          </p>
          {leaderboard.length === 0 && (
            <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.2)", textAlign: "center", padding: "2rem 0" }}>
              還沒有紀錄。
            </p>
          )}
          <div className="space-y-px" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
            {leaderboard.map((u, i) => (
              <Link key={u.user_id} href={`/u/${u.user_id}`} style={{ background: "#2c2c2a", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem 1rem", textDecoration: "none" }} className="flex items-center gap-3 hover:bg-[#2a2c28] transition-colors">
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.7rem", color: "rgba(237,236,234,0.3)", width: "1.5rem" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className={`avatar-${u.avatar_color} flex-shrink-0 flex items-center justify-center font-medium`}
                  style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                  {u.avatar_letter}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.875rem", color: "#edecea" }}>{u.display_name}</p>
                  <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.25)", letterSpacing: "0.08em", marginTop: "0.15rem" }}>
                    {u.days.size} DAYS
                  </p>
                </div>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.95rem", color: "#BEC23F" }}>
                  {u.minutes}<span style={{ fontSize: "0.55rem", color: "rgba(237,236,234,0.3)", marginLeft: "0.2rem" }}>MIN</span>
                </span>
              </Link>
            ))}
          </div>

          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.3)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            ALL SESSIONS · {allSits?.length ?? 0}
          </p>
          <p style={{ fontSize: "0.7rem", color: "rgba(237,236,234,0.3)", marginBottom: "0.75rem", lineHeight: 1.6 }}>
            可以刪除任何人的紀錄（含測試資料）。最多顯示 500 筆。
          </p>
          {(!allSits || allSits.length === 0) && (
            <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.2)", textAlign: "center", padding: "2rem 0" }}>
              還沒有任何紀錄。
            </p>
          )}
          <div className="space-y-px" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
            {allSits?.map((s) => {
              const d = new Date(new Date(s.sat_at).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
              const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              const label = `${s.display_name} · ${s.duration_min}min · ${dateStr}`;
              return (
                <div key={s.id} style={{ background: "#2c2c2a", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem 1rem" }} className="flex items-center gap-3">
                  <div className={`avatar-${s.avatar_color} flex-shrink-0 flex items-center justify-center font-medium`}
                    style={{ width: 26, height: 26, fontSize: "0.7rem" }}>
                    {s.avatar_letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span style={{ fontSize: "0.82rem", color: "#edecea" }} className="truncate">{s.display_name}</span>
                      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.7rem", color: "#BEC23F", flexShrink: 0 }}>
                        {s.duration_min}<span style={{ fontSize: "0.55rem", color: "rgba(237,236,234,0.3)", marginLeft: "0.15rem" }}>MIN</span>
                      </span>
                    </div>
                    <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.3)", letterSpacing: "0.06em", marginTop: "0.15rem" }}>
                      {dateStr}
                      {s.reflection ? " · 有心得" : ""}
                    </p>
                  </div>
                  <SitDeleteButton id={s.id} label={label} />
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="errors">
          <ErrorsTab errors={errors ?? []} />
        </TabsContent>

        <TabsContent value="announce">
          <AnnouncementsTab items={announcements ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
