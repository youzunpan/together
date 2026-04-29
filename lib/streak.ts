// 21 天連續靜心計算
// 連續坐 21 天 = 完成一個圓。漏一天歸零、重新開始。
// 連續判定以台北時區的「日」為單位：那一天有任何一筆 sit 即算 ✓

import { taipeiDateKey } from "@/lib/tz";

export type StreakResult = {
  /** 已完成的圓數量 */
  circles: number;
  /** 當前進行中的圓累積到第幾天（0–20） */
  streak: number;
  /** 每個圓完成那天的台北日 key (YYYY-MM-DD)，依時間升冪 */
  completions: string[];
};

export function compute21Day(sits: { sat_at: string }[]): StreakResult {
  if (!sits.length) return { circles: 0, streak: 0, completions: [] };

  // 蒐集有坐的台北日 key（去重，升冪）
  const keys = new Set<string>();
  for (const s of sits) keys.add(taipeiDateKey(new Date(s.sat_at)));
  const sorted = [...keys].sort();

  let streak = 0;
  let prev: string | null = null;
  const completions: string[] = [];
  for (const day of sorted) {
    if (prev) {
      const da = new Date(`${prev}T00:00:00+08:00`).getTime();
      const db = new Date(`${day}T00:00:00+08:00`).getTime();
      const diff = Math.round((db - da) / 86400000);
      if (diff > 1) streak = 0; // 漏一天 → 歸零
    }
    streak += 1;
    if (streak === 21) {
      completions.push(day); // 當天完成一個圓
      streak = 0; // 重新開始
    }
    prev = day;
  }

  // 連續是否還活著：last day 必須是今天或昨天，否則中斷
  if (prev) {
    const todayKey = taipeiDateKey(new Date());
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestKey = taipeiDateKey(yest);
    if (prev !== todayKey && prev !== yestKey) streak = 0;
  }

  return { circles: completions.length, streak, completions };
}
