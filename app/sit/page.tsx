import SitFlow from "./SitFlow";
import { createClient } from "@/lib/supabase-server";
import { compute21Day } from "@/lib/streak";

export default async function SitPage() {
  // 昨天漏坐的話，選時間那一步要提醒「坐滿幾分鐘可以補上」。
  //
  // 只撈 60 天：makeup 只看「昨天有沒有坐」跟「連續是否還在進行中」，
  // 一個圓才 21 天，60 天的窗口綽綽有餘。這頁不顯示 circles，截斷不影響。
  // （原本撈全部紀錄，每次打開靜心頁就是一次全表掃描。）
  let makeupPending = false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const since = new Date(Date.now() - 60 * 86400_000).toISOString();
    const { data: sits } = await supabase
      .from("sits")
      .select("sat_at, duration_min")
      .eq("user_id", user.id)
      .gte("sat_at", since);
    makeupPending = compute21Day(sits ?? []).makeup === "pending";
  }

  return <SitFlow makeupPending={makeupPending} />;
}
