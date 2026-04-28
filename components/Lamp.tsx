// 一盞燈：根據「上次坐」到現在的時數，分檔調整亮度。
// 使用品牌的金色圓點語彙（與啟動畫面、live sitters 一致）。

type Level = {
  opacity: number;
  pulse: boolean;
  label: string;
};

function levelFor(hoursSince: number | null): Level {
  if (hoursSince === null) return { opacity: 0.12, pulse: false, label: "尚未坐過" };
  if (hoursSince < 24)     return { opacity: 1.0,  pulse: true,  label: "今天" };
  if (hoursSince < 48)     return { opacity: 0.65, pulse: false, label: "昨天" };
  if (hoursSince < 72)     return { opacity: 0.4,  pulse: false, label: "兩天前" };
  if (hoursSince < 24 * 7) return { opacity: 0.22, pulse: false, label: `${Math.floor(hoursSince / 24)} 天前` };
  return { opacity: 0.12, pulse: false, label: "很久沒回來了" };
}

export default function Lamp({ lastSatAt }: { lastSatAt: string | null }) {
  const hoursSince = lastSatAt
    ? (Date.now() - new Date(lastSatAt).getTime()) / 3600000
    : null;
  const { opacity, pulse, label } = levelFor(hoursSince);

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#BEC23F",
          opacity,
          boxShadow: pulse ? "0 0 24px rgba(190,194,63,0.45)" : "none",
          animation: pulse ? "lampBreathe 6s ease-in-out infinite" : "none",
          transition: "opacity 0.6s",
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.18em",
          color: "rgba(237,236,234,0.4)",
          textTransform: "uppercase",
        }}
      >
        上次坐 · {label}
      </p>
      <style>{`
        @keyframes lampBreathe {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 18px rgba(190,194,63,0.35); }
          50%      { transform: scale(1.15); box-shadow: 0 0 28px rgba(190,194,63,0.55); }
        }
      `}</style>
    </div>
  );
}
