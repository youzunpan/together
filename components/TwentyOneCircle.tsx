// 21 天連續靜心圓圈
// 連續坐 21 天 = 完成一個圓。漏一天隔天可以補坐（規則見 lib/streak.ts），
// 連漏兩天才歸零。
// 連續判定以台北時區的「日」為單位：那一天有任何一筆 sit 紀錄就算 ✓

import Link from "next/link";
import { MAKEUP_MIN, type StreakResult } from "@/lib/streak";

type Props = {
  /** 已完成的圓數量 */
  circles: number;
  /** 當前進行中的圓累積到第幾天（0–20） */
  streak: number;
  /** 昨天的補坐狀態。只有看自己的頁面才傳，別人的頁面不顯示提示 */
  makeup?: StreakResult["makeup"];
};

const SIZE = 200;
const STROKE = 3;
const PADDING = 10;
const R = (SIZE - STROKE) / 2 - PADDING;
const C = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function TwentyOneCircle({ circles, streak, makeup = null }: Props) {
  const progress = Math.min(streak, 21) / 21;
  const dashLen = CIRCUMFERENCE * progress;

  return (
    <div className="flex flex-col items-center my-8">
      {/* 標題 */}
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          color: "rgba(237,236,234,0.3)",
          marginBottom: "1.25rem",
        }}
      >
        21 天 · CIRCLE
      </p>

      {/* 圓 + 中央文字 */}
      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* 底環 */}
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke="rgba(237,236,234,0.06)"
            strokeWidth={STROKE}
          />
          {/* 進度弧 */}
          {streak > 0 && (
            <circle
              cx={C}
              cy={C}
              r={R}
              fill="none"
              stroke="#BEC23F"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${dashLen} ${CIRCUMFERENCE}`}
              style={{ transition: "stroke-dasharray 0.6s ease-out" }}
            />
          )}
        </svg>

        {/* 中央：當前進度 */}
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
              fontSize: "3rem",
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
              fontSize: "0.6rem",
              letterSpacing: "0.2em",
              color: "rgba(237,236,234,0.35)",
              marginTop: "0.5rem",
            }}
          >
            / 21 DAYS
          </p>
        </div>
      </div>

      {/* 補坐提示：昨天漏了、今天還能補 */}
      {makeup === "pending" && (
        <Link
          href="/sit"
          style={{
            marginTop: "1.25rem",
            display: "block",
            maxWidth: "17rem",
            padding: "0.8rem 1rem",
            border: "1px solid rgba(190,194,63,0.35)",
            borderRadius: "var(--r-cell)",
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          <span style={{ display: "block", fontSize: "0.85rem", color: "#edecea", lineHeight: 1.7 }}>
            昨天沒坐到。
            <br />
            今天坐滿 {MAKEUP_MIN} 分鐘，就能把昨天補上。
          </span>
          <span
            style={{
              display: "block",
              marginTop: "0.45rem",
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              color: "rgba(190,194,63,0.8)",
            }}
          >
            去坐 →
          </span>
        </Link>
      )}
      {makeup === "done" && (
        <p
          style={{
            marginTop: "1rem",
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            color: "rgba(190,194,63,0.7)",
          }}
        >
          昨天補上了 ✓
        </p>
      )}

      {/* 已完成的圓 */}
      <div
        style={{
          marginTop: "1.5rem",
          minHeight: "1.25rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        {circles > 0 ? (
          <>
            <div
              className="flex flex-wrap justify-center"
              style={{ gap: "0.45rem", maxWidth: "12rem" }}
            >
              {Array.from({ length: circles }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#BEC23F",
                    boxShadow: "0 0 8px rgba(190,194,63,0.4)",
                  }}
                />
              ))}
            </div>
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                color: "rgba(237,236,234,0.35)",
              }}
            >
              {circles} {circles === 1 ? "CIRCLE" : "CIRCLES"} COMPLETE
            </p>
          </>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.6rem",
              letterSpacing: "0.18em",
              color: "rgba(237,236,234,0.2)",
            }}
          >
            連續 21 天，完成第一個圓
          </p>
        )}
      </div>
    </div>
  );
}
