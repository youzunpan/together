"use client";

// Next.js global error boundary：包整個 app（含 root layout）的 render 錯誤。
// 必須是 client component。

import { useEffect } from "react";
import { reportClientError } from "@/lib/actions/error-log";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      source: "react-error",
      message: error.message || "(no message)",
      stack: error.stack,
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      meta: error.digest ? { digest: error.digest } : undefined,
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="zh-TW">
      <body
        style={{
          minHeight: "100vh",
          background: "#1a1b18",
          color: "#edecea",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 360, textAlign: "center" }}>
          <p
            style={{
              fontSize: "1.1rem",
              marginBottom: "0.5rem",
            }}
          >
            出了點問題
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "rgba(237,236,234,0.5)",
              lineHeight: 1.6,
              marginBottom: "1.5rem",
            }}
          >
            錯誤已記錄。可以重試一次，<br />
            或回首頁再進來。
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: "#BEC23F",
                color: "#1a1b18",
                border: "none",
                padding: "0.6rem 1.25rem",
                borderRadius: 4,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              重試
            </button>
            <a
              href="/feed"
              style={{
                background: "transparent",
                color: "rgba(237,236,234,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.6rem 1.25rem",
                borderRadius: 4,
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              回首頁
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
