// 社群圓的數字（全體共用，不分使用者）。
//
// 這組數字原本寫在 /feed 裡：每次有人開 feed 就把一整年的 sits 全撈回來重算一次。
// 但它對每個人都是同一個答案，重算純粹是浪費 —— 這是整個 app 最大的 Disk IO 來源。
// 改成用 unstable_cache 快取，有人記錄靜坐時再用 revalidateTag 打掉。
//
// 用 service role 而不是使用者的 client：
//   1. unstable_cache 裡不能用依賴 cookie 的 request-scoped client
//   2. 這是全站共用的聚合數字，本來就會顯示給所有成員看，不涉及個人資料

import { unstable_cache } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { taipeiDateKey } from "@/lib/tz";
import { compute21Day } from "@/lib/streak";

/** 有人記錄靜坐時用這個 tag 讓快取失效 */
export const COMMUNITY_TAG = "community-stats";

export type CommunityStats = {
  circles: number;
  streak: number;
  todayMembers: number;
};

async function loadCommunityStats(): Promise<CommunityStats> {
  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // 一年的窗口對社群連續日已經足夠（21 天一個圓）
  const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString();
  const { data } = await sb
    .from("sits")
    .select("user_id, sat_at")
    .gte("sat_at", oneYearAgo)
    .order("sat_at", { ascending: true });

  const dayMembers = new Map<string, Set<string>>();
  for (const s of (data ?? []) as { user_id: string; sat_at: string }[]) {
    const k = taipeiDateKey(new Date(s.sat_at));
    const set = dayMembers.get(k) ?? new Set<string>();
    set.add(s.user_id);
    dayMembers.set(k, set);
  }

  // 社群圓看的是「那天有沒有人坐」，不分是誰
  const virtualSits = [...dayMembers.keys()]
    .sort()
    .map((k) => ({ sat_at: `${k}T00:00:00+08:00` }));

  // 補坐是個人規則，社群圓不適用
  const { circles, streak } = compute21Day(virtualSits, { allowMakeup: false });

  return {
    circles,
    streak,
    todayMembers: dayMembers.get(taipeiDateKey(new Date()))?.size ?? 0,
  };
}

export const getCommunityStats = unstable_cache(
  loadCommunityStats,
  ["community-stats"],
  {
    tags: [COMMUNITY_TAG],
    // 保險用的上限。正常情況下是靠 recordSit 的 revalidateTag 更新，
    // 這個 300 秒只是防止 tag 沒被打到時數字卡住。
    revalidate: 300,
  },
);
