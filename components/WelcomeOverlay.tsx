"use client";

// 首次登入引導：3 張卡片解釋同在、21 天圓、同心。
// 顯示條件：localStorage 沒看過 + 使用者還沒有任何 sit 紀錄（避免老用戶被打擾）。

import { useEffect, useState } from "react";

const KEY = "welcomed-v1";

const CARDS = [
  {
    title: "同在",
    subtitle: "TOGETHER",
    body: "一起靜坐的地方。\n沒有教練，沒有目標。\n只是坐。",
  },
  {
    title: "21 天圓",
    subtitle: "CIRCLE",
    body: "連續坐 21 天，畫完一個圓。\n漏一天，重新開始。\n每天 5 分鐘也很好。",
  },
  {
    title: "同心",
    subtitle: "TOGETHER CALL",
    body: "可以呼喚別人在同一個時間一起坐。\n看不到彼此，但你不是一個人。",
  },
];

export default function WelcomeOverlay({ alreadyMember }: { alreadyMember: boolean }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 老用戶（已有 sit）就算 localStorage 沒記錄也不顯示
    if (alreadyMember) return;
    if (localStorage.getItem(KEY)) return;
    setShow(true);
    // 下一個 frame 觸發 fade-in
    requestAnimationFrame(() => setFadeIn(true));
  }, [alreadyMember]);

  function dismiss() {
    setFadeIn(false);
    setTimeout(() => {
      try { localStorage.setItem(KEY, "1"); } catch {}
      setShow(false);
    }, 320);
  }

  function next() {
    if (step === CARDS.length - 1) dismiss();
    else setStep(step + 1);
  }

  if (!show) return null;

  const card = CARDS[step];
  const isLast = step === CARDS.length - 1;

  return (
    <div
      aria-hidden={!show}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "rgba(26,27,24,0.97)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        opacity: fadeIn ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    >
      <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        {/* 步驟指示 */}
        <div className="flex items-center justify-center gap-2" style={{ marginBottom: "3rem" }}>
          {CARDS.map((_, i) => (
            <span
              key={i}
              aria-hidden
              style={{
                width: i === step ? 24 : 6,
                height: 6,
                borderRadius: 999,
                background: i === step ? "#BEC23F" : "rgba(237,236,234,0.2)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.25em",
            color: "rgba(237,236,234,0.3)",
            marginBottom: "1rem",
          }}
        >
          {card.subtitle}
        </p>

        <p
          style={{
            fontFamily: "var(--font-noto-serif)",
            fontSize: "2.5rem",
            color: "#edecea",
            lineHeight: 1.2,
            marginBottom: "2rem",
            fontWeight: 400,
          }}
        >
          {card.title}
        </p>

        <p
          style={{
            fontSize: "1rem",
            color: "rgba(237,236,234,0.65)",
            lineHeight: 1.9,
            whiteSpace: "pre-line",
            minHeight: "9rem",
          }}
        >
          {card.body}
        </p>

        {/* 動作 */}
        <div className="flex items-center justify-between" style={{ marginTop: "2.5rem" }}>
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              style={{
                background: "transparent", border: "none", padding: "0.5rem 0.75rem",
                color: "rgba(237,236,234,0.4)",
                fontFamily: "var(--font-space-mono)", fontSize: "0.7rem",
                letterSpacing: "0.12em", cursor: "pointer",
              }}
            >
              ← 上一步
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              style={{
                background: "transparent", border: "none", padding: "0.5rem 0.75rem",
                color: "rgba(237,236,234,0.3)",
                fontFamily: "var(--font-space-mono)", fontSize: "0.7rem",
                letterSpacing: "0.12em", cursor: "pointer",
              }}
            >
              略過
            </button>
          )}

          <button
            type="button"
            onClick={next}
            className="btn-primary"
            style={{
              padding: "0.6rem 1.5rem", fontSize: "0.75rem",
              letterSpacing: "0.12em",
            }}
          >
            {isLast ? "開始" : "下一步 →"}
          </button>
        </div>
      </div>
    </div>
  );
}
