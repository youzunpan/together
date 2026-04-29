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
    .from("sits").select("duration_min, sat_at")
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

    </div>
  );
}
