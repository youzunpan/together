"use client";

import { useTransition } from "react";
import { deleteSit } from "@/lib/actions/sits";

export default function SitDeleteButton({
  id,
  label,
}: {
  id: string;
  label: string; // 用於 confirm 訊息，例：「小明 · 25min · 4/24 14:30」
}) {
  const [pending, start] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`刪除這筆紀錄？\n\n${label}\n\n此動作無法復原。`)) return;
    start(async () => {
      const res = await deleteSit(id);
      if (res.error) alert(res.error);
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      style={{
        background: "none",
        border: "none",
        padding: "0.25rem 0.5rem",
        color: pending ? "rgba(214,92,106,0.4)" : "rgba(214,92,106,0.7)",
        fontFamily: "var(--font-space-mono)",
        fontSize: "0.6rem",
        letterSpacing: "0.1em",
        cursor: pending ? "default" : "pointer",
      }}
    >
      {pending ? "..." : "DELETE"}
    </button>
  );
}
