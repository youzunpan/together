"use client";

// 卡片視覺 + 翻卡動畫。
// - CardFace：純顯示一張卡（卡冊、feed、記錄畫面都用這個）
// - CardFlip：蓋著的卡 → 點一下翻開，翻完呼叫 onRevealed
//
// 動畫用 CSS 3D transform，不依賴任何動畫套件。

import { useState } from "react";
import type { Card } from "@/lib/cards";

const GOLD = "#BEC23F";

/** 卡背花紋：同心圓 + 中心點，呼應 app 的呼吸點 */
function CardBack({ size = 1 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 120 180"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden
    >
      <rect x="0" y="0" width="120" height="180" rx="8" fill="#22231f" />
      <rect x="5" y="5" width="110" height="170" rx="5" fill="none" stroke={GOLD} strokeOpacity="0.25" strokeWidth="0.6" />
      {[34, 26, 18].map((r, i) => (
        <circle
          key={r}
          cx="60"
          cy="90"
          r={r}
          fill="none"
          stroke={GOLD}
          strokeOpacity={0.12 + i * 0.06}
          strokeWidth="0.6"
        />
      ))}
      <circle cx="60" cy="90" r="4" fill={GOLD} fillOpacity="0.75" />
      <text
        x="60"
        y="163"
        textAnchor="middle"
        fill={GOLD}
        fillOpacity="0.3"
        style={{ fontSize: 6 * size, letterSpacing: 2, fontFamily: "var(--font-space-mono)" }}
      >
        TOGETHER
      </text>
    </svg>
  );
}

/**
 * 小張的卡背，給「坐完可以抽一張卡」這類預告用。
 * 只露卡背不露卡文 —— 讓人知道有這件事，但不破壞翻開的意外感。
 */
export function CardBackMini({ width = 30, breathe = true }: { width?: number; breathe?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width,
        height: width * 1.5,
        flexShrink: 0,
        animation: breathe ? "cardMiniBreathe 5s ease-in-out infinite" : "none",
      }}
    >
      <CardBack />
      <style>{`
        @keyframes cardMiniBreathe {
          0%, 100% { opacity: 0.75; }
          50%      { opacity: 1; }
        }
      `}</style>
    </span>
  );
}

/** 一張翻開的卡 */
export function CardFace({
  card,
  compact = false,
}: {
  card: Card;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(160deg, #2f302b 0%, #26271f 100%)",
        border: `1px solid rgba(190,194,63,${compact ? 0.2 : 0.3})`,
        borderRadius: compact ? 6 : 10,
        padding: compact ? "0.85rem 1rem" : "1.75rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: compact ? "0.5rem" : "1.1rem",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <p
        className="reflection-text"
        style={{
          fontSize: compact ? "0.9rem" : "1.3rem",
          lineHeight: 1.85,
          color: "#edecea",
          letterSpacing: "0.02em",
        }}
      >
        {card.zh}
      </p>
      <div
        aria-hidden
        style={{
          width: compact ? 18 : 28,
          height: 1,
          background: `rgba(190,194,63,${compact ? 0.3 : 0.45})`,
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: compact ? "0.55rem" : "0.68rem",
          lineHeight: 1.6,
          letterSpacing: "0.06em",
          color: "rgba(237,236,234,0.4)",
          fontStyle: "italic",
        }}
      >
        {card.en}
      </p>
    </div>
  );
}

/**
 * 蓋著的卡 → 點一下翻開。
 * onFlip 在翻面「開始」時呼叫（給呼叫端去打 server action）；
 * card 傳進來之前先傳 null，拿到之後再傳，翻面到一半就會換成正面。
 */
export function CardFlip({
  card,
  onFlip,
  disabled = false,
  hint = "點一下，翻開今天的卡",
}: {
  card: Card | null;
  onFlip?: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  const [flipped, setFlipped] = useState(false);

  function handleFlip() {
    if (flipped || disabled) return;
    setFlipped(true);
    onFlip?.();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
      <button
        type="button"
        onClick={handleFlip}
        disabled={disabled || flipped}
        aria-label={flipped ? "已翻開" : "翻開今天的卡"}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          width: 240,
          height: 360,
          perspective: 1200,
          cursor: flipped || disabled ? "default" : "pointer",
          // 卡背有個很慢的呼吸感，暗示「可以點」
          animation: flipped ? "none" : "cardBreathe 5s ease-in-out infinite",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.9s cubic-bezier(0.4, 0.0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* 背面 */}
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
            <CardBack />
          </div>
          {/* 正面 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {card ? (
              <CardFace card={card} />
            ) : (
              <div
                style={{
                  height: "100%",
                  border: "1px solid rgba(190,194,63,0.3)",
                  borderRadius: 10,
                  background: "#26271f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(237,236,234,0.3)",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: "0.7rem",
                }}
              >
                ...
              </div>
            )}
          </div>
        </div>
      </button>

      {!flipped && (
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.62rem",
            letterSpacing: "0.15em",
            color: "rgba(237,236,234,0.35)",
          }}
        >
          {hint}
        </p>
      )}

      <style>{`
        @keyframes cardBreathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.025); }
        }
      `}</style>
    </div>
  );
}
