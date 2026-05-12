"use client";

// 從背景切回前景時，如果在背景超過 30 秒，就 router.refresh()
// 讓 server component 重新撈最新資料（同心、課程、紀錄等）。
//
// 簡單避免：30 秒以下不刷新（避免使用者快速切 app 也觸發）。

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HIDDEN_REFRESH_MS = 30_000;

export default function RefreshOnVisible() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document === "undefined") return;
    let hiddenAt: number | null = null;

    function onChange() {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (document.visibilityState === "visible") {
        if (hiddenAt !== null && Date.now() - hiddenAt > HIDDEN_REFRESH_MS) {
          router.refresh();
        }
        hiddenAt = null;
      }
    }

    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [router]);

  return null;
}
