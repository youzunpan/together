// /me/cards — 卡冊：抽過的所有卡，新的在前。
// 顯示「已收集 N / 108」，沒抽過的不列出（收集感）。

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyCards } from "@/lib/actions/cards";
import { CardFace } from "@/components/DailyCard";
import { CARDS } from "@/lib/cards";
import { APP_TZ } from "@/lib/tz";
import RefreshOnVisible from "@/components/RefreshOnVisible";

export const dynamic = "force-dynamic";

function formatDrawnOn(dateKey: string): string {
  // drawn_on 是台北日期字串 "YYYY-MM-DD"，直接組回 +08:00 避免時區位移
  return new Date(`${dateKey}T00:00:00+08:00`).toLocaleDateString("zh-TW", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MyCardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const collected = await getMyCards();
  // 同一張卡可能在不同天重複抽到，收集進度看的是「不重複的張數」
  const uniqueCount = new Set(collected.map((c) => c.card.id)).size;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <RefreshOnVisible />
      <header className="mb-8 flex items-center justify-between">
        <Link
          href="/me"
          style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.4)", whiteSpace: "nowrap" }}
        >
          ← BACK
        </Link>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.2)" }}>
          CARDS
        </p>
        <span style={{ width: "3rem" }} aria-hidden />
      </header>

      <h1 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.5rem", color: "#edecea", fontWeight: 400, marginBottom: "0.25rem" }}>
        卡冊
      </h1>
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "#BEC23F", marginBottom: "2rem" }}>
        {uniqueCount} / {CARDS.length}
        <span style={{ color: "rgba(237,236,234,0.3)", marginLeft: "0.5rem" }}>
          · 共 {collected.length} 次
        </span>
      </p>

      {collected.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ fontSize: "0.85rem", color: "rgba(237,236,234,0.35)", lineHeight: 1.9 }}>
            還沒有抽過卡。<br />
            靜坐完，就可以抽今天的那一張。
          </p>
          <Link
            href="/sit"
            className="btn-primary"
            style={{ display: "inline-block", marginTop: "1.5rem", textDecoration: "none", letterSpacing: "0.12em" }}
          >
            去靜心
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {collected.map((c) => (
            <div key={`${c.drawnOn}-${c.card.id}`}>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.12em",
                  color: "rgba(237,236,234,0.28)",
                  marginBottom: "0.4rem",
                }}
              >
                {formatDrawnOn(c.drawnOn)}
              </p>
              <CardFace card={c.card} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
