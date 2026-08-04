"use server";

// 每日抽卡。
// - 一天一張：daily_cards 的 UNIQUE (user_id, drawn_on) 保證，重複呼叫會拿回同一張
// - 108 取 1，純隨機（不看使用者狀態、不做任何加權）
// - 必須當天有靜坐紀錄才能抽（抽卡是「坐完的獎勵」）

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { taipeiDateKey, taipeiTodayStartISO } from "@/lib/tz";
import { CARDS, getCard, type Card } from "@/lib/cards";

export type DrawResult =
  | { ok: true; card: Card; alreadyDrawn: boolean }
  | { ok: false; error: string };

/** 今天抽過的卡（沒抽過回 null） */
export async function getTodayCard(): Promise<Card | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("daily_cards")
    .select("card_id")
    .eq("user_id", user.id)
    .eq("drawn_on", taipeiDateKey())
    .maybeSingle();

  return data ? getCard(data.card_id) ?? null : null;
}

/** 今天有沒有靜坐紀錄 —— 決定能不能抽 */
export async function hasSatToday(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from("sits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("sat_at", taipeiTodayStartISO());

  return (count ?? 0) > 0;
}

/**
 * 抽今天的卡。已經抽過就回原本那張（alreadyDrawn = true），不會重抽。
 * @param skipSitCheck 靜坐流程結束當下呼叫時用 —— 那筆 sit 可能還沒寫進 DB
 */
export async function drawTodayCard(skipSitCheck = false): Promise<DrawResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登入" };

  const today = taipeiDateKey();

  // 已經抽過 → 直接回同一張
  const { data: existing } = await supabase
    .from("daily_cards")
    .select("card_id")
    .eq("user_id", user.id)
    .eq("drawn_on", today)
    .maybeSingle();
  if (existing) {
    const card = getCard(existing.card_id);
    if (card) return { ok: true, card, alreadyDrawn: true };
  }

  if (!skipSitCheck && !(await hasSatToday())) {
    return { ok: false, error: "今天先坐一下，再來抽卡。" };
  }

  const card = CARDS[Math.floor(Math.random() * CARDS.length)];

  const { error } = await supabase
    .from("daily_cards")
    .insert({ user_id: user.id, card_id: card.id, drawn_on: today });

  if (error) {
    // 23505 = 同時兩個裝置同時抽，UNIQUE 擋下 → 重讀那一張回傳
    if (error.code === "23505") {
      const { data: raced } = await supabase
        .from("daily_cards")
        .select("card_id")
        .eq("user_id", user.id)
        .eq("drawn_on", today)
        .maybeSingle();
      const rc = raced ? getCard(raced.card_id) : null;
      if (rc) return { ok: true, card: rc, alreadyDrawn: true };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/me");
  revalidatePath("/me/cards");
  return { ok: true, card, alreadyDrawn: false };
}

export type CollectedCard = { card: Card; drawnOn: string };

/** 卡冊：抽過的所有卡，新的在前 */
export async function getMyCards(): Promise<CollectedCard[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("daily_cards")
    .select("card_id, drawn_on")
    .eq("user_id", user.id)
    .order("drawn_on", { ascending: false });

  return (data ?? [])
    .map((r) => {
      const card = getCard(r.card_id);
      return card ? { card, drawnOn: r.drawn_on as string } : null;
    })
    .filter((v): v is CollectedCard => v !== null);
}
