"use server";

import { createClient } from "@/lib/supabase-server";
import { sendPushToUser } from "@/lib/web-push";

// Web Push 訂閱管理：把瀏覽器產的 PushSubscription 存到 push_subscriptions。
// 客戶端會把 subscription.toJSON() 傳上來，長這樣：
//   { endpoint: "https://fcm.googleapis.com/...", keys: { p256dh: "...", auth: "..." } }

type SubscriptionJSON = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
  expirationTime?: number | null;
};

export async function savePushSubscription(
  sub: SubscriptionJSON,
  userAgent?: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { error: "訂閱資料不完整" };
  }

  // upsert by endpoint：同一裝置重新訂閱會更新而不是塞一筆新的
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent ?? null,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deletePushSubscription(
  endpoint: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) return { error: error.message };
  return { ok: true };
}

// 測試用：對自己送一則推播，驗證整條管線是否打通
export async function sendTestPush(): Promise<
  { ok: true; sent: number; removed: number } | { error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const r = await sendPushToUser(user.id, {
    title: "同在 · 測試",
    body: "如果你看到這則通知，推播已經打通了。",
    url: "/feed",
    tag: "test",
    renotify: true,
  });
  if (r.sent === 0 && r.removed === 0) {
    return { error: "沒有可用的訂閱（可能未訂閱或全部已失效）" };
  }
  return { ok: true, sent: r.sent, removed: r.removed };
}

// 給 client 用：查詢這個 endpoint 是否已存在於 DB（判斷「已訂閱」狀態）
export async function hasPushSubscription(endpoint: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("endpoint", endpoint)
    .maybeSingle();

  return Boolean(data);
}
