"use server";

// 給 client 端呼叫的 server action：把瀏覽器抓到的錯誤寫入 error_logs。
// 純薄殼，不做信任檢查（client 偽造影響有限，最多寫垃圾日誌）。

import { logError } from "@/lib/error-log";
import { createClient } from "@/lib/supabase-server";

export async function reportClientError(args: {
  message: string;
  source?: "react-error" | "client" | "other";
  route?: string;
  stack?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}) {
  // 嘗試帶上 user_id
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {}

  await logError({
    source: args.source ?? "client",
    message: args.message,
    route: args.route,
    stack: args.stack,
    userAgent: args.userAgent,
    userId,
    meta: args.meta,
  });

  return { ok: true as const };
}
