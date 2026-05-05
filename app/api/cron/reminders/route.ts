// 每日提醒分發。預期 cron 每小時跑一次（或至少在台北 8:00 / 21:00 跑）。
// 路由內檢查當前台北小時，只在 8 / 21 處理；其它小時 noop。
//
// 推送邏輯：
// A. Streak-saver（21:00）：streak ≥ 3 且今天還沒坐 → 推鼓勵訊息（無論 reminder_time）
// B. Personal rhythm：reminder_time = 'morning' (8:00) / 'evening' (21:00)
//    今天還沒坐就推一般訊息
// 在 21:00 時 A 與 B 重疊，A 優先。
// 同一日同一人不重複推（reminder_log 紀錄）。

import { NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToUser, type PushPayload } from "@/lib/web-push";
import { compute21Day } from "@/lib/streak";
import { taipeiDateKey, APP_TZ } from "@/lib/tz";
import { logError } from "@/lib/error-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // 當下台北小時
  const tpeNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: APP_TZ }),
  );
  const hour = tpeNow.getHours();
  const isMorning = hour === 8;
  const isEvening = hour === 21;
  if (!isMorning && !isEvening) {
    return Response.json({ ok: true, skipped: `hour=${hour}` });
  }

  const todayKey = taipeiDateKey(new Date());
  const todayStartIso = new Date(`${todayKey}T00:00:00+08:00`).toISOString();

  // 撈所有有 push 訂閱的成員
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("user_id");
  const subscribedIds = Array.from(new Set((subs ?? []).map((s) => s.user_id)));
  if (subscribedIds.length === 0) {
    return Response.json({ ok: true, hour, processed: 0, note: "no subscribers" });
  }

  const { data: profiles } = await sb
    .from("profiles")
    .select("id, display_name, reminder_time, role")
    .in("id", subscribedIds)
    .neq("role", "removed")
    .returns<{ id: string; display_name: string; reminder_time: "off" | "morning" | "evening"; role: string }[]>();
  if (!profiles) {
    return Response.json({ ok: true, hour, processed: 0 });
  }

  let pushed = 0;
  let skipped = 0;
  const reasons: Record<string, number> = {};
  const bump = (k: string) => { reasons[k] = (reasons[k] ?? 0) + 1; };

  for (const p of profiles) {
    try {
      // 1. 今天有沒有坐
      const { data: todaySits } = await sb
        .from("sits")
        .select("id")
        .eq("user_id", p.id)
        .gte("sat_at", todayStartIso)
        .limit(1);
      if (todaySits && todaySits.length > 0) {
        skipped++; bump("sat-already"); continue;
      }

      // 2. 今天是否已發過提醒
      const { data: log } = await sb
        .from("reminder_log")
        .select("user_id")
        .eq("user_id", p.id)
        .gte("sent_at", todayStartIso)
        .limit(1);
      if (log && log.length > 0) {
        skipped++; bump("already-sent"); continue;
      }

      // 3. 計算 streak（撈最近 60 天足夠判斷連續日）
      const sixtyAgo = new Date(Date.now() - 60 * 86400_000).toISOString();
      const { data: userSits } = await sb
        .from("sits")
        .select("sat_at")
        .eq("user_id", p.id)
        .gte("sat_at", sixtyAgo)
        .order("sat_at", { ascending: true });
      const { streak } = compute21Day(userSits ?? []);

      // 4. 決定要推什麼
      let payload: PushPayload | null = null;
      let kind = "";

      if (isEvening && streak >= 3) {
        // A. Streak-saver
        payload = {
          title: `連續坐了 ${streak} 天`,
          body: "今晚還沒開始 · 5 分鐘也可以",
          url: "/sit",
          tag: "reminder-streak",
        };
        kind = "streak-saver";
      } else if (isEvening && p.reminder_time === "evening") {
        // B-evening
        payload = {
          title: "今天還沒坐",
          body: "給自己 5 分鐘",
          url: "/sit",
          tag: "reminder-evening",
        };
        kind = "evening";
      } else if (isMorning && p.reminder_time === "morning") {
        // B-morning
        payload = {
          title: "新的一天",
          body: "想坐一下嗎？",
          url: "/sit",
          tag: "reminder-morning",
        };
        kind = "morning";
      }

      if (!payload) {
        skipped++; bump("no-rule-match"); continue;
      }

      // 5. 推 + 寫 log
      const res = await sendPushToUser(p.id, payload);
      if (res.sent > 0) {
        await sb.from("reminder_log").insert({ user_id: p.id, kind });
        pushed++;
      } else {
        skipped++; bump("push-failed");
      }
    } catch (e) {
      skipped++; bump("error");
      await logError({
        source: "api-route",
        route: "/api/cron/reminders",
        userId: p.id,
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
    }
  }

  return Response.json({ ok: true, hour, pushed, skipped, reasons });
}
