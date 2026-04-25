"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

// 一個金色點：按下去 = 同在；越多人按越亮、光暈越大
export default function ReactionBar({
  sitId,
  count: initCount,
  mine: initMine,
  lightBg = false,
}: {
  sitId: string;
  count: number;
  mine: boolean;
  lightBg?: boolean;
}) {
  const [count, setCount] = useState(initCount);
  const [mine, setMine] = useState(initMine);
  const [animating, setAnimating] = useState(false);

  async function toggle() {
    const next = !mine;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 250);
    setMine(next);
    setCount((c) => c + (next ? 1 : -1));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMine(!next);
      setCount((c) => c + (next ? -1 : 1));
      return;
    }
    const { error } = next
      ? await supabase.from("hearts").insert({ sit_id: sitId, user_id: user.id, type: "sit" })
      : await supabase.from("hearts").delete()
          .eq("sit_id", sitId).eq("user_id", user.id).eq("type", "sit");

    if (error) {
      console.error("reaction toggle failed", error);
      setMine(!next);
      setCount((c) => c + (next ? -1 : 1));
    }
  }

  // 亮度：base 0.32 起跳，每多一個人 +12%，封頂 1
  // 我自己按過 → 強制 ≥ 0.85，加一圈光暈
  const baseOpacity = Math.min(1, 0.32 + count * 0.12);
  const dotOpacity = mine ? Math.max(baseOpacity, 0.95) : baseOpacity;
  // 光暈：人越多越擴散
  const glowSize = Math.min(18, 4 + count * 2.5);
  const glowAlpha = Math.min(0.55, 0.08 + count * 0.08 + (mine ? 0.18 : 0));
  const showGlow = count > 0 || mine;

  const countColor = lightBg ? "rgba(26,27,24,0.55)" : "rgba(237,236,234,0.55)";

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-1.5 cursor-pointer"
      aria-label="同在"
      aria-pressed={mine}
    >
      <span
        aria-hidden
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#BEC23F",
          opacity: dotOpacity,
          boxShadow: showGlow ? `0 0 ${glowSize}px rgba(190,194,63,${glowAlpha})` : "none",
          transform: animating ? "scale(1.4)" : "scale(1)",
          transition: "transform 220ms ease-out, opacity 280ms, box-shadow 280ms",
          flexShrink: 0,
        }}
      />
      {count > 0 && (
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.7rem",
            color: countColor,
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
