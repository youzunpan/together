"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type ReactionType = "sit" | "heart" | "smile";

type Counts = Record<ReactionType, number>;
type Mine = Record<ReactionType, boolean>;

export default function ReactionBar({
  sitId,
  counts: initCounts,
  mine: initMine,
  lightBg = false,
}: {
  sitId: string;
  counts: Counts;
  mine: Mine;
  lightBg?: boolean;
}) {
  const [counts, setCounts] = useState<Counts>(initCounts);
  const [mine, setMine] = useState<Mine>(initMine);

  async function toggle(type: ReactionType) {
    const next = !mine[type];
    // 樂觀更新
    setMine(m => ({ ...m, [type]: next }));
    setCounts(c => ({ ...c, [type]: c[type] + (next ? 1 : -1) }));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMine(m => ({ ...m, [type]: !next }));
      setCounts(c => ({ ...c, [type]: c[type] + (next ? -1 : 1) }));
      return;
    }

    const { error } = next
      ? await supabase.from("hearts").insert({ sit_id: sitId, user_id: user.id, type })
      : await supabase.from("hearts").delete()
          .eq("sit_id", sitId).eq("user_id", user.id).eq("type", type);

    if (error) {
      console.error("reaction toggle failed", error);
      setMine(m => ({ ...m, [type]: !next }));
      setCounts(c => ({ ...c, [type]: c[type] + (next ? -1 : 1) }));
    }
  }

  const activeColor = lightBg ? "#6d7220" : "#BEC23F";
  const idleColor   = lightBg ? "#6b6a66" : "#9B9891";
  const countColor  = lightBg ? "#6b6a66" : "#9B9891";

  return (
    <div className="flex items-center gap-3">
      {/* 靜坐剪影 */}
      <ReactionButton
        onClick={() => toggle("sit")}
        active={mine.sit}
        count={counts.sit}
        activeColor={activeColor}
        idleColor={idleColor}
        countColor={countColor}
      >
        {/* 抽象打坐剪影（中性） */}
        <circle cx="12" cy="4.5" r="2.1" />
        <path d="M 9.2 8.4 Q 8 11 8 13.5 L 6 15.2 Q 5.6 15.8 6 16 L 18 16 Q 18.4 15.8 18 15.2 L 16 13.5 Q 16 11 14.8 8.4 Z" />
        <ellipse cx="12" cy="17.8" rx="7.2" ry="1.8" />
      </ReactionButton>

      {/* 愛心 */}
      <ReactionButton
        onClick={() => toggle("heart")}
        active={mine.heart}
        count={counts.heart}
        activeColor={activeColor}
        idleColor={idleColor}
        countColor={countColor}
      >
        <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z" />
      </ReactionButton>

      {/* 微笑臉 */}
      <ReactionButton
        onClick={() => toggle("smile")}
        active={mine.smile}
        count={counts.smile}
        activeColor={activeColor}
        idleColor={idleColor}
        countColor={countColor}
      >
        {/* 臉 */}
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {/* 眼睛 */}
        <circle cx="9" cy="10" r="1" />
        <circle cx="15" cy="10" r="1" />
        {/* 嘴 */}
        <path d="M8.5 14 Q 12 17 15.5 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </ReactionButton>
    </div>
  );
}

function ReactionButton({
  onClick, active, count, activeColor, idleColor, countColor, children,
}: {
  onClick: () => void;
  active: boolean;
  count: number;
  activeColor: string;
  idleColor: string;
  countColor: string;
  children: React.ReactNode;
}) {
  const [animating, setAnimating] = useState(false);
  function handle() {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 250);
    onClick();
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 transition-opacity cursor-pointer"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={active ? activeColor : idleColor}
        color={active ? activeColor : idleColor}
        className={`transition-transform duration-200 ${animating ? "scale-125" : "scale-100"}`}
        style={{ opacity: active ? 1 : 0.55 }}
      >
        {children}
      </svg>
      {count > 0 && (
        <span className="text-[12px]" style={{ color: countColor }}>
          {count}
        </span>
      )}
    </button>
  );
}
