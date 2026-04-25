// 靜坐印記：每次 sit 生成一個獨特的弧線符號。
//   弧的起始角度 = sat_at 的時刻（在 24 小時環上的位置）
//   弧的長度    = duration（時間越長弧越長）
//   每筆視覺不同但同個家族，掃過去能看出節奏。

export default function SitMark({
  satAt,
  durationMin,
  size = 28,
  color = "#BEC23F",
  ringOpacity = 0.18,
}: {
  satAt: string;
  durationMin: number;
  size?: number;
  color?: string;
  ringOpacity?: number;
}) {
  const d = new Date(satAt);
  const hourFraction = (d.getHours() + d.getMinutes() / 60) / 24; // 0..1
  // 把 0:00 放在正上方，順時針旋轉。SVG 0° 在右側、順時針為 +；換算 -90 偏移。
  const startDeg = hourFraction * 360 - 90;

  // duration → 弧長（度數）。5 分鐘 = 18°、30 分鐘 = 約 100°、60 分鐘 = 約 200°、90+ 分鐘 ≈ 300°
  const sweepDeg = Math.min(330, Math.max(15, durationMin * 3.5));

  const cx = 16, cy = 16, r = 12;
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = ((startDeg + sweepDeg) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = sweepDeg > 180 ? 1 : 0;

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      {/* 底圈：每枚印記共享的底，視覺一致感 */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="0.6"
        opacity={ringOpacity}
      />
      {/* 主弧：時刻 + 時長 */}
      <path
        d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* 起始小點 */}
      <circle cx={x1} cy={y1} r="1.4" fill={color} />
    </svg>
  );
}
