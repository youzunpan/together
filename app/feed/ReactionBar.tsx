"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

// 一顆紅色愛心：按下去 = 同在；自己按過會填色，越多人按光暈越大
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

  // 紅色：用既有的軟紅 #D65C6A，跟系統其他紅色一致
  const HEART_COLOR = "#D65C6A";
  // 沒按過時用淡灰色輪廓
  const emptyStroke = lightBg ? "rgba(26,27,24,0.35)" : "rgba(237,236,234,0.4)";
  // 光暈：人越多越擴散
  const glowSize = Math.min(16, 3 + count * 2);
  const glowAlpha = Math.min(0.55, 0.1 + count * 0.08 + (mine ? 0.2 : 0));
  const showGlow = count > 0 || mine;

  const countColor = lightBg ? "rgba(26,27,24,0.55)" : "rgba(237,236,234,0.55)";

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-1.5 cursor-pointer"
      aria-label="同在"
      aria-pressed={mine}
      style={{ background: "transparent", border: "none", padding: 0 }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={mine ? HEART_COLOR : "none"}
        stroke={mine ? HEART_COLOR : emptyStroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={{
          filter: showGlow
            ? `drop-shadow(0 0 ${glowSize}px rgba(214,92,106,${glowAlpha}))`
            : "none",
          transform: animating ? "scale(1.3)" : "scale(1)",
          transition: "transform 220ms ease-out, filter 280ms",
          flexShrink: 0,
        }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
      </svg>
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
