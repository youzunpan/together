// 每日抽卡：108 張卡文。
//
// 結構依帕坦伽利八肢（Aṣṭāṅga）展開，三等份各 36：
//   持戒 Yama 36 / 精進 Niyama 36 / 內六肢 36
// 108 呼應念珠。
//
// 英文為原稿，中文為口語＋彩虹卡語氣的譯本。全部原創（市售彩虹卡有版權，
// 不可引用或改寫）。定稿來源：Notion「彩虹卡 108 · 雙譯本對照」。
//
// limb / theme 只給後台跟卡冊分類用，抽卡時「不對使用者顯示」——
// 讓讀者自己把卡投射到當下的狀態。

export type Limb =
  | "yama"
  | "niyama"
  | "asana"
  | "pranayama"
  | "pratyahara"
  | "dharana"
  | "dhyana"
  | "samadhi";

export type Card = {
  /** 1–108，穩定不變，DB 只存這個 id */
  id: number;
  limb: Limb;
  /** 子主題（Yama / Niyama 才有，內六肢為 null） */
  theme: string | null;
  en: string;
  zh: string;
};

export const LIMB_LABEL: Record<Limb, string> = {
  yama: "持戒",
  niyama: "精進",
  asana: "體位",
  pranayama: "調息",
  pratyahara: "制感",
  dharana: "專注",
  dhyana: "禪那",
  samadhi: "三摩地",
};

/**
 * 卡片底部的出處標籤：天城文 + 羅馬轉寫，不放中文。
 * 天城文對多數讀者是看不懂的符號，正好維持距離感 —— 讓人知道這句話有來歷，
 * 但不會像中文標籤那樣先把答案講死。
 *
 * 羅馬轉寫刻意不用 IAST 變音符號（ā ś ṣ ṇ ṃ ī）：Space Mono 沒有這些字符，
 * 會 fallback 成別的字型，同一行字看起來會東拼西湊。
 */
export type SanskritLabel = { dev: string; roman: string };

/** Yama / Niyama 的十個子主題（比「持戒」「精進」更精確） */
const THEME_SANSKRIT: Record<string, SanskritLabel> = {
  非暴力: { dev: "अहिंसा", roman: "AHIMSA" },
  真實: { dev: "सत्य", roman: "SATYA" },
  不偷盜: { dev: "अस्तेय", roman: "ASTEYA" },
  節制: { dev: "ब्रह्मचर्य", roman: "BRAHMACHARYA" },
  不執取: { dev: "अपरिग्रह", roman: "APARIGRAHA" },
  潔淨: { dev: "शौच", roman: "SAUCHA" },
  知足: { dev: "संतोष", roman: "SANTOSHA" },
  自律: { dev: "तपस्", roman: "TAPAS" },
  自我研習: { dev: "स्वाध्याय", roman: "SVADHYAYA" },
  交託: { dev: "ईश्वरप्रणिधान", roman: "ISHVARA PRANIDHANA" },
};

/** 內六肢沒有子主題，直接用肢名 */
const LIMB_SANSKRIT: Record<Limb, SanskritLabel> = {
  yama: { dev: "यम", roman: "YAMA" },
  niyama: { dev: "नियम", roman: "NIYAMA" },
  asana: { dev: "आसन", roman: "ASANA" },
  pranayama: { dev: "प्राणायाम", roman: "PRANAYAMA" },
  pratyahara: { dev: "प्रत्याहार", roman: "PRATYAHARA" },
  dharana: { dev: "धारणा", roman: "DHARANA" },
  dhyana: { dev: "ध्यान", roman: "DHYANA" },
  samadhi: { dev: "समाधि", roman: "SAMADHI" },
};

export function cardSanskrit(card: Card): SanskritLabel {
  return (card.theme && THEME_SANSKRIT[card.theme]) || LIMB_SANSKRIT[card.limb];
}

export const CARDS: Card[] = [
  // ── 持戒 Yama ─────────────────────────────
  // 非暴力 Ahimsa
  { id: 1, limb: "yama", theme: "非暴力", en: "The war inside costs the most.", zh: "心裡的那場仗，總是最消耗你。" },
  { id: 2, limb: "yama", theme: "非暴力", en: "Gentleness reaches where force never gets.", zh: "有些地方，只有溫柔能夠抵達。" },
  { id: 3, limb: "yama", theme: "非暴力", en: "Something in you softens when you stop attacking it.", zh: "當你不再責怪自己，心也會慢慢柔軟下來。" },
  { id: 4, limb: "yama", theme: "非暴力", en: "Every sharp word lands somewhere.", zh: "每一句尖銳的話，都會在某個地方留下痕跡。" },
  { id: 5, limb: "yama", theme: "非暴力", en: "Someone has to soften first.", zh: "總要有一個人先柔軟下來，那個人可以是你。" },
  { id: 6, limb: "yama", theme: "非暴力", en: "What you refuse to wound stays whole.", zh: "你選擇不去傷害的，會因此保有完整。" },
  { id: 7, limb: "yama", theme: "非暴力", en: "Some of the kindness was meant for you.", zh: "別忘了，也留一份溫柔給自己。" },
  { id: 8, limb: "yama", theme: "非暴力", en: "The hand that unclenches can still be strong.", zh: "願意鬆開的手，依然可以很有力量。" },
  // 真實 Satya
  { id: 9, limb: "yama", theme: "真實", en: "You don't have to explain yourself to everyone.", zh: "你不需要對每個人解釋自己。" },
  { id: 10, limb: "yama", theme: "真實", en: "A mask learns your face and keeps it.", zh: "面具戴久了，會讓你忘記自己的臉。" },
  { id: 11, limb: "yama", theme: "真實", en: "Breathing is easier without the story.", zh: "不再替自己編故事，呼吸也會變得輕鬆。" },
  { id: 12, limb: "yama", theme: "真實", en: "Say the smaller true thing.", zh: "把那句小小的真話，說出來吧。" },
  { id: 13, limb: "yama", theme: "真實", en: "What you hide grows in the dark.", zh: "你藏起來的，會在黑暗裡悄悄長大。" },
  { id: 14, limb: "yama", theme: "真實", en: "Truth doesn't need to be loud.", zh: "真話不需要大聲。" },
  { id: 15, limb: "yama", theme: "真實", en: "Being seen is worth the risk.", zh: "被真正看見，值得你冒一點險。" },
  // 不偷盜 Asteya
  { id: 16, limb: "yama", theme: "不偷盜", en: "Wanting what's theirs leaves you with neither.", zh: "當你一直望著別人的，自己的也會從手裡溜走。" },
  { id: 17, limb: "yama", theme: "不偷盜", en: "Take only what you came for.", zh: "只取你真正需要的那一份。" },
  { id: 18, limb: "yama", theme: "不偷盜", en: "The hours you take from yourself never come back.", zh: "從自己身上偷走的時間，不會再回來了。" },
  { id: 19, limb: "yama", theme: "不偷盜", en: "Nothing borrowed ever sits quite right.", zh: "借來的東西，怎麼放都不會真正安穩。" },
  { id: 20, limb: "yama", theme: "不偷盜", en: "Enough is already here to be found.", zh: "知足，才發現一切近在咫尺。" },
  { id: 21, limb: "yama", theme: "不偷盜", en: "Comparison quietly robs you.", zh: "比較，會悄悄拿走你原本擁有的。" },
  // 節制 Brahmacharya
  { id: 22, limb: "yama", theme: "節制", en: "Not everything asks for all of you.", zh: "不是每件事，都需要你傾盡所有。" },
  { id: 23, limb: "yama", theme: "節制", en: "Spent energy leaves a shape behind.", zh: "你把力氣花在哪裡，生命就會留下那個形狀。" },
  { id: 24, limb: "yama", theme: "節制", en: "A little less is often plenty.", zh: "少一點，常常已經很足夠。" },
  { id: 25, limb: "yama", theme: "節制", en: "A small steady flame outlasts a blaze.", zh: "一簇安穩的小火，比烈焰燃燒得更久。" },
  { id: 26, limb: "yama", theme: "節制", en: "Save something for the walk home.", zh: "留一點力氣，陪自己走回家。" },
  { id: 27, limb: "yama", theme: "節制", en: "Desire fed grows hungrier.", zh: "慾望餵得越飽，就越餓。" },
  { id: 28, limb: "yama", theme: "節制", en: "Choose where your fire goes.", zh: "把你的火，留給真正值得的地方。" },
  // 不執取 Aparigraha
  { id: 29, limb: "yama", theme: "不執取", en: "The empty hand is the free one.", zh: "空著的手，才能自在。" },
  { id: 30, limb: "yama", theme: "不執取", en: "Held too tight, less remains.", zh: "抓得越緊，真正留下的反而越少。" },
  { id: 31, limb: "yama", theme: "不執取", en: "What you own long enough owns you.", zh: "有些東西擁有久了，也會反過來擁有你。" },
  { id: 32, limb: "yama", theme: "不執取", en: "Wind moves through the loosened place.", zh: "放鬆，風才有流動的空間。" },
  { id: 33, limb: "yama", theme: "不執取", en: "What you let go of doesn't really leave.", zh: "真正屬於你的，不會因為放下就消失。" },
  { id: 34, limb: "yama", theme: "不執取", en: "Light things travel far.", zh: "輕一點，才能走得更遠。" },
  { id: 35, limb: "yama", theme: "不執取", en: "Let go of what won't be held.", zh: "握不住的，就讓它走吧。" },
  { id: 36, limb: "yama", theme: "不執取", en: "Full hands can't receive.", zh: "手裡裝得太滿，就什麼也接不住。" },

  // ── 精進 Niyama ───────────────────────────
  // 潔淨 Saucha
  { id: 37, limb: "niyama", theme: "潔淨", en: "Clear the space and the space clears you.", zh: "當你整理空間的時候，空間也會回應你。" },
  { id: 38, limb: "niyama", theme: "潔淨", en: "What you no longer use still takes up room.", zh: "已經不再需要的，仍然佔著你的地方。" },
  { id: 39, limb: "niyama", theme: "潔淨", en: "Clean water shows the bottom.", zh: "水清了，就看得見底。" },
  { id: 40, limb: "niyama", theme: "潔淨", en: "Clearing is a kind of care.", zh: "清理，也是一種照顧自己的方式。" },
  { id: 41, limb: "niyama", theme: "潔淨", en: "A swept room changes the mind inside it.", zh: "房間掃乾淨了，心也會換一口氣。" },
  { id: 42, limb: "niyama", theme: "潔淨", en: "A clear space makes clear thoughts.", zh: "空間清爽了，念頭也會跟著清楚。" },
  // 知足 Santosha
  { id: 43, limb: "niyama", theme: "知足", en: "Enough has nothing to do with amount.", zh: "「足夠」從來不是一個數字。" },
  { id: 44, limb: "niyama", theme: "知足", en: "What's always there is easiest to miss.", zh: "一直陪在身邊的，最容易忘記珍惜。" },
  { id: 45, limb: "niyama", theme: "知足", en: "The hardest day still hides one small thing.", zh: "再難的一天，也藏著一件值得微笑的小事。" },
  { id: 46, limb: "niyama", theme: "知足", en: "Contentment is a place to rest.", zh: "知足，是讓心停下來休息的地方。" },
  { id: 47, limb: "niyama", theme: "知足", en: "Look again at what's already yours.", zh: "再看一眼，你已經擁有的。" },
  { id: 48, limb: "niyama", theme: "知足", en: "Joy keeps to small places.", zh: "快樂，都躲在很小的地方。" },
  { id: 49, limb: "niyama", theme: "知足", en: "One good cup can hold up an afternoon.", zh: "一杯好茶，也能穩穩托住一個下午。" },
  { id: 50, limb: "niyama", theme: "知足", en: "The life you have is asking to be noticed.", zh: "你現在的生活，正在等你看見它。" },
  // 自律 Tapas
  { id: 51, limb: "niyama", theme: "自律", en: "Discipline is just kindness repeated.", zh: "自律，其實是重複了很多次的溫柔。" },
  { id: 52, limb: "niyama", theme: "自律", en: "Showing up is most of it.", zh: "願意出現，你就已經走完大半。" },
  { id: 53, limb: "niyama", theme: "自律", en: "Begin before you feel ready.", zh: "不必等到準備好，先開始就好。" },
  { id: 54, limb: "niyama", theme: "自律", en: "Roots grow while nothing shows.", zh: "什麼也看不見的時候，根正在地下生長。" },
  { id: 55, limb: "niyama", theme: "自律", en: "Good things usually take longer.", zh: "真正好的東西，通常不急著長成。" },
  { id: 56, limb: "niyama", theme: "自律", en: "The small daily thing outlasts the grand gesture.", zh: "每天一點點，比偶爾用盡全力走得更久。" },
  { id: 57, limb: "niyama", theme: "自律", en: "What you practice, you become.", zh: "你反覆練習的，會慢慢變成你。" },
  // 自我研習 Svadhyaya
  { id: 58, limb: "niyama", theme: "自我研習", en: "Watch what you do when no one's looking.", zh: "看看沒有人注視時，你會怎麼對待自己。" },
  { id: 59, limb: "niyama", theme: "自我研習", en: "What irritates you is pointing somewhere.", zh: "那些讓你不舒服的，也許正在指向一個答案。" },
  { id: 60, limb: "niyama", theme: "自我研習", en: "Read yourself the way you'd read a book.", zh: "像讀一本喜歡的書那樣，慢慢讀懂自己。" },
  { id: 61, limb: "niyama", theme: "自我研習", en: "The pattern repeats until it's seen.", zh: "同一件事會反覆回來，直到你真正看見它。" },
  { id: 62, limb: "niyama", theme: "自我研習", en: "You already know more than you admit.", zh: "其實你知道的，比自己願意承認的更多。" },
  { id: 63, limb: "niyama", theme: "自我研習", en: "Ask what's underneath the feeling.", zh: "輕輕問自己：這個感覺底下，還有什麼？" },
  { id: 64, limb: "niyama", theme: "自我研習", en: "Some answers only come in silence.", zh: "有些答案，只在安靜的時候才來。" },
  // 交託 Ishvara Pranidhana
  { id: 65, limb: "niyama", theme: "交託", en: "Some things open only when you stop pulling.", zh: "有些門，只有在你不再用力拉時才會打開。" },
  { id: 66, limb: "niyama", theme: "交託", en: "The one who lets go arrives first.", zh: "願意放手的人，反而更早抵達。" },
  { id: 67, limb: "niyama", theme: "交託", en: "You don't need the whole road to take a step.", zh: "不必看見整條路，也能走好眼前這一步。" },
  { id: 68, limb: "niyama", theme: "交託", en: "Let something carry you for once.", zh: "這一次，也讓別的力量托住你。" },
  { id: 69, limb: "niyama", theme: "交託", en: "Not everything is yours to fix.", zh: "不是每一件事，都需要由你修好。" },
  { id: 70, limb: "niyama", theme: "交託", en: "Trust is what you do before you know.", zh: "信任，是還不知道答案時，也願意往前一步。" },
  { id: 71, limb: "niyama", theme: "交託", en: "The seed doesn't worry about becoming.", zh: "種子不會擔心，自己能不能長成一棵樹。" },
  { id: 72, limb: "niyama", theme: "交託", en: "Give the outcome away.", zh: "把努力留給自己，把結果交出去。" },

  // ── 內六肢 ────────────────────────────────
  // 體位 Asana
  { id: 73, limb: "asana", theme: null, en: "Find the place where you can stay.", zh: "找到那個，你待得住的位置。" },
  { id: 74, limb: "asana", theme: null, en: "Steady and easy, both at once.", zh: "穩穩的，也鬆鬆的。" },
  { id: 75, limb: "asana", theme: null, en: "The body knows before the mind does.", zh: "身體，比腦袋先知道。" },
  { id: 76, limb: "asana", theme: null, en: "Deep roots don't fear wind.", zh: "根扎得深，就不必害怕風來。" },
  { id: 77, limb: "asana", theme: null, en: "Come back to the soles of your feet.", zh: "回到腳底，回到此刻。" },
  { id: 78, limb: "asana", theme: null, en: "You're already where you need to be.", zh: "你已經在該在的地方了。" },
  { id: 79, limb: "asana", theme: null, en: "Meet the body where it is today.", zh: "今天的身體是什麼樣子，就從那裡開始。" },
  // 調息 Pranayama
  { id: 80, limb: "pranayama", theme: null, en: "Breath is the line that brings you back.", zh: "呼吸，是帶你回到自己的那條路。" },
  { id: 81, limb: "pranayama", theme: null, en: "Empty out before you try to fill.", zh: "先把舊的吐出去，新的才進得來。" },
  { id: 82, limb: "pranayama", theme: null, en: "The breath goes first and the mind follows.", zh: "讓呼吸先慢下來，心會跟著回來。" },
  { id: 83, limb: "pranayama", theme: null, en: "Slow the breath and the day slows with it.", zh: "呼吸慢下來，一整天也會跟著慢下來。" },
  { id: 84, limb: "pranayama", theme: null, en: "Let the air do the work.", zh: "呼吸是一件不需努力的事情。" },
  { id: 85, limb: "pranayama", theme: null, en: "The breath is always here.", zh: "呼吸一直都在，隨時等你回來。" },
  { id: 86, limb: "pranayama", theme: null, en: "One breath is enough to begin again.", zh: "一個呼吸，就足夠重新開始。" },
  // 制感 Pratyahara
  { id: 87, limb: "pratyahara", theme: null, en: "Close one door and hear another.", zh: "關上一扇門，你會聽見另一種聲音。" },
  { id: 88, limb: "pratyahara", theme: null, en: "The noise outside is easier to leave than you think.", zh: "外面的喧鬧，比你想像中更容易放下。" },
  { id: 89, limb: "pratyahara", theme: null, en: "Turn the volume down and something appears.", zh: "外在聲音變小，內在聲音便浮現。" },
  { id: 90, limb: "pratyahara", theme: null, en: "Let the world knock; you don't have to answer.", zh: "世界可以繼續敲門，你不必每一次都回應。" },
  { id: 91, limb: "pratyahara", theme: null, en: "There's a room inside that no one can enter.", zh: "保留一個只有自己的內在空間。" },
  { id: 92, limb: "pratyahara", theme: null, en: "Come in from the weather.", zh: "從外面的風雨裡，回到自己裡面吧。" },
  // 專注 Dharana
  { id: 93, limb: "dharana", theme: null, en: "One thing, then one thing again.", zh: "專注在眼前的每一件事。" },
  { id: 94, limb: "dharana", theme: null, en: "The mind quiets around a single point.", zh: "當心停在一個點上，周圍就會慢慢安靜。" },
  { id: 95, limb: "dharana", theme: null, en: "Returning is the whole practice.", zh: "每一次回來，都是完整的練習。" },
  { id: 96, limb: "dharana", theme: null, en: "Hold it lightly and it stays.", zh: "溫柔提起才能穩穩留下。" },
  { id: 97, limb: "dharana", theme: null, en: "Wherever it wanders, bring it back.", zh: "無論心走到哪裡，都再溫柔地帶它回來。" },
  { id: 98, limb: "dharana", theme: null, en: "Getting distracted is part of the practice.", zh: "分心，本來就是練習的一部分。" },
  // 禪那 Dhyana
  { id: 99, limb: "dhyana", theme: null, en: "The returning stops being needed.", zh: "到後來，你不再需要一次次把心帶回來。" },
  { id: 100, limb: "dhyana", theme: null, en: "Attention becomes a place you rest in.", zh: "專注，會變成心可以安放的地方。" },
  { id: 101, limb: "dhyana", theme: null, en: "Nothing to hold, and it holds anyway.", zh: "沒有什麼需要你抓住了，你卻還是穩穩地被接住。" },
  { id: 102, limb: "dhyana", theme: null, en: "Thoughts come and go; you can just watch.", zh: "念頭來來去去，你只要看著就好。" },
  { id: 103, limb: "dhyana", theme: null, en: "Stillness stops being something you do.", zh: "有一天，寧靜不再需要由你創造。" },
  // 三摩地 Samadhi
  { id: 104, limb: "samadhi", theme: null, en: "There is nowhere else to be.", zh: "沒有別的地方需要去了。" },
  { id: 105, limb: "samadhi", theme: null, en: "You stop standing apart from the moment.", zh: "你不再站在這一刻之外。" },
  { id: 106, limb: "samadhi", theme: null, en: "Only the happening is left.", zh: "最後留下的，只是此刻正在發生。" },
  { id: 107, limb: "samadhi", theme: null, en: "A stillness with no one left in it.", zh: "安靜到最後，連「我」也不必留在裡面。" },
  { id: 108, limb: "samadhi", theme: null, en: "The edges quietly give way.", zh: "那些邊界，會在安靜裡輕輕讓開。" },
];

/** id -> Card，給抽卡紀錄回查用 */
export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function getCard(id: number): Card | undefined {
  return CARD_BY_ID.get(id);
}
