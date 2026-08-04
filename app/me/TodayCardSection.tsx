// /me 上的每日抽卡區塊（server component）。三種狀態：
//   1. 今天沒坐過 → 不顯示（抽卡是坐完的獎勵，不預告）
//   2. 坐過但沒抽 → 給抽卡入口
//   3. 抽過了 → 顯示今天的卡 + 卡冊連結

import Link from "next/link";
import { getTodayCard, hasSatToday } from "@/lib/actions/cards";
import { CardFace } from "@/components/DailyCard";
import DrawCardButton from "./DrawCardButton";

export default async function TodayCardSection() {
  const [card, satToday] = await Promise.all([getTodayCard(), hasSatToday()]);

  // 沒坐也沒抽 → 整塊不出現
  if (!card && !satToday) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between" style={{ marginBottom: "0.75rem" }}>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", color: "rgba(237,236,234,0.3)" }}>
          今天的卡 · TODAY
        </p>
        <Link
          href="/me/cards"
          style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", color: "rgba(237,236,234,0.35)" }}
        >
          卡冊 →
        </Link>
      </div>

      {card ? <CardFace card={card} /> : <DrawCardButton />}
    </section>
  );
}
