// Server 端送 Web Push 的工具。
// 用 service role client 撈訂閱（繞過 RLS），對使用者所有裝置 fanout。
// 失敗（404 / 410 → 訂閱失效）時自動刪掉那筆 row。

import "server-only";
import webpush, { type PushSubscription, type SendResult } from "web-push";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

function admin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  renotify?: boolean;
};

type SubRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; removed: number }> {
  const sb = admin();
  const { data: subs, error } = await sb
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .returns<SubRow[]>();

  if (error || !subs || subs.length === 0) {
    return { sent: 0, failed: 0, removed: 0 };
  }

  let sent = 0;
  let failed = 0;
  let removed = 0;
  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (s) => {
      const sub: PushSubscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        const res = (await webpush.sendNotification(sub, body, { TTL: 60 })) as SendResult;
        // 2xx 表示送進 push service
        if (res.statusCode >= 200 && res.statusCode < 300) {
          sent++;
          await sb
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", s.id);
        } else {
          failed++;
        }
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode;
        // 404 / 410 → 訂閱失效，刪掉
        if (code === 404 || code === 410) {
          await sb.from("push_subscriptions").delete().eq("id", s.id);
          removed++;
        } else {
          failed++;
          console.error("[web-push] send failed", code, e);
        }
      }
    })
  );

  return { sent, failed, removed };
}
