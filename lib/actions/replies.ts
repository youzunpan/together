"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

const MAX_LEN = 40;

export async function postReply(sitId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const trimmed = body.trim();
  if (!trimmed) return { error: "請寫點什麼" };
  if (trimmed.length > MAX_LEN) return { error: `最多 ${MAX_LEN} 字` };

  const { error } = await supabase
    .from("sit_replies")
    .insert({ sit_id: sitId, user_id: user.id, body: trimmed });
  if (error) {
    if (error.code === "23505") return { error: "你已經回應過這筆了" };
    return { error: error.message };
  }

  revalidatePath("/feed");
  return { ok: true };
}

export async function updateReply(replyId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const trimmed = body.trim();
  if (!trimmed) return { error: "請寫點什麼" };
  if (trimmed.length > MAX_LEN) return { error: `最多 ${MAX_LEN} 字` };

  const { error } = await supabase
    .from("sit_replies")
    .update({ body: trimmed })
    .eq("id", replyId)
    .eq("user_id", user.id); // 只能改自己的
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { ok: true };
}

export async function deleteReply(replyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  // RLS 只允許刪自己的，這裡 client side 加一層保護
  const { error } = await supabase
    .from("sit_replies")
    .delete()
    .eq("id", replyId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { ok: true };
}

// 把當前使用者的「last_replies_viewed_at」更新到現在，等於清掉未讀紅點
export async function markRepliesViewed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase
    .from("profiles")
    .update({ last_replies_viewed_at: new Date().toISOString() })
    .eq("id", user.id);
  return { ok: true };
}
