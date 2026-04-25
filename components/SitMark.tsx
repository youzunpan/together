// 靜坐印記：類毛筆筆觸的弧／螺旋。
//   - 起始角度 = sat_at 的時刻在 24 小時環上的位置（0:00 在正上方，順時針）
//   - 60 分鐘 = 一整圈，超過後往中心螺旋（每多一圈半徑越來越小）
//   - 用三層描邊堆疊出筆鋒的粗細變化、收尖的兩端與略不規則的曲線

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
  const d = new Date(satAt);
  const hourFraction = (d.getHours() + d.getMinutes() / 60) / 24; // 0..1
  // SVG 0° 在右側，順時針為正；要讓「0:00 在正上」需要 -90° 偏移
  const startDeg = hourFraction * 360 - 90;
  const startRad = (startDeg * Math.PI) / 180;

  // 60 分鐘 = 1 圈（2π）
  const turns = durationMin / 60;
  const sweepRad = turns * 2 * Math.PI;

  // 中心 16,16；外緣半徑 13、向內螺旋的最終半徑 3
  const cx = 16, cy = 16;
  const r0 = 13;
  const rMin = 3.5;

  // 每筆給點微小的「筆鋒抖動」，讓曲線不要太工程感
  const seed =
    ((satAt.charCodeAt(0) || 0) * 31 +
      (satAt.charCodeAt(satAt.length - 1) || 0) +
      durationMin) %
    97;

  // 取樣點：每 1 弧度 ~8 點，最少 40 點，保證最短的孤獨弧也夠平滑
  const sampleCount = Math.max(40, Math.floor(sweepRad * 8));

  type P = [number, number];
  const pts: P[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount; // 0..1
    const angle = startRad + sweepRad * t;

    // 半徑：第一圈停在 r0，超過第一圈後從 r0 線性收到 rMin
    let radius: number;
    if (turns <= 1) {
      radius = r0;
    } else {
      const turnProgress = t * turns; // 0..turns
      if (turnProgress <= 1) {
        radius = r0;
      } else {
        const beyond = (turnProgress - 1) / (turns - 1); // 0..1
        radius = r0 - (r0 - rMin) * beyond;
      }
    }

    // 微抖動：兩個不同頻率疊起讓它有機而非機械感，振幅約 0.15
    const wobble =
      0.10 * Math.sin(t * Math.PI * 6 + seed * 0.13) +
      0.06 * Math.sin(t * Math.PI * 13 + seed * 0.07);
    radius += wobble;

    pts.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }

  function pathStr(startTrim: number, endTrim: number) {
    const s = Math.floor(pts.length * startTrim);
    const e = Math.max(s + 1, Math.floor(pts.length * (1 - endTrim)));
    const sub = pts.slice(s, e + 1);
    if (sub.length < 2) return "";
    return (
      "M " +
      sub.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" L ")
    );
  }

  // 三層描邊：外圍最長最細最淡 → 內層最短最粗最實 = 仿筆鋒收尖
  const layers = [
    { trim: 0.00, width: 0.7, opacity: 0.35 },
    { trim: 0.05, width: 1.4, opacity: 0.70 },
    { trim: 0.12, width: 2.1, opacity: 1.00 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ flexShrink: 0, overflow: "visible" }}
    >
      {layers.map((l, i) => (
        <path
          key={i}
          d={pathStr(l.trim, l.trim)}
          fill="none"
          stroke={color}
          strokeWidth={l.width}
          opacity={l.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
