import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AvatarUpload from "./AvatarUpload";
import Heatmap from "./Heatmap";

function buildHeatmapDays(sits: { sat_at: string; duration_min: number }[]) {
  // Taipei 時區的最近 90 天
  const totals = new Map<string, number>();
  for (const s of sits) {
    const d = new Date(new Date(s.sat_at).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    totals.set(key, (totals.get(key) ?? 0) + s.duration_min);
  }
  const days: { date: string; minutes: number }[] = [];
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ date: key, minutes: totals.get(key) ?? 0 });
  }
  return days;
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
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthDays = new Set(sits?.filter(r => r.sat_at >= monthStart).map(r => r.sat_at.slice(0, 10))).size;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-8 flex items-center justify-between">
        <span style={{ width: "3rem" }} />
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

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-px mb-8" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div style={{ background: "#1a1b18", padding: "1.25rem 1rem" }}>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.25)", marginBottom: "0.5rem" }}>TOTAL</p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "1.75rem", color: "#BEC23F", lineHeight: 1 }}>
            {totalMin}<span style={{ fontSize: "0.65rem", color: "rgba(237,236,234,0.3)", marginLeft: "0.3rem" }}>min</span>
          </p>
        </div>
        <div style={{ background: "#1a1b18", padding: "1.25rem 1rem" }}>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.25)", marginBottom: "0.5rem" }}>THIS MONTH</p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "1.75rem", color: "#BEC23F", lineHeight: 1 }}>
            {monthDays}<span style={{ fontSize: "0.65rem", color: "rgba(237,236,234,0.3)", marginLeft: "0.3rem" }}>days</span>
          </p>
        </div>
      </div>

      {/* 熱度圖 */}
      <Heatmap days={buildHeatmapDays(sits ?? [])} />

      {/* 紀錄 */}
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.2)", marginBottom: "0.75rem" }}>
        SESSIONS
      </p>

      {!sits?.length && (
        <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.2)", textAlign: "center", padding: "3rem 0" }}>
          還沒有紀錄。坐一次就會出現在這裡。
        </p>
      )}

      <div className="space-y-px pb-8">
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
            <div key={i} id={isFirstOfDay ? `day-${dateKey}` : undefined} style={{ background: "#202220", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem 1rem" }}>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.75rem", color: "#BEC23F" }}>
                  {sit.duration_min}min
                </span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.25)", letterSpacing: "0.08em" }}>
                  {dateStr}
                </span>
              </div>
              {sit.reflection && (
                <p className="reflection-text mt-1" style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.4)", lineHeight: 1.6 }}>
                  {sit.reflection}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
