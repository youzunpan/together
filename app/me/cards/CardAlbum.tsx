"use client";

// 卡冊：全部蓋著，點一張才翻開。
//
// 為什麼是網格不是列表：正面的卡文要 ~280px 寬才讀得舒服，而 280px 寬的卡背
// 高 420px，一張就佔滿螢幕。網格讓你一眼看到整段歷史（像把牌攤開），
// 點下去才在全螢幕翻開、讀得清楚。
//
// 只列你自己抽過的卡 —— 沒有未抽到的空格、沒有 108 進度條。
// 這副牌的重點是「照見此刻」，不是把格子填滿。

import { useEffect, useState } from "react";
import { CardBackMini, CardFlip } from "@/components/DailyCard";
import type { Card } from "@/lib/cards";

export type AlbumEntry = {
  id: string;
  card: Card;
  /** 已在 server 端用台北時區格式化好，避免 client 時區不一致 */
  label: string;
};

export default function CardAlbum({ entries }: { entries: AlbumEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = entries.find((e) => e.id === openId) ?? null;

  // 開著的時候鎖背景捲動 + Esc 關閉
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.85rem",
        }}
      >
        {entries.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setOpenId(e.id)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.4rem",
            }}
            aria-label={`翻開 ${e.label} 抽到的卡`}
          >
            {/* 網格裡不呼吸 —— 幾十張一起脈動會很吵 */}
            <CardBackMini fill breathe={false} />
            <span
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: "0.5rem",
                letterSpacing: "0.06em",
                color: "rgba(237,236,234,0.28)",
              }}
            >
              {e.label}
            </span>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            background: "rgba(26,27,24,0.94)",
            padding: "1rem",
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
          }}
          onClick={(ev) => { if (ev.target === ev.currentTarget) setOpenId(null); }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: "0.58rem",
                letterSpacing: "0.14em",
                color: "rgba(237,236,234,0.35)",
              }}
            >
              {open.label}
            </p>
            {/* key 讓每次開不同張都重新掛載，翻面動畫才會重播 */}
            <CardFlip key={open.id} card={open.card} autoFlip hint="" />
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="btn-ghost"
              style={{ letterSpacing: "0.12em" }}
            >
              收起
            </button>
          </div>
        </div>
      )}
    </>
  );
}
