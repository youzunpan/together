import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import TwentyOneCircle from "@/components/TwentyOneCircle";
import { compute21Day } from "@/lib/streak";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.id === id) redirect("/me");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!profile) notFound();

  const { data: sits } = await supabase
    .from("sits").select("id, duration_min, sat_at, reflection")
    .eq("user_id", id).order("sat_at", { ascending: false });

  const totalMin = sits?.reduce((s, r) => s + r.duration_min, 0) ?? 0;
  const { circles, streak } = compute21Day(sits ?? []);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/feed" style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.4)", width: "3rem" }}>
          ← BACK
        </Link>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.2)" }}>
          MEMBER
        </p>
        <span style={{ width: "3rem" }} />
      </header>

      <div className="flex items-center gap-5 mb-8">
        <Avatar letter={profile.avatar_letter} color={profile.avatar_color} avatarUrl={profile.avatar_url} size={64} />
        <div>
          <p style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.4rem", color: "#edecea", fontWeight: 400 }}>
            {profile.display_name}
          </p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(237,236,234,0.25)", marginTop: "0.25rem" }}>
            JOINED {new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" }).toUpperCase()}
          </p>
        </div>
      </div>

      {/* 21 天連續靜心圓圈 */}
      <TwentyOneCircle circles={circles} streak={streak} />

      {/* 總分鐘 */}
      <div className="mb-8" style={{ background: "#1a1b18", padding: "1.25rem 1rem", borderRadius: "var(--r-cell)" }}>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.25)", marginBottom: "0.5rem" }}>TOTAL</p>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "1.75rem", color: "#BEC23F", lineHeight: 1 }}>
          {totalMin}<span style={{ fontSize: "0.65rem", color: "rgba(237,236,234,0.3)", marginLeft: "0.3rem" }}>min</span>
        </p>
      </div>

      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.2)", marginBottom: "0.75rem" }}>
        SESSIONS
      </p>

      {!sits?.length && (
        <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.2)", textAlign: "center", padding: "3rem 0" }}>
          還沒有紀錄。
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
    </div>
  );
}
