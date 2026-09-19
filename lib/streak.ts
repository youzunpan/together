// 21 天連續靜心計算
// 連續坐 21 天 = 完成一個圓。
// 連續判定以台北時區的「日」為單位：那一天有任何一筆 sit 即算 ✓
//
// 補坐：漏了一天不會馬上斷。隔天只要有一筆坐滿 MAKEUP_MIN 分鐘的 sit，
// 漏掉的那天就算補上，連續接得回來。
//   - 只能補「前一天」—— 連漏兩天就斷
//   - 要先有連續在進行（streak > 0）才有東西可補；剛歸零或剛完成一個圓後的空檔不補
//   - 補坐的那筆 sit 本身也照常算當天
// 社群圓（/feed）不適用補坐，呼叫時傳 { allowMakeup: false }。

import { taipeiDateKey } from "@/lib/tz";

/** 隔天坐滿幾分鐘可以補上前一天 */
export const MAKEUP_MIN = 6;

export type StreakResult = {
  /** 已完成的圓數量 */
  circles: number;
  /** 當前進行中的圓累積到第幾天（0–20） */
  streak: number;
  /** 每個圓完成那天的台北日 key (YYYY-MM-DD)，依時間升冪 */
  completions: string[];
  /**
   * 昨天的補坐狀態（給提醒用）
   * - "pending"：昨天沒坐、今天還沒坐滿 MAKEUP_MIN 分鐘 —— 今天坐滿就能補上
   * - "done"：昨天沒坐，但今天已經坐滿補上了
   * - null：其他情況（昨天有坐、或連續已經斷了沒得補）
   */
  makeup: "pending" | "done" | null;
};

function nextDayKey(key: string): string {
  // 用中午避開任何日界線邊緣問題
  return taipeiDateKey(new Date(new Date(`${key}T12:00:00+08:00`).getTime() + 86400000));
}

export function compute21Day(
  sits: { sat_at: string; duration_min?: number | null }[],
  { allowMakeup = true }: { allowMakeup?: boolean } = {},
): StreakResult {
  if (!sits.length) return { circles: 0, streak: 0, completions: [], makeup: null };

  const satDays = new Set<string>();       // 有坐的日
  const qualifiedDays = new Set<string>(); // 有一筆 ≥ MAKEUP_MIN 分鐘的日（能替前一天補坐）
  for (const s of sits) {
    const k = taipeiDateKey(new Date(s.sat_at));
    satDays.add(k);
    if ((s.duration_min ?? 0) >= MAKEUP_MIN) qualifiedDays.add(k);
  }

  const todayKey = taipeiDateKey(new Date());
  const firstKey = [...satDays].sort()[0];

  let streak = 0;
  const completions: string[] = [];
  let makeup: StreakResult["makeup"] = null;

  // 一天一天走到今天（不能只走有坐的日子，因為要判斷漏掉的那天補不補得回來）
  for (let d = firstKey; d <= todayKey; d = nextDayKey(d)) {
    if (satDays.has(d)) {
      streak += 1;
    } else if (d === todayKey) {
      break; // 今天還沒坐，不算斷
    } else {
      const next = nextDayKey(d);
      const canMakeup = allowMakeup && streak > 0;
      if (canMakeup && qualifiedDays.has(next)) {
        streak += 1; // 隔天坐滿了，補上這天
        if (next === todayKey) makeup = "done";
      } else if (canMakeup && next === todayKey) {
        makeup = "pending"; // 昨天沒坐，今天還有機會補 —— 連續先保留
        break;
      } else {
        streak = 0; // 補不回來 → 歸零
        continue;
      }
    }
    if (streak === 21) {
      completions.push(d); // 當天完成一個圓
      streak = 0; // 重新開始
    }
  }

  return { circles: completions.length, streak, completions, makeup };
}
