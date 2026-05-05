// 給 admin 用的「一鍵 dump」：把 profiles + sits + applications 拋出 JSON。
// 用法：登入 admin → 在瀏覽器開 /api/admin/export → 自動下載 backup.json
//
// 這只是補強用的、人工跑的快照。Supabase Dashboard 的自動 backup（Pro PITR）
// 才是主要備援；這個 endpoint 是「我想存一份在自己電腦上」的安心方案。

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const [
    profilesRes,
    sitsRes,
    callsRes,
    callJoinsRes,
    appsRes,
    announcementsRes,
  ] = await Promise.all([
    sb.from("profiles").select("*"),
    sb.from("sits").select("*"),
    sb.from("sit_calls").select("*"),
    sb.from("sit_call_joins").select("*"),
    // applications 不含密碼欄（敏感、且解密後也沒意義因為已 hash 在 auth.users）
    sb.from("applications").select("id, email, display_name, note, status, created_at, reviewed_by, reviewed_at"),
    sb.from("announcements").select("*"),
  ]);

  const dump = {
    exported_at: new Date().toISOString(),
    schema_version: "0009",
    counts: {
      profiles: profilesRes.data?.length ?? 0,
      sits: sitsRes.data?.length ?? 0,
      sit_calls: callsRes.data?.length ?? 0,
      sit_call_joins: callJoinsRes.data?.length ?? 0,
      applications: appsRes.data?.length ?? 0,
      announcements: announcementsRes.data?.length ?? 0,
    },
    profiles: profilesRes.data ?? [],
    sits: sitsRes.data ?? [],
    sit_calls: callsRes.data ?? [],
    sit_call_joins: callJoinsRes.data ?? [],
    applications: appsRes.data ?? [],
    announcements: announcementsRes.data ?? [],
  };

  const filename = `gongxiu-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(dump, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
