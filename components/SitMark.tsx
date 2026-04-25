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
  // 用台北時區的小時分鐘決定起始角度，避免伺服器/瀏覽器時區差異
  const tpe = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(satAt));
  const hh = Number(tpe.find(p => p.type === "hour")?.value ?? "0") % 24;
  const mm = Number(tpe.find(p => p.type === "minute")?.value ?? "0");
  const hourFraction = (hh + mm / 60) / 24; // 0..1
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

    // 微抖動：很輕微，避免破壞流暢感
    const wobble =
      0.06 * Math.sin(t * Math.PI * 5 + seed * 0.13) +
      0.03 * Math.sin(t * Math.PI * 11 + seed * 0.07);
    radius += wobble;

    pts.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }

  // ── 筆壓曲線：兩端收尖、中段帶輕微壓力起伏 ──────────
  // 起筆很尖（前 6%）、收筆更尖（後 4%）；中段以 sin 拋物線當作主壓，疊一個低頻擾動
  const N = pts.length;
  const widths: number[] = new Array(N);
  const MAX_HALF = 1.55; // 最粗時的半寬（單位是 viewBox 32 的座標）
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const startTaper = Math.min(1, t / 0.06);
    const endTaper   = Math.min(1, (1 - t) / 0.04);
    // 用 sqrt 讓尖端更利、入鋒/收鋒更快達到主體粗細
    let env = Math.sqrt(Math.min(startTaper, endTaper));
    // 主體中段的壓力起伏（±15%）
    env *= 1 + 0.15 * Math.sin(t * Math.PI * 3 + seed * 0.11);
    // 整體厚度也隨螺旋向內微微減少（畫到中央時筆觸自然變細）
    const radial = turns > 1 ? 1 - 0.35 * Math.max(0, (t * turns - 1) / Math.max(0.001, turns - 1)) : 1;
    widths[i] = MAX_HALF * env * radial;
  }

  // 沿著每個取樣點計算法向量，左右偏移成兩條線，組成填充多邊形
  function offsetSide(sign: 1 | -1): string {
    const out: string[] = [];
    for (let i = 0; i < N; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(N - 1, i + 1)];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const w = widths[i];
      const x = pts[i][0] + sign * nx * w;
      const y = pts[i][1] + sign * ny * w;
      out.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return out.join(" L ");
  }

  // 構成閉合路徑：正向走左側 → 反向走右側 → Z
  const leftFwd = offsetSide(1);
  const rightRev = (() => {
    const out: string[] = [];
    for (let i = N - 1; i >= 0; i--) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(N - 1, i + 1)];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const w = widths[i];
      const x = pts[i][0] - nx * w;
      const y = pts[i][1] - ny * w;
      out.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return out.join(" L ");
  })();
  const inkPath = `M ${leftFwd} L ${rightRev} Z`;

  // 中心線（最深的墨）：稍微短一點，模擬墨芯比墨暈短
  const coreStart = Math.floor(N * 0.04);
  const coreEnd = Math.max(coreStart + 1, Math.floor(N * 0.97));
  const coreLine =
    "M " +
    pts
      .slice(coreStart, coreEnd + 1)
      .map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
      .join(" L ");

  // 唯一 id 給濾鏡（同頁多個 SitMark 不會撞）
  const filterId = `ink-${seed}-${durationMin}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ flexShrink: 0, overflow: "visible" }}
    >
      <defs>
        {/* 墨暈：輕微擾動 + 模糊，模擬紙張纖維吸墨 */}
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="0.35" />
        </filter>
      </defs>

      {/* 外層墨暈：略寬、低不透明，模擬紙上化開的邊緣 */}
      <path
        d={inkPath}
        fill={color}
        opacity={0.22}
        filter={`url(#${filterId})`}
        transform="translate(0,0)"
      />
      {/* 主體墨身：實心填充 */}
      <path d={inkPath} fill={color} opacity={0.95} filter={`url(#${filterId})`} />
      {/* 墨芯：最深的中心線描邊，疊一點點增加層次 */}
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
