"use server";

// 每日抽卡。
// - 規則：一次靜坐 = 一次抽卡機會（每次坐完都能抽，同一天可以抽很多張）
// - 108 取 1，純隨機（不看使用者狀態、不做任何加權；同一天抽到重複的卡是正常的）
// - 沒坐過不能抽 —— 抽卡是「坐完的獎勵」，這是整個功能拉黏著度的原理

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { taipeiDateKey, taipeiTodayStartISO } from "@/lib/tz";
import { CARDS, getCard, type Card } from "@/lib/cards";

export type DrawResult = { ok: true; card: Card } | { ok: false; error: string };

/** 最近抽到的一張（沒抽過回 null），給 /me 顯示用 */
export async function getLatestCard(): Promise<Card | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("daily_cards")
    .select("card_id")
    .eq("user_id", user.id)
    .order("drawn_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? getCard(data.card_id) ?? null : null;
}

/**
 * 今天還剩幾次抽卡機會 = 今天坐的次數 − 今天抽的次數。
 * 坐完當下沒抽（或按了「不記錄」跳過）之後還能從 /me 補抽，就是靠這個。
 */
export async function remainingDrawsToday(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const todayStart = taipeiTodayStartISO();
  const [{ count: sits }, { count: draws }] = await Promise.all([
    supabase
      .from("sits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("sat_at", todayStart),
    supabase
      .from("daily_cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("drawn_on", taipeiDateKey()),
  ]);

  return Math.max((sits ?? 0) - (draws ?? 0), 0);
}

/**
 * 抽一張卡。
 * @param skipSitCheck 靜坐流程結束當下呼叫時用 —— 那筆 sit 還沒寫進 DB，
 *                     額度算不到它，所以直接放行。
 */
export async function drawCard(skipSitCheck = false): Promise<DrawResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登入" };

  if (!skipSitCheck && (await remainingDrawsToday()) <= 0) {
    return { ok: false, error: "今天先坐一下，再來抽卡。" };
  }

  const card = CARDS[Math.floor(Math.random() * CARDS.length)];

  const { error } = await supabase
    .from("daily_cards")
    .insert({ user_id: user.id, card_id: card.id, drawn_on: taipeiDateKey() });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/me");
  revalidatePath("/me/cards");
  return { ok: true, card };
}

export type CollectedCard = { id: string; card: Card; drawnAt: string };

/** 卡冊：抽過的所有卡，新的在前 */
export async function getMyCards(): Promise<CollectedCard[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("daily_cards")
    .select("id, card_id, drawn_at")
    .eq("user_id", user.id)
    .order("drawn_at", { ascending: false });

  return (data ?? [])
    .map((r) => {
      const card = getCard(r.card_id);
      return card ? { id: r.id as string, card, drawnAt: r.drawn_at as string } : null;
    })
    .filter((v): v is CollectedCard => v !== null);
}
