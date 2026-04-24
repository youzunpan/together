"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const AVATAR_COLORS = ["purple", "teal", "coral", "blue", "amber", "pink"] as const;

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const display_name = (formData.get("display_name") as string | null)?.trim();
  const avatar_letter = (formData.get("avatar_letter") as string | null)?.trim();
  const avatar_color = formData.get("avatar_color") as string | null;

  if (!display_name) return { error: "顯示名稱不可空白" };
  if (display_name.length > 40) return { error: "顯示名稱過長" };
  if (!avatar_letter || avatar_letter.length === 0) return { error: "頭像字不可空白" };
  if ([...avatar_letter].length > 2) return { error: "頭像字最多 2 個" };
  if (!avatar_color || !AVATAR_COLORS.includes(avatar_color as typeof AVATAR_COLORS[number])) {
    return { error: "頭像顏色不合法" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name, avatar_letter, avatar_color })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/me");
  revalidatePath("/feed");
  return { ok: true };
}

export async function setPassword(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const password = formData.get("password") as string | null;
  const confirm = formData.get("confirm") as string | null;

  if (!password || password.length < 6) return { error: "密碼至少 6 個字" };
  if (password !== confirm) return { error: "兩次密碼不一致" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
