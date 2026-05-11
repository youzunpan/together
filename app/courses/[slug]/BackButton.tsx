"use client";

import { useRouter } from "next/navigation";

// 點返回鈕：有上一頁就 back，沒有 history 才退回 /me/courses
export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/me/courses");
        }
      }}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "var(--font-space-mono)",
        fontSize: "0.6rem",
        letterSpacing: "0.15em",
        color: "rgba(237,236,234,0.4)",
      }}
    >
      ← BACK
    </button>
  );
}
