"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const AVATAR_COLORS = ["purple", "teal", "coral", "blue", "amber", "pink"] as const;

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

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

export type ReminderTime = "off" | "morning" | "evening";

export async function setReminderTime(time: ReminderTime) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };
  if (!["off", "morning", "evening"].includes(time)) return { error: "格式錯誤" };
  const { error } = await supabase
    .from("profiles")
    .update({ reminder_time: time })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/me/settings");
  return { ok: true };
}

// 管理員強制移除某人：清掉資料 + 刪 auth.user。對方會立即被踢出。
// 不能移除自己（admin），也不能移除其他 admin（避免互砍）。
export async function adminRemoveMember(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };
  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!me || me.role !== "admin") return { error: "無權限" };
  if (targetUserId === user.id) return { error: "不能移除自己" };

  const admin = serviceClient();

  // 防呆：不允許移除其他 admin
  const { data: target } = await admin
    .from("profiles").select("role").eq("id", targetUserId).single();
  if (!target) return { error: "找不到該成員" };
  if (target.role === "admin") return { error: "不能移除其他管理員" };

  // 1. 刪該人 sits
  await admin.from("sits").delete().eq("user_id", targetUserId);
  // 2. 刪該人的 hearts（hearts.user_id 沒 cascade，會擋 profile 刪除）
  await admin.from("hearts").delete().eq("user_id", targetUserId);
  // 3. 把 applications.reviewed_by 指向 target 的清空
  await admin.from("applications").update({ reviewed_by: null }).eq("reviewed_by", targetUserId);
  // 4. invites 沒 cascade — 沒人在用但保險起見處理
  await admin.from("invites").update({ used_by: null }).eq("used_by", targetUserId);
  await admin.from("invites").delete().eq("created_by", targetUserId);
  // 5. 把 registrations.user_id 設 NULL（FK 已是 SET NULL，但保險）
  await admin.from("registrations").update({ user_id: null }).eq("user_id", targetUserId);
  // 6. 刪該人尚未發出的 push_jobs
  await admin.from("push_jobs").delete().eq("user_id", targetUserId);
  // 7. 刪 profile（其他 cascade 表會自動清：push_subscriptions / sit_calls / sit_call_joins / reactions / reminder_log）
  const { error: profErr } = await admin.from("profiles").delete().eq("id", targetUserId);
  if (profErr) return { error: `刪除 profile 失敗：${profErr.message}` };
  // 5. 刪該 email 的歷史 application（若有）
  const { data: targetUser } = await admin.auth.admin.getUserById(targetUserId);
  if (targetUser?.user?.email) {
    await admin.from("applications").delete().ilike("email", targetUser.user.email);
  }
  // 6. 刪 auth user（會立即吊銷 session）
  const { error: authErr } = await admin.auth.admin.deleteUser(targetUserId);
  if (authErr) return { error: `刪除帳號失敗：${authErr.message}` };

  revalidatePath("/admin");
  return { ok: true };
}

// 完全刪除自己的帳號：sits / 推播訂閱 / 同心呼喚 / reactions / profile / auth user
// 部分表（push_subscriptions / sit_calls / sit_call_joins / reactions）是 ON DELETE CASCADE
// 但 sits 沒有 cascade、applications.reviewed_by 也是 RESTRICT，需手動處理。
export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  // 雙重確認：使用者必須輸入「刪除」兩個字
  const confirmText = (formData.get("confirm") as string | null)?.trim();
  if (confirmText !== "刪除") {
    return { error: "請輸入「刪除」二字以確認" };
  }

  const admin = serviceClient();

  // 1. 刪自己的 sits
  const { error: sitsErr } = await admin.from("sits").delete().eq("user_id", user.id);
  if (sitsErr) return { error: `刪除靜心紀錄失敗：${sitsErr.message}` };

  // 2. 刪 hearts（沒 cascade，會擋 profile 刪除）
  await admin.from("hearts").delete().eq("user_id", user.id);

  // 3. 把 applications.reviewed_by / invites 處理（沒 cascade）
  await admin.from("applications").update({ reviewed_by: null }).eq("reviewed_by", user.id);
  await admin.from("invites").update({ used_by: null }).eq("used_by", user.id);
  await admin.from("invites").delete().eq("created_by", user.id);

  // 4. 把 registrations.user_id 設 NULL（保留報名歷史，純粹解綁）
  await admin.from("registrations").update({ user_id: null }).eq("user_id", user.id);

  // 5. 刪 profile（會 cascade 其他 push_subscriptions / sit_calls / sit_call_joins / reactions / reminder_log）
  const { error: profErr } = await admin.from("profiles").delete().eq("id", user.id);
  if (profErr) return { error: `刪除 profile 失敗：${profErr.message}` };

  // 4. 把該 email 的 application 也刪掉，使用者之後想重新申請才不會被「已申請過」擋
  if (user.email) {
    await admin.from("applications").delete().ilike("email", user.email);
  }

  // 5. 刪 auth user
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) return { error: `刪除帳號失敗：${authErr.message}` };

  // 6. 在當前 server-side session 也登出
  await supabase.auth.signOut();
  redirect("/login");
}
