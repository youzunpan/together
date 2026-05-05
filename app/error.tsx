"use client";

// Route-level error boundary：包 route 內 render 錯誤（layout 內，可保留 header / nav）。

import { useEffect } from "react";
import { reportClientError } from "@/lib/actions/error-log";

export default function RouteError({
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
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <p style={{ fontSize: "1rem", color: "#edecea", marginBottom: "0.5rem" }}>
        這個頁面出了點問題
      </p>
      <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.5)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
        錯誤已記錄。可以重試一次。
      </p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          background: "#BEC23F", color: "#1a1b18", border: "none",
          padding: "0.6rem 1.25rem", borderRadius: 4, fontSize: "0.85rem",
          cursor: "pointer", fontFamily: "var(--font-space-mono)", letterSpacing: "0.1em",
        }}
      >
        重試
      </button>
    </div>
  );
}
