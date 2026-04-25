"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// 同心：輕呼喚式的共同靜坐預告。

export async function createCall(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  // datetime-local 字串（taipei 牆上時間） → 轉成 +08:00 ISO
  const scheduledLocal = (formData.get("scheduled_at") as string)?.trim();
  const durationMin = Number(formData.get("duration_min"));
  const message = (formData.get("message") as string)?.trim() || null;

  if (!scheduledLocal) return { error: "請選擇時間" };
  if (!durationMin || durationMin < 1 || durationMin > 240) return { error: "時長不正確" };
  if (message && message.length > 80) return { error: "訊息過長（上限 80 字）" };

  const scheduledAt = new Date(`${scheduledLocal}:00+08:00`);
  if (isNaN(scheduledAt.getTime())) return { error: "時間格式不正確" };

  // 不允許訂太久以前的時間
  const now = Date.now();
  if (scheduledAt.getTime() < now - 5 * 60 * 1000) {
    return { error: "時間不能在過去" };
  }
  // 也不允許訂超過 30 天後（避免漂浮在列表）
  if (scheduledAt.getTime() > now + 30 * 24 * 60 * 60 * 1000) {
    return { error: "時間最多訂在 30 天內" };
  }

  const { data: call, error } = await supabase
    .from("sit_calls")
    .insert({
      user_id: user.id,
      scheduled_at: scheduledAt.toISOString(),
      duration_min: durationMin,
      message,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // 發起人預設加入自己
  await supabase.from("sit_call_joins").insert({
    call_id: call.id,
    user_id: user.id,
  });

  revalidatePath("/feed");
  return { ok: true, id: call.id };
}

export async function joinCall(callId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const { error } = await supabase
    .from("sit_call_joins")
    .insert({ call_id: callId, user_id: user.id });

  // 23505 = unique violation（重複加入），視為成功
  if (error && error.code !== "23505") return { error: error.message };

  revalidatePath("/feed");
  return { ok: true };
}

export async function leaveCall(callId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const { error } = await supabase
    .from("sit_call_joins")
    .delete()
    .eq("call_id", callId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { ok: true };
}

export async function cancelCall(callId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  // RLS 確保只有發起人可刪
  const { error } = await supabase.from("sit_calls").delete().eq("id", callId);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { ok: true };
}
