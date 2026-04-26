"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// 同心：輕呼喚式的共同靜坐預告。

// service role client：插 push_jobs 時用（行為等同自己排程，過 RLS）
function admin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function schedulePushForCallStart(params: {
  userId: string;
  callId: string;
  scheduledAt: string;
  message: string | null;
}) {
  const sb = admin();
  // 同心開始時：fire_at = scheduled_at（push 服務有 5–30s 延遲是正常的）
  await sb.from("push_jobs").insert({
    user_id: params.userId,
    fire_at: params.scheduledAt,
    kind: "call_start",
    ref_id: params.callId,
    payload: {
      title: "同心開始了",
      body: params.message || "輕輕坐下，呼吸幾次。",
      url: "/sit",
      tag: `call_${params.callId}`,
      renotify: true,
    },
  });
}

async function cancelPushForCall(userId: string, callId: string) {
  const sb = admin();
  await sb
    .from("push_jobs")
    .delete()
    .eq("user_id", userId)
    .eq("ref_id", callId)
    .is("sent_at", null);
}

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

  // 排發起人自己的開始通知
  await schedulePushForCallStart({
    userId: user.id,
    callId: call.id,
    scheduledAt: scheduledAt.toISOString(),
    message,
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

  // 撈這場的 scheduled_at + message 來排通知
  if (!error) {
    const { data: call } = await supabase
      .from("sit_calls")
      .select("scheduled_at, message")
      .eq("id", callId)
      .single();
    if (call) {
      // 只排還在未來的通知
      if (new Date(call.scheduled_at).getTime() > Date.now()) {
        await schedulePushForCallStart({
          userId: user.id,
          callId,
          scheduledAt: call.scheduled_at,
          message: call.message,
        });
      }
    }
  }

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

  // 清掉這個 user 對這場 call 的待送通知
  await cancelPushForCall(user.id, callId);

  revalidatePath("/feed");
  return { ok: true };
}

export async function cancelCall(callId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  // 撈所有加入者，待會把通知一次清掉（RLS 下發起人應能 select join 列表）
  const { data: joins } = await supabase
    .from("sit_call_joins")
    .select("user_id")
    .eq("call_id", callId);

  // RLS 確保只有發起人可刪
  const { error } = await supabase.from("sit_calls").delete().eq("id", callId);
  if (error) return { error: error.message };

  // 用 service role 把所有人的 push_jobs 清掉
  if (joins && joins.length > 0) {
    const sb = admin();
    await sb
      .from("push_jobs")
      .delete()
      .eq("ref_id", callId)
      .is("sent_at", null);
  }

  revalidatePath("/feed");
  return { ok: true };
}
