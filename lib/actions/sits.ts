"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function recordSit(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const duration_min = Number(formData.get("duration_min"));
  const reflection = (formData.get("reflection") as string)?.trim() || null;
  const sat_at = (formData.get("sat_at") as string) || new Date().toISOString();

  if (!duration_min || duration_min < 1 || duration_min > 240) {
    return { error: "時間不正確" };
  }

  const { error } = await supabase.from("sits").insert({
    user_id: user.id,
    duration_min,
    reflection,
    sat_at,
  });

  if (error) return { error: error.message };
  redirect("/feed");
}
