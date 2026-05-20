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
  durationMin: number;
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
      // 帶 ?duration=N 讓 /sit 自動進入倒數，學生不用再選一次時長
      url: `/sit?duration=${params.durationMin}`,
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

// 把同心開始時間格式化成繁中（給通知 body 用）
function formatScheduledForInvite(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// 立即推播給被邀請者：「X 邀請你 X月X日（X）22:30 一起靜心 N 分鐘」
async function schedulePushForInvite(params: {
  inviteeId: string;
  callId: string;
  inviterName: string;
  scheduledAt: string;
  durationMin: number;
  message: string | null;
}) {
  const sb = admin();
  const when = formatScheduledForInvite(params.scheduledAt);
  const baseBody = `${params.inviterName} 邀請你 ${when} 一起靜心 ${params.durationMin} 分鐘`;
  const body = params.message ? `${baseBody} — ${params.message}` : baseBody;

  await sb.from("push_jobs").insert({
    user_id: params.inviteeId,
    fire_at: new Date().toISOString(), // 立即送
    kind: "call_invite",
    ref_id: params.callId,
    payload: {
      title: "同心邀請",
      body,
      // 點通知跳 /feed，被邀請者在 UpcomingCalls 看到卡片自己決定要不要加入
      url: `/feed#call-${params.callId}`,
      tag: `call_invite_${params.callId}`,
      renotify: true,
    },
  });
}

// 寫入邀請（idempotent — 重複邀請同一人會被 PK 擋下，不算錯）
// 同時排立即送出的 push job。
async function insertInvitesAndSchedulePushes(args: {
  callId: string;
  inviteeIds: string[];
  inviterId: string;
  inviterName: string;
  scheduledAt: string;
  durationMin: number;
  message: string | null;
}) {
  if (args.inviteeIds.length === 0) return;
  const sb = admin();

  // 排除已經被邀請過的人，避免重複推播
  const { data: existing } = await sb
    .from("sit_call_invites")
    .select("user_id")
    .eq("call_id", args.callId)
    .in("user_id", args.inviteeIds);
  const alreadyInvited = new Set((existing ?? []).map((r) => r.user_id));
  const fresh = args.inviteeIds.filter((id) => !alreadyInvited.has(id) && id !== args.inviterId);
  if (fresh.length === 0) return;

  await sb.from("sit_call_invites").insert(
    fresh.map((user_id) => ({
      call_id: args.callId,
      user_id,
      invited_by: args.inviterId,
    })),
  );

  await Promise.all(
    fresh.map((inviteeId) =>
      schedulePushForInvite({
        inviteeId,
        callId: args.callId,
        inviterName: args.inviterName,
        scheduledAt: args.scheduledAt,
        durationMin: args.durationMin,
        message: args.message,
      }),
    ),
  );
}

export async function createCall(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  // datetime-local 字串（taipei 牆上時間） → 轉成 +08:00 ISO
  const scheduledLocal = (formData.get("scheduled_at") as string)?.trim();
  const durationMin = Number(formData.get("duration_min"));
  const message = (formData.get("message") as string)?.trim() || null;
  // 邀請對象（可選）：JSON 編碼的 uuid array
  const inviteeIdsRaw = (formData.get("invitee_ids") as string | null)?.trim() ?? "";
  let inviteeIds: string[] = [];
  if (inviteeIdsRaw) {
    try {
      const parsed = JSON.parse(inviteeIdsRaw);
      if (Array.isArray(parsed)) {
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        inviteeIds = parsed.filter((s): s is string => typeof s === "string" && uuidRe.test(s));
      }
    } catch {
      return { error: "邀請對象格式錯誤" };
    }
  }

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
    durationMin,
    message,
  });

  // 寫入邀請 + 立即推播給被邀請者
  if (inviteeIds.length > 0) {
    const { data: inviterProfile } = await supabase
      .from("profiles").select("display_name").eq("id", user.id).single();
    await insertInvitesAndSchedulePushes({
      callId: call.id,
      inviteeIds,
      inviterId: user.id,
      inviterName: inviterProfile?.display_name ?? "有人",
      scheduledAt: scheduledAt.toISOString(),
      durationMin,
      message,
    });
  }

  revalidatePath("/feed");
  return { ok: true, id: call.id };
}

// 發起人在開場後追加邀請對象
export async function addInvites(callId: string, inviteeIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  // 確認 call 存在 + 是發起人
  const { data: call } = await supabase
    .from("sit_calls")
    .select("id, user_id, scheduled_at, duration_min, message")
    .eq("id", callId)
    .single();
  if (!call) return { error: "找不到這場同心" };
  if (call.user_id !== user.id) return { error: "只能邀請自己開的場" };

  // 過去的場次不再開放追加邀請（避免無意義通知）
  if (new Date(call.scheduled_at).getTime() < Date.now() - 5 * 60 * 1000) {
    return { error: "這場已經開始了" };
  }

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const cleaned = (inviteeIds ?? []).filter((s) => typeof s === "string" && uuidRe.test(s));
  if (cleaned.length === 0) return { error: "沒有可邀請的對象" };

  const { data: inviterProfile } = await supabase
    .from("profiles").select("display_name").eq("id", user.id).single();

  await insertInvitesAndSchedulePushes({
    callId,
    inviteeIds: cleaned,
    inviterId: user.id,
    inviterName: inviterProfile?.display_name ?? "有人",
    scheduledAt: call.scheduled_at,
    durationMin: call.duration_min,
    message: call.message,
  });

  revalidatePath("/feed");
  return { ok: true };
}

// 撤回某人的邀請（並清掉還沒送出的邀請 push）
export async function revokeInvite(callId: string, inviteeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  // RLS 確保只有發起人能刪
  const { error } = await supabase
    .from("sit_call_invites")
    .delete()
    .eq("call_id", callId)
    .eq("user_id", inviteeId);
  if (error) return { error: error.message };

  // 清掉這個 user 對這場 call 還沒發出的 invite push
  const sb = admin();
  await sb
    .from("push_jobs")
    .delete()
    .eq("user_id", inviteeId)
    .eq("ref_id", callId)
    .eq("kind", "call_invite")
    .is("sent_at", null);

  revalidatePath("/feed");
  return { ok: true };
}

// 給邀請對話框用：列出所有可邀請的會員（active 成員 + admin，排除自己跟「已被刪除」的）
export async function listInvitableMembers(callId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入", members: [] };

  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_letter, avatar_color, avatar_url")
    .neq("role", "removed")
    .neq("id", user.id)
    .order("display_name");

  // 如果有 callId，順便撈已經邀請過的，client 端用來標 disabled
  let alreadyInvited: string[] = [];
  if (callId) {
    const { data: invites } = await supabase
      .from("sit_call_invites")
      .select("user_id")
      .eq("call_id", callId);
    alreadyInvited = (invites ?? []).map((r) => r.user_id);
  }

  return { members: members ?? [], alreadyInvited };
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
      .select("scheduled_at, duration_min, message")
      .eq("id", callId)
      .single();
    if (call) {
      // 只排還在未來的通知
      if (new Date(call.scheduled_at).getTime() > Date.now()) {
        await schedulePushForCallStart({
          userId: user.id,
          callId,
          scheduledAt: call.scheduled_at,
          durationMin: call.duration_min,
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

// 管理員強制刪除任何呼喚（用 service role 繞過 RLS）。
// 給 /admin 用，平常使用者會走 cancelCall。
export async function adminCancelCall(callId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { error: "無權限" };

  const sb = admin();
  const { error } = await sb.from("sit_calls").delete().eq("id", callId);
  if (error) return { error: error.message };

  await sb.from("push_jobs").delete().eq("ref_id", callId).is("sent_at", null);

  revalidatePath("/feed");
  revalidatePath("/admin");
  return { ok: true };
}
