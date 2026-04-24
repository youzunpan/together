"use client";

import { useEffect, useState } from "react";

export default function Splash() {
  // 一開始就 render 覆蓋層（SSR 也會輸出），避免先閃一下網頁才蓋上來
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

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

    const t1 = setTimeout(() => setFade(true), 2400);
    const t2 = setTimeout(() => setShow(false), 3000);
    return () => {
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
        inset: 0,
        zIndex: 9999,
        background: "#1a1b18",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        opacity: fade ? 0 : 1,
        transition: "opacity 0.55s ease-out",
        pointerEvents: fade ? "none" : "auto",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#BEC23F",
          animation: "splashPulse 1.6s ease-in-out infinite",
        }}
      />

      <div
        style={{
          fontFamily: "var(--font-noto-serif)",
          fontSize: "1.8rem",
          color: "#edecea",
          letterSpacing: "0.4em",
          paddingLeft: "0.4em",
          animation: "splashFadeIn 0.9s ease-out",
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
          animation: "splashFadeIn 1.2s ease-out",
        }}
      >
        TOGETHER
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
