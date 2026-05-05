"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function admin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { error: "無權限" as const };
  return { user };
}

export async function createAnnouncement(formData: FormData) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) return { error: "內容不可空白" };
  if (body.length > 240) return { error: "請保持在 240 字以內" };

  const sb = admin();

  // 先把現有 active 的關掉，保證同時只有一則
  await sb.from("announcements").update({ active: false }).eq("active", true);

  const { error } = await sb.from("announcements").insert({
    body,
    created_by: auth.user.id,
    active: true,
  });
  if (error) return { error: error.message };

  revalidatePath("/feed");
  revalidatePath("/admin");
  return { ok: true };
}

export async function endAnnouncement(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const sb = admin();
  const { error } = await sb.from("announcements").update({ active: false }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  revalidatePath("/admin");
  return { ok: true };
}
