// 社群版 21 天圓圈：跟個人頁 TwentyOneCircle 視覺呼應，但邏輯與微調不同。
// 「社群連續日」= 連續 N 天每日有 ≥ 1 位成員坐。漏一天 → 歸零。每滿 21 天 → +1 共修圓。
// 微調：尺寸略小（150 vs 200），弧色偏暖金（#D9C76B），加上「今天」指示器。

type Props = {
  /** 已完成的共修圓數量 */
  circles: number;
  /** 當前連續天數（0–20） */
  streak: number;
  /** 今天有幾位不同成員坐過 */
  todayMembers: number;
};

const SIZE = 150;
const STROKE = 2.5;
const PADDING = 8;
const R = (SIZE - STROKE) / 2 - PADDING;
const C = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const COLOR = "#D9C76B"; // 比個人圓的 #BEC23F 偏暖一點

export default function CommunityCircle({ circles, streak, todayMembers }: Props) {
  const progress = Math.min(streak, 21) / 21;
  const dashLen = CIRCUMFERENCE * progress;
  const todayLit = todayMembers > 0;

  return (
    <section
      className="my-6"
      style={{
        background: "#1a1b18",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "var(--r-card)",
        padding: "1.5rem 1rem 1.25rem",
      }}
    >
      <p
        className="text-center"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          color: "rgba(237,236,234,0.3)",
          marginBottom: "1rem",
        }}
      >
        同在 · TOGETHER
      </p>

      <div className="flex flex-col items-center">
        {/* 圓 + 中央文字 */}
        <div style={{ position: "relative", width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={C}
              cy={C}
              r={R}
              fill="none"
              stroke="rgba(237,236,234,0.06)"
              strokeWidth={STROKE}
            />
            {streak > 0 && (
              <circle
                cx={C}
                cy={C}
                r={R}
                fill="none"
                stroke={COLOR}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${dashLen} ${CIRCUMFERENCE}`}
                style={{ transition: "stroke-dasharray 0.6s ease-out" }}
              />
            )}
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-noto-serif)",
                fontSize: "2.25rem",
                color: "#edecea",
                lineHeight: 1,
                fontWeight: 400,
              }}
            >
              {streak}
            </p>
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: "0.55rem",
                letterSpacing: "0.2em",
                color: "rgba(237,236,234,0.35)",
                marginTop: "0.4rem",
              }}
            >
              / 21 DAYS
            </p>
          </div>
        </div>

        {/* 已完成的共修圓 */}
        {circles > 0 && (
          <div
            className="flex flex-wrap justify-center"
            style={{ gap: "0.4rem", maxWidth: "12rem", marginTop: "1rem" }}
          >
            {Array.from({ length: circles }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: COLOR,
                  boxShadow: `0 0 8px ${COLOR}55`,
                }}
              />
            ))}
          </div>
        )}

        {/* 今天指示器 */}
        <div
          className="flex items-center"
          style={{ gap: "0.5rem", marginTop: "1rem" }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: COLOR,
              opacity: todayLit ? 1 : 0.15,
              boxShadow: todayLit ? `0 0 6px ${COLOR}aa` : "none",
              animation: todayLit
                ? "communityTodayPulse 6s ease-in-out infinite"
                : "none",
            }}
          />
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              color: "rgba(237,236,234,0.4)",
            }}
          >
            {todayLit ? `今天 ${todayMembers} 位同伴` : "今天還沒人坐"}
          </p>
        </div>

        <style>{`
          @keyframes communityTodayPulse {
            0%, 100% { opacity: 0.45; transform: scale(1); }
            50%      { opacity: 1;    transform: scale(1.4); }
          }
        `}</style>
      </div>
    </section>
  );
}
