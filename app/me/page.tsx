import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AvatarUpload from "./AvatarUpload";
import Lamp from "@/components/Lamp";
import SitMark from "@/components/SitMark";
import TwentyOneCircle from "@/components/TwentyOneCircle";
import { taipeiDateKey } from "@/lib/tz";

// 21 天連續靜心：每連續 21 天 = +1 圓，漏一天歸零。
// 連續判定以台北時區的「日」為單位：那一天有任何一筆 sit 即算 ✓
function compute21Day(sits: { sat_at: string }[]): { circles: number; streak: number } {
  if (!sits.length) return { circles: 0, streak: 0 };

  // 蒐集有坐的台北日 key（去重，升冪）
  const keys = new Set<string>();
  for (const s of sits) keys.add(taipeiDateKey(new Date(s.sat_at)));
  const sorted = [...keys].sort();

  let circles = 0;
  let streak = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    if (prev) {
      const da = new Date(`${prev}T00:00:00+08:00`).getTime();
      const db = new Date(`${day}T00:00:00+08:00`).getTime();
      const diff = Math.round((db - da) / 86400000);
      if (diff > 1) streak = 0; // 漏一天 → 歸零
    }
    streak += 1;
    if (streak === 21) {
      circles += 1;
      streak = 0; // 完成一個圓，重新開始
    }
    prev = day;
  }

  // 連續是否還活著：last day 必須是今天或昨天，否則中斷
  if (prev) {
    const todayKey = taipeiDateKey(new Date());
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestKey = taipeiDateKey(yest);
    if (prev !== todayKey && prev !== yestKey) streak = 0;
  }

  return { circles, streak };
}

export default async function MePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: sits } = await supabase
    .from("sits").select("duration_min, sat_at, reflection")
    .eq("user_id", user.id).order("sat_at", { ascending: false });

  const totalMin = sits?.reduce((s, r) => s + r.duration_min, 0) ?? 0;
  const { circles, streak } = compute21Day(sits ?? []);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-8 flex items-center justify-between">
        {profile.role === "admin" ? (
          <a href="/admin" style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "#BEC23F", width: "3rem", textAlign: "left" }}>
            ADMIN
          </a>
        ) : (
          <span style={{ width: "3rem" }} />
        )}
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.2)" }}>
          PROFILE
        </p>
        <a href="/me/settings" style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.4)", width: "3rem", textAlign: "right" }}>
          EDIT
        </a>
      </header>

      {/* 頭像 + 名字 */}
      <div className="flex items-center gap-5 mb-8">
        <AvatarUpload userId={user.id} currentUrl={profile.avatar_url} letter={profile.avatar_letter} color={profile.avatar_color} />
        <div>
          <p style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.4rem", color: "#edecea", fontWeight: 400 }}>
            {profile.display_name}
          </p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(237,236,234,0.25)", marginTop: "0.25rem" }}>
            JOINED {new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" }).toUpperCase()}
          </p>
        </div>
      </div>

      {/* 一盞燈 */}
      <Lamp lastSatAt={sits?.[0]?.sat_at ?? null} />

      {/* 21 天連續靜心圓圈 */}
      <TwentyOneCircle circles={circles} streak={streak} />

      {/* 總分鐘 */}
      <div className="mb-8" style={{ background: "#1a1b18", padding: "1.25rem 1rem", borderRadius: "var(--r-cell)" }}>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.25)", marginBottom: "0.5rem" }}>TOTAL</p>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "1.75rem", color: "#BEC23F", lineHeight: 1 }}>
          {totalMin}<span style={{ fontSize: "0.65rem", color: "rgba(237,236,234,0.3)", marginLeft: "0.3rem" }}>min</span>
        </p>
      </div>

      {/* 紀錄 */}
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.2)", marginBottom: "0.75rem" }}>
        SESSIONS
      </p>

      {!sits?.length && (
        <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.2)", textAlign: "center", padding: "3rem 0" }}>
          還沒有紀錄。坐一次就會出現在這裡。
        </p>
      )}

      <div className="pb-8" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
      <div className="space-y-px">
        {sits?.map((sit, i) => {
          const d = new Date(new Date(sit.sat_at).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const prevDate = i > 0 ? (() => {
            const pd = new Date(new Date(sits![i - 1].sat_at).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
            return `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}-${String(pd.getDate()).padStart(2, "0")}`;
          })() : null;
          const isFirstOfDay = dateKey !== prevDate;
          const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
          return (
            <div key={i} id={isFirstOfDay ? `day-${dateKey}` : undefined} style={{ background: "#2c2c2a", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem 1rem" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SitMark satAt={sit.sat_at} durationMin={sit.duration_min} size={26} />
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.75rem", color: "#BEC23F" }}>
                    {sit.duration_min}min
                  </span>
                </div>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.25)", letterSpacing: "0.08em" }}>
                  {dateStr}
                </span>
              </div>
              {sit.reflection && (
                <p className="reflection-text mt-1" style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.4)", lineHeight: 1.6, paddingLeft: "calc(26px + 0.75rem)" }}>
                  {sit.reflection}
                </p>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
