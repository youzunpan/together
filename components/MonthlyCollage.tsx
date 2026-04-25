// 月度共修圖：把這個月所有人的 SitMark 疊在同一個圓心上。
// 每個人的時刻決定起筆角度、時長決定圈數，所以「大家都晚上 8 點坐」會在
// 同一條方向上累積筆觸；越熱門的時段墨色越濃。

import { computeBrushPaths } from "@/lib/sitMarkPath";

export type CollageSit = {
  sat_at: string;
  duration_min: number;
};

export default function MonthlyCollage({
  sits,
  monthLabel,
  size = 320,
}: {
  sits: CollageSit[];
  monthLabel: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  // 每筆印記的縮放：r0 = 13 * scale；scale=4 → r0=52，直徑 ~104，落在 320 畫布內
  const SCALE = (size / 320) * 4;
  // 單筆透明度：堆疊出密度差異。人多時調更低、人少時調高
  const baseOpacity = sits.length > 80 ? 0.10 : sits.length > 30 ? 0.14 : 0.20;

  const totalMin = sits.reduce((s, x) => s + x.duration_min, 0);
  const uniqueDays = new Set(
    sits.map((s) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(s.sat_at)),
    ),
  ).size;

  return (
    <section
      style={{
        background: "#1a1b18",
        border: "1px solid rgba(190,194,63,0.15)",
        borderRadius: "var(--r-card)",
        padding: "1.25rem 1rem 1rem",
        marginBottom: "1.25rem",
      }}
    >
      <p
        className="text-center"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          color: "rgba(237,236,234,0.3)",
          marginBottom: "0.5rem",
        }}
      >
        THIS MONTH · TOGETHER
      </p>

      <p
        className="text-center reflection-text"
        style={{
          fontSize: "0.95rem",
          color: "#edecea",
          marginBottom: "1rem",
        }}
      >
        {monthLabel}，我們一起畫了這幅畫
      </p>

      <div className="flex justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: "block" }}
        >
          <defs>
            {/* 共用一個墨暈濾鏡（per-mark 濾鏡會非常吃效能） */}
            <filter id="collage-ink" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="1.2" />
            </filter>
          </defs>

          {/* 中心定位點（淡淡的，提示「同一圓心」） */}
          <circle
            cx={cx}
            cy={cy}
            r={1.5}
            fill="#BEC23F"
            opacity={0.35}
          />

          <g filter="url(#collage-ink)">
            {sits.map((sit, i) => {
              const { inkPath } = computeBrushPaths(
                sit.sat_at,
                sit.duration_min,
                cx,
                cy,
                SCALE,
              );
              return (
                <path
                  key={i}
                  d={inkPath}
                  fill="#BEC23F"
                  opacity={baseOpacity}
                />
              );
            })}
          </g>
        </svg>
      </div>

      <div
        className="flex items-center justify-center gap-6 mt-3"
        style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", color: "rgba(237,236,234,0.4)", letterSpacing: "0.08em" }}
      >
        <span>{sits.length} SITS</span>
        <span style={{ color: "#BEC23F" }}>{totalMin} MIN</span>
        <span>{uniqueDays} DAYS</span>
      </div>
    </section>
  );
}
