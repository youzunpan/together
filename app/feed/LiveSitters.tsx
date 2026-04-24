"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

// 觀察 Supabase Realtime Presence channel "live-sits"：
// 計時中的使用者會 track 自己，這裡只觀察總人數（排除自己）。
export default function LiveSitters({ currentUserId }: { currentUserId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("live-sits", {
      config: { presence: { key: "viewer-" + currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // 排除其他只是在看的 viewer-* key；正在坐的人 key = user id
        const sitters = Object.keys(state).filter(
          (k) => !k.startsWith("viewer-")
        );
        setCount(sitters.length);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId]);

  if (count === null || count === 0) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 mt-2"
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: "0.6rem",
        letterSpacing: "0.1em",
        color: "rgba(190,194,63,0.7)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#BEC23F",
          animation: "liveSittersPulse 1.6s ease-in-out infinite",
        }}
      />
      <span>
        {count} {count === 1 ? "PERSON" : "PEOPLE"} SITTING NOW
      </span>
      <style>{`
        @keyframes liveSittersPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
