"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function HeartButtonClient({
  sitId,
  count: initialCount,
  hearted: initialHearted,
  isSelf,
  lightBg = false,
}: {
  sitId: string;
  count: number;
  hearted: boolean;
  isSelf: boolean;
  lightBg?: boolean;
}) {
  const [hearted, setHearted] = useState(initialHearted);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  async function toggle() {
    const next = !hearted;
    // 樂觀更新
    setHearted(next);
    setCount(c => c + (next ? 1 : -1));
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // 回退
      setHearted(!next);
      setCount(c => c + (next ? -1 : 1));
      return;
    }

    const { error } = next
      ? await supabase.from("hearts").insert({ sit_id: sitId, user_id: user.id })
      : await supabase.from("hearts").delete().eq("sit_id", sitId).eq("user_id", user.id);

    if (error) {
      // 寫入失敗：回退 UI
      console.error("heart toggle failed", error);
      setHearted(!next);
      setCount(c => c + (next ? -1 : 1));
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 transition-opacity cursor-pointer"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={hearted ? (lightBg ? "#6d7220" : "#BEC23F") : (lightBg ? "#6b6a66" : "#9B9891")}
        className={`transition-transform duration-200 ${animating ? "scale-125" : "scale-100"}`}
        style={{ opacity: hearted ? 1 : 0.55 }}
      >
        {/* 抽象打坐剪影（中性）— 圓頭 + 倒梯形身體 + 橢圓盤腿 */}
        <circle cx="12" cy="4.5" r="2.1" />
        <path d="M 9.2 8.4 Q 8 11 8 13.5 L 6 15.2 Q 5.6 15.8 6 16 L 18 16 Q 18.4 15.8 18 15.2 L 16 13.5 Q 16 11 14.8 8.4 Z" />
        <ellipse cx="12" cy="17.8" rx="7.2" ry="1.8" />
      </svg>
      {count > 0 && <span className="text-[12px]" style={{ color: lightBg ? "#6b6a66" : "#9B9891" }}>{count}</span>}
    </button>
  );
}
