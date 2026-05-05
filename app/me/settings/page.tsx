import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SettingsForm from "./SettingsForm";
import PushToggle from "@/components/PushToggle";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/me" style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.4)" }}>
          ← BACK
        </Link>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.3)" }}>
          SETTINGS
        </p>
        <span style={{ width: "3rem" }} />
      </header>

      <SettingsForm
        email={user.email ?? ""}
        display_name={profile.display_name}
        avatar_letter={profile.avatar_letter}
        avatar_color={profile.avatar_color}
        reminder_time={(profile.reminder_time as "off" | "morning" | "evening") ?? "off"}
      />

      <div className="mt-6">
        <PushToggle />
      </div>
    </div>
  );
}
