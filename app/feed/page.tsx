import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import ReactionBar from "./ReactionBar";
import Avatar from "@/components/Avatar";
import LiveSitters from "./LiveSitters";
import CommunityCircle from "@/components/CommunityCircle";
import UpcomingCalls from "@/components/UpcomingCalls";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import RefreshOnVisible from "@/components/RefreshOnVisible";
import { taipeiTodayStartISO, taipeiDiffDays, taipeiDateKey, APP_TZ } from "@/lib/tz";
import { compute21Day } from "@/lib/streak";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 為避免全表掃描，限制最近一年資料（社群連續日 / 共修圓在這個窗口內準確即可）
  const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString();

  // 8 個 query 全部並行（之前是循序累加，慢的時候會超過 1 秒）
  const [
    summaryRes,
    todaySitRes,
    ownSitCountRes,
    sitsRes,
    allSitsRes,
    announcementRes,
    openCoursesRes,
  ] = await Promise.all([
    supabase.rpc("today_summary"),
    supabase
      .from("sits")
      .select("duration_min")
      .eq("user_id", user!.id)
      .gte("sat_at", taipeiTodayStartISO())
      .order("sat_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id),
    supabase
      .from("sits_with_stats")
      .select("*")
      .order("sat_at", { ascending: false })
      .limit(30),
    supabase
      .from("sits")
      .select("user_id, sat_at")
      .gte("sat_at", oneYearAgo)
      .order("sat_at", { ascending: true }),
    supabase
      .from("announcements")
      .select("id, body")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("courses")
      .select("slug, title")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  const summary = summaryRes.data;
  const todaySit = todaySitRes.data;
  const ownSitCount = ownSitCountRes.count;
  const sits = sitsRes.data;
  const allSits = allSitsRes.data;
  const announcement = announcementRes.data;
  const openCourses = openCoursesRes.data;
  const alreadyMember = (ownSitCount ?? 0) > 0;

  const dayMembers = new Map<string, Set<string>>();
  for (const s of (allSits ?? []) as { user_id: string; sat_at: string }[]) {
    const k = taipeiDateKey(new Date(s.sat_at));
    const set = dayMembers.get(k) ?? new Set<string>();
    set.add(s.user_id);
    dayMembers.set(k, set);
  }
  const activeDayKeys = [...dayMembers.keys()].sort();
  const communityVirtualSits = activeDayKeys.map((k) => ({
    sat_at: `${k}T00:00:00+08:00`,
  }));
  const { circles: communityCircles, streak: communityStreak } =
    compute21Day(communityVirtualSits);

  const todayKey = taipeiDateKey(new Date());
  const todayMembers = dayMembers.get(todayKey)?.size ?? 0;

  const dateStr = new Date().toLocaleDateString("zh-TW", { month: "long", day: "numeric", timeZone: APP_TZ });

  return (
    <div className="max-w-md mx-auto px-4">
      <RefreshOnVisible />
      {/* 首次登入引導（新用戶才顯示） */}
      <WelcomeOverlay alreadyMember={alreadyMember} />

      {/* Sticky header */}
      <header className="sticky z-10 pt-4 pb-3"
        style={{
          top: "env(safe-area-inset-top)",
          background: "rgba(26,27,24,0.92)",
          backdropFilter: "blur(12px)",
        }}>

        {/* 品牌標 */}
        <p className="text-center mb-3" style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.25)" }}>
          同在 · TOGETHER
        </p>

        {/* 狀態卡 */}
        <div style={{ background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.06)", padding: "0.875rem 1rem", borderRadius: "var(--r-card)" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.3)", fontFamily: "var(--font-space-mono)", marginBottom: "0.5rem" }}>
            TODAY · {dateStr.toUpperCase()}
          </p>
          {todaySit ? (
            <div className="flex items-center justify-between">
              <p style={{ fontSize: "0.9rem", color: "#edecea" }}>今天你坐了 <span style={{ fontFamily: "var(--font-space-mono)", color: "#BEC23F" }}>{todaySit.duration_min}</span> 分鐘。</p>
              <Link href="/sit" prefetch style={{ fontSize: "0.75rem", letterSpacing: "0.08em", color: "rgba(237,236,234,0.35)" }} className="hover:text-[#BEC23F] transition-colors">
                再坐一次 →
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.45)" }}>你還沒記錄今日的靜心</p>
              <Link href="/sit" prefetch className="btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.75rem", letterSpacing: "0.08em", textDecoration: "none", flexShrink: 0 }}>
                記錄今天
              </Link>
            </div>
          )}
        </div>

        {/* 開放報名中的課程連結（淡淡一行） */}
        {openCourses && openCourses.length > 0 && (
          <p className="text-center mt-2.5" style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.62rem", letterSpacing: "0.12em" }}>
            <Link
              href={openCourses.length === 1 ? `/courses/${openCourses[0].slug}` : "/courses"}
              prefetch
              style={{ color: "rgba(190,194,63,0.65)", textDecoration: "none" }}
            >
              {openCourses.length === 1
                ? <>新課程 · <span style={{ color: "#BEC23F" }}>{openCourses[0].title}</span> →</>
                : <>新課程 · <span style={{ color: "#BEC23F" }}>{openCourses.length} 個開放中</span> →</>}
            </Link>
          </p>
        )}

        {/* 正在靜坐的人 */}
        <LiveSitters currentUserId={user!.id} />

        {/* 社群摘要 */}
        {summary && summary.member_count > 0 && (
          <p className="text-center mt-2" style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(237,236,234,0.2)" }}>
            {summary.member_count} MEMBERS · {summary.total_minutes} MIN TODAY
          </p>
        )}
      </header>

      <div className="mt-4 pb-6">
        {/* Admin 公告（active 才有資料） */}
        {announcement && (
          <AnnouncementBanner id={announcement.id} body={announcement.body} />
        )}

        {/* PWA 安裝指引（沒安裝才顯示，client-side 偵測） */}
        <PWAInstallBanner />

        {/* 同心：未過期的呼喚 */}
        <UpcomingCalls />

        <CommunityCircle
          circles={communityCircles}
          streak={communityStreak}
          todayMembers={todayMembers}
        />

        {(!sits || sits.length === 0) && (
          <div className="text-center py-12" style={{ color: "rgba(237,236,234,0.35)" }}>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
              安靜的一天。
            </p>
            <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.25)", lineHeight: 1.7 }}>
              第一個坐的人會在這裡出現。<br />
              是你？
            </p>
          </div>
        )}
        {sits && sits.length > 0 && <Timeline sits={sits} currentUserId={user!.id} />}
      </div>
    </div>
  );
}

function groupByDate(sits: any[]) {
  const groups: { label: string; items: any[] }[] = [];
  const seen: Record<string, number> = {};
  const now = new Date();
  for (const sit of sits) {
    const d = new Date(sit.sat_at);
    const diffDays = taipeiDiffDays(now, d);
    let label = diffDays === 0 ? "今天" : diffDays === 1 ? "昨天" : diffDays <= 3 ? `${diffDays} 天前` : d.toLocaleDateString("zh-TW", { month: "long", day: "numeric", timeZone: APP_TZ });
    if (seen[label] === undefined) { seen[label] = groups.length; groups.push({ label, items: [] }); }
    groups[seen[label]].items.push(sit);
  }
  return groups;
}

function Timeline({ sits, currentUserId }: { sits: any[]; currentUserId: string }) {
  const groups = groupByDate(sits);
  // 跨組交替 side，保持流動感
  let idx = 0;
  return (
    <div className="relative pt-2">
      {/* 中央時間軸 */}
      <div
        aria-hidden
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 1,
          background:
            "linear-gradient(to bottom, rgba(190,194,63,0.35) 0%, rgba(190,194,63,0.15) 60%, rgba(190,194,63,0.05) 100%)",
        }}
      />

      {groups.map(({ label, items }) => (
        <div key={label}>
          {/* 日期 pill 坐在線上 */}
          <div className="relative flex justify-center my-4">
            <span
              style={{
                background: "#1a1b18",
                padding: "0.3rem 0.75rem",
                fontFamily: "var(--font-space-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                color: "rgba(237,236,234,0.4)",
                border: "1px solid rgba(190,194,63,0.25)",
                borderRadius: "var(--r-pill)",
              }}
            >
              {label.toUpperCase()}
            </span>
          </div>

          {items.map((sit) => {
            const side: "left" | "right" = idx % 2 === 0 ? "right" : "left";
            idx++;
            return <TimelineCard key={sit.id} sit={sit} side={side} currentUserId={currentUserId} />;
          })}
        </div>
      ))}

      {/* 線尾端點 */}
      <div className="relative flex justify-center mt-2">
        <div
          aria-hidden
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "rgba(190,194,63,0.3)",
          }}
        />
      </div>
    </div>
  );
}

function TimelineCard({ sit, side, currentUserId }: { sit: any; side: "left" | "right"; currentUserId: string }) {
  const isSelf = sit.user_id === currentUserId;
  const href = isSelf ? "/me" : `/u/${sit.user_id}`;
  const ago = (() => {
    const mins = Math.floor((Date.now() - new Date(sit.sat_at).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  })();
  const isLeft = side === "left";

  // 左右卡片交替深淺
  const isLight = isLeft;
  const cardBg = isLight ? "#e8e8e8" : "#2c2c2a";
  const cardBorder = isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.05)";
  const nameColor = isLight ? "#1a1b18" : "#edecea";
  const reflectionColor = isLight ? "rgba(26,27,24,0.78)" : "rgba(237,236,234,0.88)";
  const agoColor = isLight ? "rgba(26,27,24,0.35)" : "rgba(237,236,234,0.3)";
  const durationColor = isLight ? "#6d7220" : "#BEC23F";

  return (
    <div className="relative my-3">
      {/* 軸上的點：垂直置中對齊卡片 */}
      <div
        aria-hidden
        className="absolute left-1/2"
        style={{
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 8, height: 8, borderRadius: "50%",
          background: "#BEC23F",
          boxShadow: "0 0 0 3px #1a1b18",
        }}
      />

      <div className="flex" style={{ justifyContent: isLeft ? "flex-start" : "flex-end" }}>
        <div
          style={{
            width: "46%",
            background: cardBg,
            border: cardBorder,
            borderRadius: "var(--r-card)",
            padding: "0.7rem 0.8rem",
            marginRight: isLeft ? "0.75rem" : 0,
            marginLeft: isLeft ? 0 : "0.75rem",
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{ flexDirection: isLeft ? "row-reverse" : "row" }}
          >
            <a href={href} className="flex-shrink-0">
              <Avatar letter={sit.avatar_letter} color={sit.avatar_color} avatarUrl={sit.avatar_url} size={28} />
            </a>
            <div className="min-w-0 flex-1" style={{ textAlign: isLeft ? "right" : "left" }}>
              <a
                href={href}
                style={{ fontSize: "0.82rem", color: nameColor, display: "block" }}
                className="hover:opacity-70 transition-opacity truncate"
              >
                {sit.display_name}
              </a>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", color: durationColor }}>
                {sit.duration_min}min
              </span>
            </div>
          </div>

          {sit.reflection && (
            <p
              className="reflection-text mt-2"
              style={{
                fontSize: "0.82rem",
                color: reflectionColor,
                lineHeight: 1.55,
                textAlign: isLeft ? "right" : "left",
              }}
            >
              {sit.reflection}
            </p>
          )}

          <div
            className="flex items-center gap-2 mt-2"
            style={{ justifyContent: isLeft ? "flex-start" : "flex-end" }}
          >
            <ReactionBar
              sitId={sit.id}
              count={Number(sit.sit_count ?? 0)}
              mine={Boolean(sit.sit_by_me)}
              lightBg={isLight}
            />
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: agoColor }}>
              {ago}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
