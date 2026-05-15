import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import AvatarUpload from "./AvatarUpload";
import Lamp from "@/components/Lamp";
import TwentyOneCircle from "@/components/TwentyOneCircle";
import RefreshOnVisible from "@/components/RefreshOnVisible";
import { compute21Day } from "@/lib/streak";

export default async function MePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: sits } = await supabase
    .from("sits").select("duration_min, sat_at")
    .eq("user_id", user.id).order("sat_at", { ascending: false });

  const totalMin = sits?.reduce((s, r) => s + r.duration_min, 0) ?? 0;
  const { circles, streak } = compute21Day(sits ?? []);

  // 收到的回應（其他人對「我發的 sit」的回應）—— 取最近 20 則
  // 用 last_replies_viewed_at 跟 created_at 比對，前 N 則標未讀
  type RawRecvReply = {
    id: string;
    body: string;
    created_at: string;
    sit: { duration_min: number; sat_at: string } | null;
    author: { display_name: string; avatar_letter: string; avatar_color: string } | null;
  };
  // 先撈自己所有 sit id
  const { data: mySitIds } = await supabase
    .from("sits").select("id").eq("user_id", user.id);
  const sitIdList = (mySitIds ?? []).map((s) => s.id);
  let receivedReplies: Array<{
    id: string; body: string; created_at: string;
    sitDurationMin: number; sitSatAt: string;
    authorName: string; authorLetter: string; authorColor: string;
    unread: boolean;
  }> = [];
  if (sitIdList.length > 0) {
    const { data: replies } = await supabase
      .from("sit_replies")
      .select("id, body, created_at, sit:sits(duration_min, sat_at), author:profiles(display_name, avatar_letter, avatar_color)")
      .in("sit_id", sitIdList)
      .neq("user_id", user.id) // 排除自己留給自己的（理論上不會發生）
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<RawRecvReply[]>();
    const lastViewed = new Date(profile.last_replies_viewed_at ?? 0).getTime();
    receivedReplies = (replies ?? [])
      .filter((r) => r.sit && r.author)
      .map((r) => ({
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        sitDurationMin: r.sit!.duration_min,
        sitSatAt: r.sit!.sat_at,
        authorName: r.author!.display_name,
        authorLetter: r.author!.avatar_letter,
        authorColor: r.author!.avatar_color,
        unread: new Date(r.created_at).getTime() > lastViewed,
      }));
  }

  // Admin 待審申請數（service role 繞過 RLS，只在 admin 才查）
  let pendingCount = 0;
  if (profile.role === "admin") {
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { count } = await adminClient
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <RefreshOnVisible />
      <header className="mb-8 flex items-center justify-between">
        {profile.role === "admin" ? (
          <Link href="/admin" prefetch style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "#BEC23F", width: "3rem", textAlign: "left", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            ADMIN
            {pendingCount > 0 && (
              <span aria-label={`${pendingCount} 件待審`}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: "1.1rem", height: "1.1rem", padding: "0 0.35rem",
                  borderRadius: "999px", background: "#D65C6A", color: "#1a1b18",
                  fontSize: "0.6rem", lineHeight: 1, fontWeight: 600,
                }}>
                {pendingCount}
              </span>
            )}
          </Link>
        ) : (
          <span style={{ width: "3rem" }} />
        )}
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.2)" }}>
          PROFILE
        </p>
        <Link href="/me/settings" prefetch style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.4)", width: "3rem", textAlign: "right" }}>
          EDIT
        </Link>
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

      {/* 收到的回應 */}
      {receivedReplies.length > 0 && (
        <section className="mb-8">
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", color: "rgba(237,236,234,0.3)", marginBottom: "0.75rem" }}>
            回應 · REPLIES
          </p>
          <div className="space-y-px" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
            {receivedReplies.map((r) => {
              const sitDate = new Date(new Date(r.sitSatAt).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
              const sitLabel = `${sitDate.getMonth() + 1}/${sitDate.getDate()} · ${r.sitDurationMin}min`;
              const replyDate = new Date(r.created_at);
              const diffSec = (Date.now() - replyDate.getTime()) / 1000;
              const ago =
                diffSec < 60 ? "剛剛"
                : diffSec < 3600 ? `${Math.floor(diffSec / 60)} 分鐘前`
                : diffSec < 86400 ? `${Math.floor(diffSec / 3600)} 小時前`
                : diffSec < 86400 * 7 ? `${Math.floor(diffSec / 86400)} 天前`
                : replyDate.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
              return (
                <div
                  key={r.id}
                  style={{
                    background: r.unread ? "rgba(190,194,63,0.06)" : "#2c2c2a",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    padding: "0.75rem 1rem",
                    position: "relative",
                  }}
                >
                  {r.unread && (
                    <span
                      aria-label="未讀"
                      style={{
                        position: "absolute", top: 12, right: 12,
                        width: 6, height: 6, borderRadius: "50%", background: "#BEC23F",
                      }}
                    />
                  )}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`avatar-${r.authorColor} flex-shrink-0 flex items-center justify-center font-medium`}
                      style={{ width: 26, height: 26, fontSize: "0.7rem" }}
                      aria-hidden
                    >
                      {r.authorLetter}
                    </div>
                    <div className="flex-1 min-w-0" style={{ paddingRight: r.unread ? "1rem" : 0 }}>
                      <div className="flex items-baseline gap-2" style={{ marginBottom: "0.2rem" }}>
                        <span style={{ fontSize: "0.82rem", color: "#edecea" }}>{r.authorName}</span>
                        <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: "rgba(237,236,234,0.3)" }}>
                          {ago}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.88rem", color: "rgba(237,236,234,0.85)", lineHeight: 1.55, wordBreak: "break-word", marginBottom: "0.3rem" }}>
                        {r.body}
                      </p>
                      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", color: "rgba(237,236,234,0.3)" }}>
                        在你 {sitLabel} 的紀錄
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
