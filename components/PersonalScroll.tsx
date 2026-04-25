// 個人卷軸：把過去 30 天每一天的 SitMark 排成一條水平時光帶。
// 從左到右 = 舊到新；空白天保留為淡淡的空格，讓「坐 / 沒坐」的節奏自然浮現。

import { computeBrushPaths } from "@/lib/sitMarkPath";
import { taipeiDateKey } from "@/lib/tz";

type Sit = { sat_at: string; duration_min: number };

const DAYS = 30;
const CELL = 30;

export default function PersonalScroll({ sits }: { sits: Sit[] }) {
  // 建 30 個空 bucket（過去 29 天 + 今天）
  const todayKey = taipeiDateKey(new Date());
  const buckets: { key: string; label: string; isMonthStart: boolean; entries: Sit[] }[] = [];
  const today = new Date(`${todayKey}T00:00:00+08:00`);
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = taipeiDateKey(d);
    const parts = key.split("-");
    const isMonthStart = parts[2] === "01";
    const label = `${Number(parts[1])}/${Number(parts[2])}`;
    buckets.push({ key, label, isMonthStart, entries: [] });
  }

  // 把 sits 配進 bucket
  const map = new Map(buckets.map((b) => [b.key, b]));
  for (const s of sits) {
    const k = taipeiDateKey(new Date(s.sat_at));
    map.get(k)?.entries.push(s);
  }

  const totalSits = buckets.reduce((sum, b) => sum + b.entries.length, 0);
  if (totalSits === 0) return null;

  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            color: "rgba(237,236,234,0.3)",
          }}
        >
          LAST 30 DAYS
        </p>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.55rem",
            letterSpacing: "0.1em",
            color: "rgba(237,236,234,0.2)",
          }}
        >
          ← 舊　·　新 →
        </p>
      </div>

      {/* 水平卷軸 */}
      <div
        className="hide-scrollbar"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "0.25rem",
          // 預設 scroll 至最右（最新）—— 透過 dir/scroll-behavior 在 client 不便，
          // 但因為時間從左到右是「舊→新」，使用者進來看到的是舊的、滑到底是今天，
          // 視覺隱喻：往未來（右）翻動卷軸
        }}
      >
        <div className="flex items-end" style={{ gap: 2, paddingRight: 4 }}>
          {buckets.map((b) => (
            <DayCell key={b.key} bucket={b} isToday={b.key === todayKey} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DayCell({
  bucket,
  isToday,
}: {
  bucket: { key: string; label: string; isMonthStart: boolean; entries: Sit[] };
  isToday: boolean;
}) {
  const hasSit = bucket.entries.length > 0;
  // 跳到該日的 session（me/page.tsx 為當日第一筆加了 id="day-..."）
  const href = hasSit ? `#day-${bucket.key}` : undefined;

  const cell = (
    <div
      title={`${bucket.label} · ${hasSit ? `${bucket.entries.length} 次 · ${bucket.entries.reduce((s, e) => s + e.duration_min, 0)} 分` : "未坐"}`}
      style={{
        width: CELL,
        height: CELL,
        flexShrink: 0,
        position: "relative",
        background: hasSit ? "transparent" : "rgba(255,255,255,0.025)",
        border: isToday ? "1px solid rgba(190,194,63,0.4)" : "none",
        borderRadius: 3,
      }}
    >
      {hasSit && (
        <svg
          width={CELL}
          height={CELL}
          viewBox="0 0 32 32"
          style={{ display: "block", overflow: "visible" }}
        >
          {bucket.entries.map((sit, i) => {
            const { inkPath } = computeBrushPaths(sit.sat_at, sit.duration_min, 16, 16, 1);
            const opacity = bucket.entries.length > 1 ? 0.7 : 0.95;
            return <path key={i} d={inkPath} fill="#BEC23F" opacity={opacity} />;
          })}
        </svg>
      )}
      {/* 月份開始的小標 */}
      {bucket.isMonthStart && (
        <span
          style={{
            position: "absolute",
            bottom: -14,
            left: 0,
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.5rem",
            letterSpacing: "0.05em",
            color: "rgba(237,236,234,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          {bucket.label.split("/")[0]}月
        </span>
      )}
    </div>
  );

  return href ? (
    <a href={href} style={{ textDecoration: "none" }}>
      {cell}
    </a>
  ) : (
    cell
  );
}
