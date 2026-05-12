// Service Worker：處理 push 通知 + 點擊行為。
// 這支會被 navigator.serviceWorker.register("/sw.js") 註冊。
// 注意：iOS PWA 必須是「加到主畫面」啟動的視窗才會收到 push。
// 一般 Safari tab 沒辦法。

self.addEventListener("install", (event) => {
  // 立刻接管，不等舊的 SW
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// 收到 push：顯示通知
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "同在", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "同在";
  const options = {
    body: data.body || "",
    icon: "/apple-icon",
    badge: "/icon",
    tag: data.tag || "default",        // 同 tag 會覆蓋舊通知
    renotify: Boolean(data.renotify),  // 即使同 tag 也再震一次
    data: {
      url: data.url || "/feed",
    },
    // iOS 不支援 actions / image / vibrate，會被忽略但不會壞
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 點通知 → 把使用者帶到 data.url（已開的 tab 就 focus，沒開就開新的）
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/feed";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // 找已經開的同源 client
      for (const client of clients) {
        try {
          const u = new URL(client.url);
          const target = new URL(url, self.location.origin);
          if (u.origin === target.origin) {
            // iOS PWA client.navigate() 不穩，改用 focus + postMessage 讓
            // client 自己 window.location.assign 過去（最可靠的跨平台做法）
            client.focus();
            client.postMessage({ type: "sw-navigate", url: target.pathname + target.search });
            return;
          }
        } catch {}
      }
      return self.clients.openWindow(url);
    })
  );
});
