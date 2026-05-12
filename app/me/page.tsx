import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import AvatarUpload from "./AvatarUpload";
import Lamp from "@/components/Lamp";
import TwentyOneCircle from "@/components/TwentyOneCircle";
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
    </div>
  );
}
