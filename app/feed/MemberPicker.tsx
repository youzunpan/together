"use client";

// 同心邀請：從會員清單裡選人。
// - 第一次顯示時去打 server action 拿成員列表
// - 已被邀請過的人會 disabled + 灰底（避免重複）
// - 受 selected 控制；變動時呼叫 onChange

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { listInvitableMembers } from "@/lib/actions/calls";

export type MemberRow = {
  id: string;
  display_name: string;
  avatar_letter: string;
  avatar_color: string;
  avatar_url: string | null;
};

export default function MemberPicker({
  callId,
  selected,
  onChange,
  lightBg = false,
}: {
  callId?: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  lightBg?: boolean;
}) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [alreadyInvited, setAlreadyInvited] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listInvitableMembers(callId).then((res) => {
      if (cancelled) return;
      if ("error" in res && res.error) {
        setMembers([]);
        setAlreadyInvited(new Set());
      } else {
        setMembers(res.members);
        setAlreadyInvited(new Set(res.alreadyInvited ?? []));
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [callId]);

  function toggle(id: string) {
    if (alreadyInvited.has(id)) return;
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  if (loading) {
    return (
      <p style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: "0.65rem",
        color: lightBg ? "rgba(26,27,24,0.4)" : "rgba(237,236,234,0.35)",
        textAlign: "center",
        padding: "1rem 0",
      }}>
        載入成員...
      </p>
    );
  }

  if (members.length === 0) {
    return (
      <p style={{
        fontSize: "0.75rem",
        color: lightBg ? "rgba(26,27,24,0.5)" : "rgba(237,236,234,0.4)",
        textAlign: "center",
        padding: "1rem 0",
      }}>
        沒有其他成員可以邀請。
      </p>
    );
  }

  const dimColor = lightBg ? "rgba(26,27,24,0.5)" : "rgba(237,236,234,0.4)";
  const nameColor = lightBg ? "#1a1b18" : "#edecea";

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: "0.5rem" }}>
        <p style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.55rem",
          letterSpacing: "0.12em",
          color: dimColor,
        }}>
          {selected.length === 0 ? `共 ${members.length} 人` : `已選 ${selected.length} 人`}
        </p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.55rem",
              letterSpacing: "0.08em",
              color: dimColor,
              cursor: "pointer",
            }}
          >
            清除
          </button>
        )}
      </div>

      <div
        style={{
          maxHeight: "16rem",
          overflowY: "auto",
          border: `1px solid ${lightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 4,
          background: lightBg ? "rgba(0,0,0,0.02)" : "#1a1b18",
        }}
      >
        {members.map((m) => {
          const isInvited = alreadyInvited.has(m.id);
          const isSelected = selected.includes(m.id);
          const active = isInvited || isSelected;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              disabled={isInvited}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.55rem 0.7rem",
                background: isSelected
                  ? lightBg ? "rgba(190,194,63,0.15)" : "rgba(190,194,63,0.1)"
                  : "transparent",
                border: "none",
                borderBottom: `1px solid ${lightBg ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.04)"}`,
                cursor: isInvited ? "not-allowed" : "pointer",
                textAlign: "left",
                opacity: isInvited ? 0.4 : 1,
              }}
            >
              {/* 選擇框 */}
              <span
                style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  border: `1.5px solid ${active ? "#BEC23F" : lightBg ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"}`,
                  borderRadius: 3,
                  background: active ? "#BEC23F" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1a1b18",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {active ? "✓" : ""}
              </span>
              <Avatar
                letter={m.avatar_letter}
                color={m.avatar_color}
                avatarUrl={m.avatar_url}
                size={26}
              />
              <span style={{ fontSize: "0.85rem", color: nameColor, flex: 1 }}>
                {m.display_name}
              </span>
              {isInvited && (
                <span style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.08em",
                  color: dimColor,
                }}>
                  已邀請
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
