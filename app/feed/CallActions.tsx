"use client";

import { useTransition } from "react";
import { joinCall, leaveCall, cancelCall } from "@/lib/actions/calls";

export function JoinButton({
  callId,
  joined,
  isLive,
  durationMin,
}: {
  callId: string;
  joined: boolean;
  isLive: boolean; // 是否進行中（時間到了）
  durationMin: number;
}) {
  const [pending, start] = useTransition();

  function handleClick() {
    if (isLive && joined) {
      // 進行中且已加入 → 直接去 /sit
      window.location.href = `/sit?duration=${durationMin}`;
      return;
    }
    start(async () => {
      const res = joined ? await leaveCall(callId) : await joinCall(callId);
      if (res.error) alert(res.error);
    });
  }

  const label = isLive
    ? joined ? "現在加入 →" : "現在加入"
    : joined ? "已加入" : "我也想";

  const isCta = isLive && joined;

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        background: isCta ? "#BEC23F" : joined ? "rgba(190,194,63,0.12)" : "transparent",
        color: isCta ? "#1a1b18" : joined ? "#BEC23F" : "rgba(237,236,234,0.6)",
        border: isCta ? "none" : `1px solid ${joined ? "rgba(190,194,63,0.4)" : "rgba(237,236,234,0.2)"}`,
        padding: "0.4rem 0.85rem",
        fontFamily: "var(--font-space-mono)",
        fontSize: "0.65rem",
        letterSpacing: "0.12em",
        borderRadius: "var(--r-pill)",
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.5 : 1,
        transition: "all 0.15s",
      }}
    >
      {pending ? "..." : label}
    </button>
  );
}

export function CancelButton({ callId }: { callId: string }) {
  const [pending, start] = useTransition();

  function handleClick() {
    if (!confirm("取消這場同心？已加入的人會看到它消失。")) return;
    start(async () => {
      const res = await cancelCall(callId);
      if (res.error) alert(res.error);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        background: "none",
        border: "none",
        padding: "0.25rem 0.5rem",
        color: pending ? "rgba(237,236,234,0.2)" : "rgba(237,236,234,0.4)",
        fontFamily: "var(--font-space-mono)",
        fontSize: "0.6rem",
        letterSpacing: "0.1em",
        cursor: pending ? "default" : "pointer",
      }}
    >
      {pending ? "..." : "CANCEL"}
    </button>
  );
}
