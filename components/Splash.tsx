"use client";

import { useEffect, useState } from "react";

export default function Splash() {
  // 一開始就 render 覆蓋層（SSR 也會輸出），避免先閃一下網頁才蓋上來
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);
  // 等字體載完才顯示文字，避免 FOUT 造成版面跳動（最多等 200ms）
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // 瀏覽器分頁或同一 session 看過就直接收掉，不做動畫
    if (!isStandalone || sessionStorage.getItem("splashed")) {
      setShow(false);
      return;
    }
    sessionStorage.setItem("splashed", "1");

    // 等字體 ready，最多等 200ms 就先放行
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled) setFontsReady(true);
    }, 200);
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (!cancelled) {
          clearTimeout(fallback);
          setFontsReady(true);
        }
      }).catch(() => {});
    }

    const t1 = setTimeout(() => setFade(true), 2400);
    const t2 = setTimeout(() => setShow(false), 3000);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 9999,
        background: "#1a1b18",
        opacity: fade ? 0 : 1,
        transition: "opacity 0.55s ease-out",
        pointerEvents: fade ? "none" : "auto",
      }}
    >
      {/* 圓點 — 絕對定位 + marginTop 負值定位（不用 transform 避免被
          splashPulse 動畫的 transform: scale 覆蓋）。
          top: 50% + marginTop: -44px → 圓點 top 邊在「螢幕中央上方 44px」 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginTop: -44,
          marginLeft: -5,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#BEC23F",
          animation: "splashPulse 6s ease-in-out infinite",
        }}
      />

      {/* 文字塊：top: 50% + marginTop: -14px → 在圓點下方（圓點高 10 + gap 20 = 30，
          所以從圓點 top 往下 30，相對中央就是 -44 + 30 = -14）
          橫向用 transform 沒問題（沒有跟動畫衝突） */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginTop: -14,
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
          opacity: fontsReady ? 1 : 0,
          transition: "opacity 0.55s ease-out",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-noto-serif)",
            fontSize: "1.8rem",
            color: "#edecea",
            letterSpacing: "0.4em",
            paddingLeft: "0.4em",
            lineHeight: 1,
            height: "1.8rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          同在
        </div>
        <div
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.35em",
            color: "rgba(237,236,234,0.3)",
            lineHeight: 1,
            height: "0.6rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          TOGETHER
        </div>
      </div>

      <style>{`
        @keyframes splashPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
