// 月度共修：本月全社群完成了 N 個 21 天圓 + 每日活動點。
// 跟個人頁的 21 天圓圈呼應：每個大金點 = 一位成員完成了一個 21 天連續靜心。
// 下方每日活動點：本月每一日一個小金點，亮度 = 那天有幾位不同成員坐過。

type DayActivity = {
  /** YYYY-MM-DD 台北日 key */
  day: string;
  /** 那天有多少位不同成員坐過 */
  members: number;
  /** 是否為今天 */
  isToday: boolean;
};

type Props = {
  /** 本月所有成員加總完成的圓數 */
  circles: number;
  /** "4月" / "April" 之類 */
  monthLabel: string;
  /** 月初到今天每一日的活動，依日期升冪 */
  days: DayActivity[];
};

// 把成員數對應到不透明度：0 → 很暗、1 → 中等、≥3 → 滿。讓畫面有層次。
function opacityFor(members: number): number {
  if (members === 0) return 0.08;
  if (members === 1) return 0.35;
  if (members === 2) return 0.6;
  if (members === 3) return 0.8;
  return 1;
}

export default function MonthlyCollage({ circles, monthLabel, days }: Props) {
  const totalActiveDays = days.filter((d) => d.members > 0).length;

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
          marginBottom: circles > 0 ? "1.25rem" : "1.5rem",
          fontWeight: 400,
        }}
      >
        {circles > 0
          ? `${monthLabel}，我們一起完成了 ${circles} 個圓`
          : `${monthLabel}，每一日都是一筆`}
      </p>

      {/* 已完成的圓（大金點） */}
      {circles > 0 && (
        <div
          className="flex flex-wrap justify-center"
          style={{
            gap: "0.55rem",
            maxWidth: "20rem",
            margin: "0 auto 1.5rem",
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

      {/* 每日活動點（小點，依當日成員數調亮度） */}
      <div
        className="flex flex-wrap justify-center"
        style={{ gap: "0.4rem", maxWidth: "18rem", margin: "0 auto" }}
        aria-label={`本月已過 ${days.length} 天，其中 ${totalActiveDays} 天有人靜心`}
      >
        {days.map((d) => (
          <span
            key={d.day}
            aria-hidden
            title={`${d.day} · ${d.members} 人`}
            style={{
              width: d.isToday ? 8 : 6,
              height: d.isToday ? 8 : 6,
              borderRadius: "50%",
              background: "#BEC23F",
              opacity: opacityFor(d.members),
              boxShadow:
                d.isToday && d.members > 0
                  ? "0 0 8px rgba(190,194,63,0.55)"
                  : "none",
              outline: d.isToday
                ? "1px solid rgba(190,194,63,0.4)"
                : "none",
              outlineOffset: 2,
              transition: "opacity 0.4s",
            }}
          />
        ))}
      </div>
    </section>
  );
}
