// 時區工具：全站統一使用 Asia/Taipei，避免伺服器/瀏覽器時區差異造成的日期錯亂。

export const APP_TZ = "Asia/Taipei";

// 取得 Taipei 牆上時間的「年月日時分」零件
function taipeiParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return parts as { year: string; month: string; day: string; hour: string; minute: string };
}

// "YYYY-MM-DDTHH:mm" — 給 <input type="datetime-local"> 的預設值，台北牆上時間
export function taipeiDatetimeLocal(d: Date = new Date()): string {
  const p = taipeiParts(d);
  const hour = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
}

// "YYYY-MM-DD" — 台北日期 key
export function taipeiDateKey(d: Date = new Date()): string {
  const p = taipeiParts(d);
  return `${p.year}-${p.month}-${p.day}`;
}

// 台北今日午夜 00:00 對應的 UTC ISO 字串（給 sat_at >= ... 的查詢用）
export function taipeiTodayStartISO(): string {
  // 取現在的台北日期，再組成「該日 00:00 +08:00」的 ISO
  const key = taipeiDateKey(new Date());
  return new Date(`${key}T00:00:00+08:00`).toISOString();
}

// 台北本月 1 號 00:00 對應的 UTC ISO（給 sat_at >= ... 查詢用）
export function taipeiMonthStartISO(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date())) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return new Date(`${parts.year}-${parts.month}-01T00:00:00+08:00`).toISOString();
}

// 台北本月的中文月份標籤（如「四月」）
export function taipeiMonthLabel(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: APP_TZ,
    month: "long",
  }).format(d);
}

// 兩個日期在「台北日」上的差距（整數天），a 較新時為正
export function taipeiDiffDays(a: Date, b: Date): number {
  const ka = taipeiDateKey(a);
  const kb = taipeiDateKey(b);
  // 用 +08:00 還原到 UTC 後直接相減
  const da = new Date(`${ka}T00:00:00+08:00`).getTime();
  const db = new Date(`${kb}T00:00:00+08:00`).getTime();
  return Math.round((da - db) / 86400000);
}
