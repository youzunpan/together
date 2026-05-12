"use client";

// 沒裝成 PWA 時顯示安裝指引。
// 不是 iOS / Android 不顯示（桌機不支援）。
// 「知道了」會放 7 天冷卻，避免每次刷新都打擾。

import { useEffect, useState } from "react";

const DISMISS_KEY = "pwa-install-dismissed-at";
const SHOW_AGAIN_AFTER_DAYS = 7;

type Platform = "ios" | "android" | "other";

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    // iPadOS 13+ Safari 預設 UA 報 "Macintosh"，要靠 maxTouchPoints 才認得出 iPad
    const isIPad =
      /iPad/.test(ua) ||
      (/Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1);
    const isIOS = /iPhone|iPod/.test(ua) || isIPad;
    const isAndroid = /Android/.test(ua);
    const p: Platform = isIOS ? "ios" : isAndroid ? "android" : "other";
    setPlatform(p);
    if (p === "other") return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const ageMs = Date.now() - dismissedAt;
    if (dismissedAt && ageMs < SHOW_AGAIN_AFTER_DAYS * 86400_000) return;

    setShow(true);
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <section
      style={{
        background: "#1a1b18",
        border: "1px solid rgba(190,194,63,0.25)",
        borderRadius: "var(--r-card)",
        padding: "1rem 1rem 0.75rem",
        marginTop: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.18em",
            color: "#BEC23F",
          }}
        >
          INSTALL · 加到主畫面
        </p>
        <button
          type="button"
          onClick={dismiss}
          style={{
            background: "transparent", border: "none", padding: 0,
            fontFamily: "var(--font-space-mono)", fontSize: "0.55rem",
            letterSpacing: "0.12em", color: "rgba(237,236,234,0.35)",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <p style={{ fontSize: "0.82rem", color: "#edecea", lineHeight: 1.55, marginBottom: "0.75rem" }}>
        建議把同在加到主畫面，這樣螢幕鎖定時的鈴聲、推播提醒才能可靠運作。
      </p>

      {platform === "ios" ? (
        <ol style={listStyle}>
          <li style={liStyle}>
            <span style={stepNum}>1</span>
            點瀏覽器底部 <strong style={{ color: "#edecea" }}>分享鍵</strong>（□ ↑）
          </li>
          <li style={liStyle}>
            <span style={stepNum}>2</span>
            往下滑，選「<strong style={{ color: "#edecea" }}>加入主畫面</strong>」
          </li>
          <li style={liStyle}>
            <span style={stepNum}>3</span>
            從主畫面的同在 icon 重新打開
          </li>
        </ol>
      ) : (
        <ol style={listStyle}>
          <li style={liStyle}>
            <span style={stepNum}>1</span>
            點右上角的「<strong style={{ color: "#edecea" }}>⋮</strong>」選單
          </li>
          <li style={liStyle}>
            <span style={stepNum}>2</span>
            選「<strong style={{ color: "#edecea" }}>安裝應用程式</strong>」或「加到主畫面」
          </li>
          <li style={liStyle}>
            <span style={stepNum}>3</span>
            從主畫面的同在 icon 重新打開
          </li>
        </ol>
      )}

      <p
        style={{
          fontFamily: "var(--font-space-mono)", fontSize: "0.6rem",
          letterSpacing: "0.1em", color: "rgba(237,236,234,0.3)",
          marginTop: "0.75rem", textAlign: "center",
        }}
      >
        裝好後就不會再看到這張卡
      </p>
    </section>
  );
}

const listStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.4rem",
  fontSize: "0.8rem", color: "rgba(237,236,234,0.7)",
  lineHeight: 1.55, listStyle: "none", padding: 0, margin: 0,
};

const liStyle: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "0.5rem" };

const stepNum: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: "1.1rem", height: "1.1rem", borderRadius: "50%",
  background: "rgba(190,194,63,0.15)", color: "#BEC23F",
  fontFamily: "var(--font-space-mono)", fontSize: "0.6rem",
  flexShrink: 0,
};
