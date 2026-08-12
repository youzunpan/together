"use client";

// 卡片視覺 + 翻卡動畫。
// - CardFace：純顯示一張卡（卡冊、feed、記錄畫面都用這個）
// - CardFlip：蓋著的卡 → 點一下翻開，翻完呼叫 onRevealed
//
// 動畫用 CSS 3D transform，不依賴任何動畫套件。

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { cardSanskrit, type Card } from "@/lib/cards";

const GOLD = "#BEC23F";

/**
 * 卡背樣式。
 *   "mountain" = ChatGPT 生成的插畫（內在之山），public/cards/back-mountain.png
 *   "wheel"    = 程式繪製的八肢輪 SVG（可隨尺寸自動簡化、無限放大）
 * 目前在測試插畫版；想換回來改這一個字就好。
 */
const CARD_BACK: "mountain" | "wheel" = "mountain";

/**
 * 卡背：八肢輪。
 * 八道光從中心射出，對應帕坦伽利八肢 —— 這副牌真正的骨架。
 * 中心那顆點呼應 app 各處的呼吸點（splash、同心、21 天圓）。
 *
 * 純 SVG、無外部資源。useId 避免同頁多張卡時 gradient id 撞在一起。
 */
function CardBack({ showWordmark = true }: { showWordmark?: boolean }) {
  if (CARD_BACK === "mountain") return <CardBackImage />;
  return <CardBackWheel showWordmark={showWordmark} />;
}

/** 插畫版卡背。用 next/image 讓 Next 自動轉 WebP/AVIF 並產生對應尺寸的變體。 */
function CardBackImage() {
  return (
    <span
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        height: "100%",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <Image
        src="/cards/back-mountain.png"
        alt=""
        fill
        // 卡背最大只會用到 248px 寬（靜坐主畫面）
        sizes="248px"
        style={{ objectFit: "cover" }}
        priority={false}
      />
    </span>
  );
}

/** 程式繪製版卡背：八肢輪 */
function CardBackWheel({ showWordmark = true }: { showWordmark?: boolean }) {
  const uid = useId();
  const glowId = `cardGlow-${uid}`;

  // 八個方位（度）。從正上方開始，每 45 度一道。
  const spokes = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg
      viewBox="0 0 120 180"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.10" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="120" height="180" rx="8" fill="#22231f" />
      <rect width="120" height="180" rx="8" fill={`url(#${glowId})`} />

      {/* 雙層外框 */}
      <rect x="5" y="5" width="110" height="170" rx="5" fill="none" stroke={GOLD} strokeOpacity="0.28" strokeWidth="0.6" />
      <rect x="8.5" y="8.5" width="103" height="163" rx="3" fill="none" stroke={GOLD} strokeOpacity="0.12" strokeWidth="0.4" />

      <g transform="translate(60,90)">
        {/* 三層同心圓 */}
        {[38, 29, 20].map((r, i) => (
          <circle key={r} r={r} fill="none" stroke={GOLD} strokeOpacity={0.10 + i * 0.06} strokeWidth="0.5" />
        ))}

        {/* 八道光 + 末端的點 */}
        <g stroke={GOLD} strokeOpacity="0.3" strokeWidth="0.6" strokeLinecap="round">
          {spokes.map((deg) => (
            <line key={deg} y1="-12" y2="-34" transform={`rotate(${deg})`} />
          ))}
        </g>
        <g fill={GOLD} fillOpacity="0.35">
          {spokes.map((deg) => (
            <circle key={deg} cy="-38" r="1.3" transform={`rotate(${deg})`} />
          ))}
        </g>

        {/* 中心：呼吸點 */}
        <circle r="4" fill={GOLD} fillOpacity="0.8" />
      </g>

      {showWordmark && (
        <text
          x="60"
          y="165"
          textAnchor="middle"
          fill={GOLD}
          fillOpacity="0.3"
          style={{ fontSize: 5, letterSpacing: 2, fontFamily: "var(--font-space-mono)" }}
        >
          TOGETHER
        </text>
      )}
    </svg>
  );
}

/**
 * 小張的卡背，給「坐完可以抽一張卡」這類預告用。
 * 只露卡背不露卡文 —— 讓人知道有這件事，但不破壞翻開的意外感。
 */
export function CardBackMini({
  width = 30,
  breathe = true,
  fill = false,
}: {
  /** 數字 = 固定 px；字串 = 直接當 CSS width（例如 "min(240px, 62vw)"），高度用 aspect-ratio 撐 */
  width?: number | string;
  breathe?: boolean;
  /** 填滿容器寬度（卡冊網格用），維持 2:3 比例 */
  fill?: boolean;
}) {
  const responsive = typeof width === "string";
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        ...(fill
          ? { width: "100%", aspectRatio: "2 / 3" }
          : responsive
          ? { width, aspectRatio: "2 / 3", flexShrink: 0 }
          : { width, height: (width as number) * 1.5, flexShrink: 0 }),
        animation: breathe ? "cardMiniBreathe 5s ease-in-out infinite" : "none",
      }}
    >
      {/* 太小的時候 wordmark 會糊成一團，直接不畫 */}
      <CardBack showWordmark={fill || responsive || (width as number) >= 44} />
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
  const sanskrit = cardSanskrit(card);
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

      {/* 出處：放在最後才讀得到，先有自己的反應，再知道它出自哪一支。
          放上面或跟句子並排就會先看標籤再讀句子，那就毀了。 */}
      <div style={{ marginTop: compact ? "0.15rem" : "0.5rem", lineHeight: 1.5 }}>
        <p
          style={{
            // app 的字型都沒有天城文，交給系統字型（iOS/Android/Windows 都有）
            fontFamily: '"Noto Sans Devanagari", "Kohinoor Devanagari", "Devanagari MT", "Nirmala UI", serif',
            fontSize: compact ? "0.7rem" : "0.95rem",
            color: "rgba(190,194,63,0.55)",
          }}
        >
          {sanskrit.dev}
        </p>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: compact ? "0.45rem" : "0.52rem",
            letterSpacing: "0.22em",
            // letterSpacing 會在最後一個字後面也加空隙，補一個左邊距讓它視覺置中
            paddingLeft: "0.22em",
            color: "rgba(237,236,234,0.28)",
            marginTop: "0.2rem",
          }}
        >
          {sanskrit.roman}
        </p>
      </div>
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
  autoFlip = false,
}: {
  card: Card | null;
  onFlip?: () => void;
  disabled?: boolean;
  hint?: string;
  /** 開啟後自動翻面（卡冊用：點格子就等於「開啟 + 翻開」，不用點兩次） */
  autoFlip?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  // 自動翻：延一下再翻，讓使用者看得到「從背面翻過來」的動作
  useEffect(() => {
    if (!autoFlip || flipped) return;
    const t = setTimeout(() => setFlipped(true), 260);
    return () => clearTimeout(t);
  }, [autoFlip, flipped]);

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
