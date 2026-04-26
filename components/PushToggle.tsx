"use client";

// 「開啟提醒」按鈕。
// 流程：
//   1. 註冊 /sw.js
//   2. Notification.requestPermission()
//   3. registration.pushManager.subscribe({ userVisibleOnly, applicationServerKey })
//   4. 把 subscription 上傳到 server action savePushSubscription
//
// 顯示狀態：
//   - 不支援（沒 PushManager / 不在 PWA） → 顯示提示，按鈕禁用
//   - 已訂閱           → 「關閉提醒」
//   - 未訂閱           → 「開啟提醒」
//   - 被使用者拒絕     → 顯示「已被瀏覽器封鎖，請去設定開」

import { useEffect, useState, useTransition } from "react";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/lib/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

// VAPID public key (base64url) → ArrayBuffer (PushManager 要 BufferSource)
function urlBase64ToArrayBuffer(base64url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "subscribed"
  | "unsubscribed"
  | "needs-pwa"; // iOS 必須加到主畫面

export default function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    if (typeof window === "undefined") return;

    // iOS Safari tab 連 ServiceWorker 都有，但 PushManager 只在 PWA standalone 模式才有
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    // iOS PWA 偵測：必須是 standalone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      // @ts-expect-error iOS 自家屬性
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isStandalone) {
      setStatus("needs-pwa");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "unsubscribed");
    } catch (e) {
      setError(String(e));
      setStatus("unsupported");
    }
  }

  function subscribe() {
    setError(null);
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setStatus(perm === "denied" ? "denied" : "unsubscribed");
          return;
        }

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
          });
        }

        const json = sub.toJSON() as {
          endpoint?: string;
          keys?: { p256dh?: string; auth?: string };
        };
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          setError("訂閱資料不完整");
          return;
        }

        const res = await savePushSubscription(
          { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
          navigator.userAgent
        );
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setStatus("subscribed");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function unsubscribe() {
    setError(null);
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await deletePushSubscription(endpoint);
        }
        setStatus("unsubscribed");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  // ── render ──
  const cardStyle: React.CSSProperties = {
    background: "#2c2c2a",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--r-card)",
    padding: "0.875rem 1rem",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-space-mono)",
    fontSize: "0.6rem",
    letterSpacing: "0.18em",
    color: "rgba(237,236,234,0.4)",
    marginBottom: "0.4rem",
  };
  const hintStyle: React.CSSProperties = {
    fontSize: "0.78rem",
    color: "rgba(237,236,234,0.55)",
    lineHeight: 1.55,
  };

  if (status === "loading") {
    return (
      <div style={cardStyle}>
        <p style={labelStyle}>提醒 · NOTIFICATIONS</p>
        <p style={hintStyle}>...</p>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div style={cardStyle}>
        <p style={labelStyle}>提醒 · NOTIFICATIONS</p>
        <p style={hintStyle}>這個瀏覽器不支援推播通知。</p>
      </div>
    );
  }

  if (status === "needs-pwa") {
    return (
      <div style={cardStyle}>
        <p style={labelStyle}>提醒 · NOTIFICATIONS</p>
        <p style={hintStyle}>
          iPhone 上需先把網站「加入主畫面」，再從主畫面圖示打開，才能開啟提醒。
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={cardStyle}>
        <p style={labelStyle}>提醒 · NOTIFICATIONS</p>
        <p style={hintStyle}>
          已被瀏覽器封鎖。請到「設定 → 通知 → 同在」改成允許。
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <p style={labelStyle}>提醒 · NOTIFICATIONS</p>
      <div className="flex items-center justify-between gap-3">
        <p style={{ ...hintStyle, flex: 1 }}>
          {status === "subscribed"
            ? "靜坐結束、同心開始時會推播通知。"
            : "開啟後，鎖屏時也能收到結束鈴聲與同心提醒。"}
        </p>
        {status === "subscribed" ? (
          <button
            onClick={unsubscribe}
            disabled={pending}
            className="btn-ghost"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", letterSpacing: "0.1em", flexShrink: 0 }}
          >
            {pending ? "..." : "關閉"}
          </button>
        ) : (
          <button
            onClick={subscribe}
            disabled={pending}
            className="btn-primary"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", letterSpacing: "0.1em", flexShrink: 0 }}
          >
            {pending ? "..." : "開啟"}
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: "0.7rem", color: "#D65C6A", marginTop: "0.5rem" }}>{error}</p>
      )}
    </div>
  );
}
