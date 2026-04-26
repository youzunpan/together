// 每分鐘由 Vercel Cron 觸發。
// 掃 push_jobs：fire_at <= now AND sent_at IS NULL AND error_at IS NULL → 送出。
// 認證：Vercel Cron 會帶 `Authorization: Bearer ${CRON_SECRET}`。

import { NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToUser, type PushPayload } from "@/lib/web-push";

export const dynamic = "force-dynamic";
// Node runtime（web-push 用 Node crypto）
export const runtime = "nodejs";

type Job = {
  id: string;
  user_id: string;
  payload: PushPayload;
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const nowIso = new Date().toISOString();
  // 取最多 100 筆到期未送
  const { data: jobs, error } = await sb
    .from("push_jobs")
    .select("id, user_id, payload")
    .lte("fire_at", nowIso)
    .is("sent_at", null)
    .is("error_at", null)
    .order("fire_at", { ascending: true })
    .limit(100)
    .returns<Job[]>();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!jobs || jobs.length === 0) {
    return Response.json({ ok: true, processed: 0 });
  }

  let okCount = 0;
  let failCount = 0;

  await Promise.all(
    jobs.map(async (job) => {
      try {
        const r = await sendPushToUser(job.user_id, job.payload);
        if (r.sent + r.removed > 0) {
          await sb
            .from("push_jobs")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", job.id);
          okCount++;
        } else {
          // 沒任何訂閱可送（使用者沒訂或全失效）→ 標記 error 避免重複掃
          await sb
            .from("push_jobs")
            .update({
              error_at: new Date().toISOString(),
              error_msg: "no subscriptions",
            })
            .eq("id", job.id);
          failCount++;
        }
      } catch (e) {
        await sb
          .from("push_jobs")
          .update({
            error_at: new Date().toISOString(),
            error_msg: e instanceof Error ? e.message : String(e),
          })
          .eq("id", job.id);
        failCount++;
      }
    })
  );

  return Response.json({ ok: true, processed: jobs.length, okCount, failCount });
}
