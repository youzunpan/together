// /me 上的抽卡區塊（server component）。
// 規則：一次靜坐 = 一次抽卡機會。
//   1. 還有機會沒用掉 → 給抽卡入口（坐完當下沒抽的補抽在這裡）
//   2. 機會用完了、但抽過卡 → 顯示最近抽到的那張
//   3. 從沒抽過也沒得抽 → 整塊不顯示（不預告）

import Link from "next/link";
import { getLatestCard, remainingDrawsToday } from "@/lib/actions/cards";
import { CardFace } from "@/components/DailyCard";
import DrawCardButton from "./DrawCardButton";

export default async function TodayCardSection() {
  const [card, remaining] = await Promise.all([getLatestCard(), remainingDrawsToday()]);

  if (!card && remaining <= 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between" style={{ marginBottom: "0.75rem" }}>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", color: "rgba(237,236,234,0.3)" }}>
          {remaining > 0 ? "可以抽卡 · READY" : "最近抽到 · LATEST"}
        </p>
        <Link
          href="/me/cards"
          style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", color: "rgba(237,236,234,0.35)" }}
        >
          卡冊 →
        </Link>
      </div>

      {remaining > 0 ? (
        <DrawCardButton remaining={remaining} />
      ) : (
        card && <CardFace card={card} />
      )}
    </section>
  );
}
