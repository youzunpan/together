"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 管理員刪除任一筆靜坐紀錄（含他人）。用 service role 繞過 RLS。
export async function deleteSit(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { error: "無權限" };

  const admin = serviceClient();
  const { error } = await admin.from("sits").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/feed");
  revalidatePath("/me");
  return { ok: true };
}

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
