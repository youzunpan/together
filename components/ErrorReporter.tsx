"use client";

// 攔截 window onerror + unhandledrejection，把 client-side 錯誤回報到 error_logs。
// 同一錯誤訊息 60 秒內只送一次，避免迴圈或重複觸發炸日誌。

import { useEffect } from "react";
import { reportClientError } from "@/lib/actions/error-log";

const recentlyReported = new Map<string, number>();
const COOLDOWN_MS = 60_000;

function shouldReport(key: string): boolean {
  const now = Date.now();
  const last = recentlyReported.get(key) ?? 0;
  if (now - last < COOLDOWN_MS) return false;
  recentlyReported.set(key, now);
  // 偶爾掃掉太舊的 entry
  if (recentlyReported.size > 50) {
    for (const [k, t] of recentlyReported) {
      if (now - t > COOLDOWN_MS * 2) recentlyReported.delete(k);
    }
  }
  return true;
}

export default function ErrorReporter() {
  useEffect(() => {
    function send(args: {
      message: string;
      source: "react-error" | "client" | "other";
      stack?: string;
      meta?: Record<string, unknown>;
    }) {
      const key = `${args.source}:${args.message.slice(0, 200)}`;
      if (!shouldReport(key)) return;
      const route =
        typeof window !== "undefined" ? window.location.pathname : undefined;
      const userAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : undefined;
      reportClientError({ ...args, route, userAgent }).catch(() => {});
    }

    // 已知無害的訊息：不送 server log。
    // - NEXT_REDIRECT：Next.js 用 throw 實作 server-side redirect，redirect 實際成功
    // - Script error.：跨來源腳本被瀏覽器隱藏細節，無法診斷
    function isNoise(msg: string): boolean {
      return (
        msg.includes("NEXT_REDIRECT") ||
        msg.includes("NEXT_NOT_FOUND") ||
        msg === "Script error." ||
        msg === "unhandledrejection: Script error."
      );
    }

    function onError(e: ErrorEvent) {
      const msg = e.message || "(no message)";
      if (isNoise(msg)) return;
      send({
        source: "client",
        message: msg,
        stack: e.error?.stack,
        meta: { filename: e.filename, lineno: e.lineno, colno: e.colno },
      });
    }

    function onRejection(e: PromiseRejectionEvent) {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : JSON.stringify(reason);
      if (isNoise(message) || isNoise(`unhandledrejection: ${message}`)) return;
      const stack = reason instanceof Error ? reason.stack : undefined;
      send({
        source: "client",
        message: `unhandledrejection: ${message}`,
        stack,
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
