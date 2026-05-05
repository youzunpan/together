"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { error: "無權限" as const };
  return { user };
}

export async function clearAllErrors() {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  // 刪掉所有 row
  const { error } = await sb.from("error_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
