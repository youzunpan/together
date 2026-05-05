// 簡版錯誤追蹤：寫入 error_logs 表
// 用 service role 繞過 RLS。寫入失敗時 console 留痕，不會抱錯到呼叫端。

import "server-only";
import { createClient as createServiceClient } from "@supabase/supabase-js";

type Source =
  | "server-action"
  | "react-error"
  | "client"
  | "api-route"
  | "other";

export type LogErrorArgs = {
  source: Source;
  message: string;
  route?: string | null;
  userId?: string | null;
  userAgent?: string | null;
  stack?: string | null;
  meta?: Record<string, unknown> | null;
};

const MSG_MAX = 4000;
const STACK_MAX = 8000;

export async function logError(args: LogErrorArgs): Promise<void> {
  try {
    const sb = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    await sb.from("error_logs").insert({
      source: args.source,
      route: args.route ?? null,
      user_id: args.userId ?? null,
      user_agent: args.userAgent ?? null,
      message: args.message.slice(0, MSG_MAX),
      stack: args.stack ? args.stack.slice(0, STACK_MAX) : null,
      meta: args.meta ?? null,
    });
  } catch (e) {
    console.error("[error-log] failed to write:", e);
  }
}
