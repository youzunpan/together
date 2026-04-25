// 靜坐印記：類毛筆筆觸的弧／螺旋。
//   - 起始角度 = sat_at 的時刻在 24 小時環上的位置（0:00 在正上方，順時針）
//   - 60 分鐘 = 一整圈，超過後往中心螺旋（每多一圈半徑越來越小）
//   - 法向偏移後組成填充多邊形 → 兩端真的尖、不是描邊堆出來的視覺錯覺

import { computeBrushPaths } from "@/lib/sitMarkPath";

export default function SitMark({
  satAt,
  durationMin,
  size = 28,
  color = "#BEC23F",
}: {
  satAt: string;
  durationMin: number;
  size?: number;
  color?: string;
}) {
  const { inkPath, coreLine, seed } = computeBrushPaths(satAt, durationMin, 16, 16, 1);
  const filterId = `ink-${seed}-${durationMin}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ flexShrink: 0, overflow: "visible" }}
    >
      <defs>
        {/* 墨暈：模擬紙張纖維吸墨 */}
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="0.35" />
        </filter>
      </defs>

      <path d={inkPath} fill={color} opacity={0.22} filter={`url(#${filterId})`} />
      <path d={inkPath} fill={color} opacity={0.95} filter={`url(#${filterId})`} />
      <path
        d={coreLine}
        fill="none"
        stroke={color}
        strokeWidth={0.35}
        strokeLinecap="round"
        opacity={0.55}
      />
    </svg>
  );
}
