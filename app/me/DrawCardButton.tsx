"use client";

// /me 上的補抽入口：坐完但當下沒抽（或跳過了），從這裡翻開今天的卡。
// 翻完就固定，重新整理後由 TodayCardSection 直接顯示卡面。

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { drawTodayCard } from "@/lib/actions/cards";
import { CardFlip } from "@/components/DailyCard";
import type { Card } from "@/lib/cards";

export default function DrawCardButton() {
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function openAndDraw() {
    setOpen(true);
    setError("");
    start(async () => {
      const res = await drawTodayCard();
      if (!res.ok) {
        setError(res.error);
        setOpen(false);
        return;
      }
      setCard(res.card);
    });
  }

  if (!open) {
    return (
      <>
        <button
          type="button"
          onClick={openAndDraw}
          disabled={pending}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px dashed rgba(190,194,63,0.35)",
            color: "#BEC23F",
            padding: "1.1rem",
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            borderRadius: "var(--r-card)",
            cursor: "pointer",
          }}
        >
          + 抽今天的卡
        </button>
        {error && (
          <p style={{ fontSize: "0.72rem", color: "#D65C6A", marginTop: "0.5rem" }}>{error}</p>
        )}
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{
        background: "rgba(26,27,24,0.94)",
        padding: "1rem",
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
        <CardFlip card={card} disabled={!card} />
        <button
          type="button"
          onClick={() => { setOpen(false); router.refresh(); }}
          className="btn-ghost"
          style={{ letterSpacing: "0.12em" }}
        >
          收起
        </button>
      </div>
    </div>
  );
}
