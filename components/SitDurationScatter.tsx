"use client";

// 時長選擇器：6/12/18/24/36/60 分鐘 + OTHER，散落在容器內。
// 圓越大代表時間越長，每次掛載重新隨機位置。

import { useEffect, useRef, useState } from "react";

const PRESETS: Array<{ min: number; r: number }> = [
  { min: 6, r: 26 },
  { min: 12, r: 32 },
  { min: 18, r: 38 },
  { min: 24, r: 44 },
  { min: 36, r: 54 },
  { min: 60, r: 66 },
];
const OTHER_RADIUS = 22;
const CONTAINER_HEIGHT = 360;
const EDGE_PADDING = 4;
const GAP = 4;

type LayoutItem = { key: string; r: number; x: number; y: number };

function layoutCircles(width: number, items: Array<{ key: string; r: number }>): LayoutItem[] {
  const height = CONTAINER_HEIGHT;
  const placed: LayoutItem[] = [];
  // 大的先放更容易塞滿
  const ordered = [...items].sort((a, b) => b.r - a.r);
  for (const item of ordered) {
    const r = item.r;
    const minX = r + EDGE_PADDING;
    const maxX = width - r - EDGE_PADDING;
    const minY = r + EDGE_PADDING;
    const maxY = height - r - EDGE_PADDING;
    let pos: { x: number; y: number } | null = null;
    for (let attempt = 0; attempt < 400; attempt++) {
      const x = minX + Math.random() * Math.max(0, maxX - minX);
      const y = minY + Math.random() * Math.max(0, maxY - minY);
      const ok = placed.every((o) => {
        const dx = x - o.x;
        const dy = y - o.y;
        return Math.sqrt(dx * dx + dy * dy) > r + o.r + GAP;
      });
      if (ok) { pos = { x, y }; break; }
    }
    placed.push({
      key: item.key,
      r,
      x: pos?.x ?? width / 2,
      y: pos?.y ?? height / 2,
    });
  }
  return placed;
}

export default function SitDurationScatter({
  selectedMin,
  showCustom,
  onSelect,
  onOther,
}: {
  selectedMin: number;
  showCustom: boolean;
  onSelect: (min: number) => void;
  onOther: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<LayoutItem[] | null>(null);

  useEffect(() => {
    const width = containerRef.current?.clientWidth ?? 320;
    const items = [
      ...PRESETS.map((p) => ({ key: String(p.min), r: p.r })),
      { key: "other", r: OTHER_RADIUS },
    ];
    setLayout(layoutCircles(width, items));
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: CONTAINER_HEIGHT,
        marginBottom: "1rem",
      }}
    >
      {layout?.map((item, i) => {
        const isOther = item.key === "other";
        const min = isOther ? 0 : Number(item.key);
        const active = isOther ? showCustom : !showCustom && selectedMin === min;
        const fontSize = Math.max(10, Math.round(item.r * 0.5));
        const subSize = Math.max(7, Math.round(item.r * 0.22));
        return (
          <button
            key={item.key}
            type="button"
            onClick={isOther ? onOther : () => onSelect(min)}
            style={{
              position: "absolute",
              left: item.x - item.r,
              top: item.y - item.r,
              width: item.r * 2,
              height: item.r * 2,
              borderRadius: "50%",
              background: active ? "#BEC23F" : "#2c2c2a",
              color: active ? "#1a1b18" : "rgba(237,236,234,0.55)",
              border: "1px solid",
              borderColor: active ? "#BEC23F" : "rgba(255,255,255,0.08)",
              fontFamily: "var(--font-space-mono)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              transition: "background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s",
              animation: `scatterFadeIn 0.5s ease-out ${i * 0.05}s both`,
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {isOther ? (
              <span style={{ fontSize: `${Math.round(item.r * 0.55)}px`, letterSpacing: "0.05em" }}>···</span>
            ) : (
              <>
                <span style={{ fontSize: `${fontSize}px`, fontWeight: 400 }}>{min}</span>
                <span
                  style={{
                    fontSize: `${subSize}px`,
                    letterSpacing: "0.15em",
                    marginTop: "0.15rem",
                    opacity: 0.65,
                  }}
                >
                  MIN
                </span>
              </>
            )}
          </button>
        );
      })}

      <style>{`
        @keyframes scatterFadeIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
