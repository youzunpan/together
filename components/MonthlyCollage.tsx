// 月度共修：本月全社群完成了 N 個 21 天圓。
// 跟個人頁的 21 天圓圈呼應：每個小金點 = 一位成員完成了一個 21 天連續靜心。

type Props = {
  /** 本月所有成員加總完成的圓數 */
  circles: number;
  /** "4月" / "April" 之類 */
  monthLabel: string;
};

export default function MonthlyCollage({ circles, monthLabel }: Props) {
  return (
    <section
      className="my-6"
      style={{
        background: "#1a1b18",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "var(--r-card)",
        padding: "1.75rem 1.25rem 1.5rem",
      }}
    >
      <p
        className="text-center"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          color: "rgba(237,236,234,0.3)",
          marginBottom: "0.75rem",
        }}
      >
        THIS MONTH · TOGETHER
      </p>

      <p
        className="text-center"
        style={{
          fontFamily: "var(--font-noto-serif)",
          fontSize: "1.1rem",
          color: "#edecea",
          lineHeight: 1.5,
          marginBottom: "1.5rem",
          fontWeight: 400,
        }}
      >
        {circles > 0
          ? `${monthLabel}，我們一起完成了 ${circles} 個圓`
          : `${monthLabel}，第一個圓還沒完成`}
      </p>

      {circles > 0 && (
        <div
          className="flex flex-wrap justify-center"
          style={{
            gap: "0.55rem",
            maxWidth: "20rem",
            margin: "0 auto",
            paddingBottom: "0.25rem",
          }}
        >
          {Array.from({ length: circles }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#BEC23F",
                boxShadow: "0 0 10px rgba(190,194,63,0.45)",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
