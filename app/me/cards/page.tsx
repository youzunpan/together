// /me/cards — 卡冊：抽過的所有卡，新的在前。
// 顯示「已收集 N / 108」，沒抽過的不列出（收集感）。

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyCards } from "@/lib/actions/cards";
import { CardFace, CardBackMini } from "@/components/DailyCard";
import { CARDS } from "@/lib/cards";
import { APP_TZ } from "@/lib/tz";
import RefreshOnVisible from "@/components/RefreshOnVisible";

export const dynamic = "force-dynamic";

// 一天可以抽很多張，所以連時間一起顯示，才分得出先後
function formatDrawnAt(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default async function MyCardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const collected = await getMyCards();

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

      <h1 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.5rem", color: "#edecea", fontWeight: 400, marginBottom: "0.5rem" }}>
        卡冊
      </h1>
      <p style={{ fontSize: "0.78rem", color: "rgba(237,236,234,0.45)", lineHeight: 1.85, marginBottom: "0.75rem" }}>
        每次靜坐完都可以抽一張。
        {CARDS.length} 張卡出自瑜伽八肢 —— 從對世界的持戒、對自己的精進，
        一路走到體位、調息、專注與靜默。
        <br />
        抽到哪一張沒有道理，重要的是你此刻怎麼讀它。
      </p>
      {collected.length > 0 && (
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", color: "rgba(237,236,234,0.3)", marginBottom: "2rem" }}>
          抽過 {collected.length} 次
        </p>
      )}

      {collected.length === 0 ? (
        <div className="flex flex-col items-center" style={{ padding: "1.5rem 1rem 3rem" }}>
          {/* 一張蓋著的卡等在那裡 —— 比一行字更讓人想去坐 */}
          <CardBackMini width={132} />
          <p style={{ fontSize: "0.85rem", color: "rgba(237,236,234,0.35)", lineHeight: 1.9, textAlign: "center", marginTop: "1.75rem" }}>
            還沒有抽過卡。<br />
            靜坐完，就可以翻開一張。
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
            <div key={c.id}>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.12em",
                  color: "rgba(237,236,234,0.28)",
                  marginBottom: "0.4rem",
                }}
              >
                {formatDrawnAt(c.drawnAt)}
              </p>
              <CardFace card={c.card} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
