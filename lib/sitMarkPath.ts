// 從 sat_at + duration_min 算出毛筆筆觸的路徑資料。
// 由 components/SitMark 與 components/MonthlyCollage 共用。

export type BrushPaths = {
  /** 閉合的墨身多邊形 path d */
  inkPath: string;
  /** 中心線（墨芯）的 stroke path d */
  coreLine: string;
  /** 一個整數，給濾鏡 id 與抖動相位用 */
  seed: number;
};

export function computeBrushPaths(
  satAt: string,
  durationMin: number,
  cx = 16,
  cy = 16,
  scale = 1,
): BrushPaths {
  // 用台北時區的小時/分鐘決定起始角度
  const tpe = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(satAt));
  const hh = Number(tpe.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const mm = Number(tpe.find((p) => p.type === "minute")?.value ?? "0");
  const hourFraction = (hh + mm / 60) / 24;
  const startDeg = hourFraction * 360 - 90; // 0:00 在正上
  const startRad = (startDeg * Math.PI) / 180;

  const turns = durationMin / 60; // 60 分鐘 = 一圈
  const sweepRad = turns * 2 * Math.PI;

  const r0 = 13 * scale;
  const rMin = 3.5 * scale;

  const seed =
    ((satAt.charCodeAt(0) || 0) * 31 +
      (satAt.charCodeAt(satAt.length - 1) || 0) +
      durationMin) %
    97;

  const sampleCount = Math.max(40, Math.floor(sweepRad * 8));
  type P = [number, number];
  const pts: P[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const angle = startRad + sweepRad * t;

    // 半徑：第一圈停在 r0，超過後線性收到 rMin 形成螺旋
    let radius: number;
    if (turns <= 1) {
      radius = r0;
    } else {
      const turnProgress = t * turns;
      if (turnProgress <= 1) {
        radius = r0;
      } else {
        const beyond = (turnProgress - 1) / (turns - 1);
        radius = r0 - (r0 - rMin) * beyond;
      }
    }

    // 微抖動
    const wobble =
      (0.06 * Math.sin(t * Math.PI * 5 + seed * 0.13) +
        0.03 * Math.sin(t * Math.PI * 11 + seed * 0.07)) *
      scale;
    radius += wobble;

    pts.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }

  // 筆壓曲線
  const N = pts.length;
  const widths: number[] = new Array(N);
  const MAX_HALF = 1.55 * scale;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const startTaper = Math.min(1, t / 0.06);
    const endTaper = Math.min(1, (1 - t) / 0.04);
    let env = Math.sqrt(Math.min(startTaper, endTaper));
    env *= 1 + 0.15 * Math.sin(t * Math.PI * 3 + seed * 0.11);
    const radial =
      turns > 1
        ? 1 - 0.35 * Math.max(0, (t * turns - 1) / Math.max(0.001, turns - 1))
        : 1;
    widths[i] = MAX_HALF * env * radial;
  }

  // 法向偏移 → 左右兩條輪廓
  function side(sign: 1 | -1, reverse: boolean): string {
    const out: string[] = [];
    const range = reverse
      ? Array.from({ length: N }, (_, i) => N - 1 - i)
      : Array.from({ length: N }, (_, i) => i);
    for (const i of range) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(N - 1, i + 1)];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const w = widths[i];
      out.push(
        `${(pts[i][0] + sign * nx * w).toFixed(2)} ${(pts[i][1] + sign * ny * w).toFixed(2)}`,
      );
    }
    return out.join(" L ");
  }

  const inkPath = `M ${side(1, false)} L ${side(-1, true)} Z`;

  const coreStart = Math.floor(N * 0.04);
  const coreEnd = Math.max(coreStart + 1, Math.floor(N * 0.97));
  const coreLine =
    "M " +
    pts
      .slice(coreStart, coreEnd + 1)
      .map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
      .join(" L ");

  return { inkPath, coreLine, seed };
}
