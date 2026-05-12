"use client";

// 接收 service worker 透過 postMessage 送來的「請跳到這個路徑」命令。
// iOS PWA 的 client.navigate() 在 SW 端不穩，改由 SW postMessage → client
// 在這裡 window.location.assign 過去，可靠很多。

import { useEffect } from "react";

export default function SWNavigationListener() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;

    const handler = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | undefined;
      if (data?.type === "sw-navigate" && typeof data.url === "string") {
        // 同 origin 內的相對路徑才走，避免被惡意 message 利用
        if (data.url.startsWith("/")) {
          window.location.assign(data.url);
        }
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  return null;
}
