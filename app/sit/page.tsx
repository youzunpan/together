import SitFlow from "./SitFlow";
import { createClient } from "@/lib/supabase-server";
import { compute21Day } from "@/lib/streak";

export default async function SitPage() {
  // 昨天漏坐的話，選時間那一步要提醒「坐滿幾分鐘可以補上」。
  // 跟 /me 一樣撈全部紀錄算，兩邊判斷才會一致。
  let makeupPending = false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: sits } = await supabase
      .from("sits")
      .select("sat_at, duration_min")
      .eq("user_id", user.id);
    makeupPending = compute21Day(sits ?? []).makeup === "pending";
  }

  return <SitFlow makeupPending={makeupPending} />;
}
