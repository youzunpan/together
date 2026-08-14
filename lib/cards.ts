// 每日抽卡：108 張卡文。
//
// 結構依帕坦伽利八肢（Aṣṭāṅga）展開，三等份各 36：
//   持戒 Yama 36 / 精進 Niyama 36 / 內六肢 36
// 108 呼應念珠。
//
// 中英對照，語氣溫柔、留給讀者解讀空間。全部原創（市售彩虹卡有版權，
// 不可引用或改寫）。2026-08 全面改版為「溫柔指引卡」版本；
// 上一版（Notion「彩虹卡 108 · 雙譯本對照」）留在 git 歷史裡。
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
 *
 * 天城文拼寫已對照維基百科查證（2026-08）：
 *   Yamas / Niyama / Ashtanga 三個總覽頁 + Aparigraha、Santosha 兩個專頁。
 * 兩個要注意的變體（都採用專頁的寫法）：
 *   - अपरिग्रह  Yamas 總覽頁作 अपरिग्रहः（主格帶 visarga），此處用詞幹形，
 *              與其他項目一致，也與 Aparigraha 專頁一致。
 *   - संतोष     Niyama 總覽頁作 सन्तोष（合體字 न्त），此處用鼻音符號 ं，
 *              與 Santosha 專頁一致。兩種拼法古典文獻皆有。
 * 要改這些字之前請先查證，不要憑印象改。
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

/**
 * 每一肢的插畫，當卡「正面」的底圖。
 * 放在正面而不是背面：背面必須整副一樣（否則翻開前就先知道是哪一肢，
 * 而且 /sit 上那張卡是在抽之前就顯示，那時還沒有肢），正面才是揭曉的地方。
 */
export const LIMB_ART: Record<Limb, string> = {
  yama: "/cards/limbs/yama.png",
  niyama: "/cards/limbs/niyama.png",
  asana: "/cards/limbs/asana.png",
  pranayama: "/cards/limbs/pranayama.png",
  pratyahara: "/cards/limbs/pratyahara.png",
  dharana: "/cards/limbs/dharana.png",
  dhyana: "/cards/limbs/dhyana.png",
  samadhi: "/cards/limbs/samadhi.png",
};

export function cardSanskrit(card: Card): SanskritLabel {
  return (card.theme && THEME_SANSKRIT[card.theme]) || LIMB_SANSKRIT[card.limb];
}

export const CARDS: Card[] = [
  // ── 持戒 Yama ─────────────────────────────
  // 非暴力 Ahimsa
  { id: 1, limb: "yama", theme: "非暴力", en: "You don't have to be so hard on yourself about this.", zh: "有些事，不必再對自己那麼用力。" },
  { id: 2, limb: "yama", theme: "非暴力", en: "With a little gentleness, things may begin to soften.", zh: "溫柔一點，也許一切就會慢慢鬆開。" },
  { id: 3, limb: "yama", theme: "非暴力", en: "You don't have to hold everything together every time.", zh: "你不必每次都撐住一切。" },
  { id: 4, limb: "yama", theme: "非暴力", en: "Today, let blame wait.", zh: "今天，先別急著責怪任何人。" },
  { id: 5, limb: "yama", theme: "非暴力", en: "Some wounds need quiet more than answers.", zh: "有些傷口，需要的不是答案，而是安靜。" },
  { id: 6, limb: "yama", theme: "非暴力", en: "Letting something go can also set you free.", zh: "放下一件事，也是在放過自己。" },
  { id: 7, limb: "yama", theme: "非暴力", en: "Sometimes non-harming simply means not adding to the hurt.", zh: "有時候，不再讓傷口加深，也是一種不傷害。" },
  { id: 8, limb: "yama", theme: "非暴力", en: "You can be strong and still be soft.", zh: "你可以很有力量，也依然很柔軟。" },
  // 真實 Satya
  { id: 9, limb: "yama", theme: "真實", en: "Some part of you already knows.", zh: "你心裡其實已經知道了。" },
  { id: 10, limb: "yama", theme: "真實", en: "You don't have to convince yourself just yet.", zh: "不必急著說服自己。" },
  { id: 11, limb: "yama", theme: "真實", en: "The thought that keeps returning may be asking to be heard.", zh: "那個反覆出現的念頭，也許值得聽一聽。" },
  { id: 12, limb: "yama", theme: "真實", en: "Some answers become clear only after they are spoken.", zh: "有些答案，說出口之後才會變得清楚。" },
  { id: 13, limb: "yama", theme: "真實", en: "What truly fits you rarely needs much explaining.", zh: "真正適合你的，通常不需要太多解釋。" },
  { id: 14, limb: "yama", theme: "真實", en: "For now, simply acknowledge what you feel.", zh: "先承認現在的感覺就好。" },
  { id: 15, limb: "yama", theme: "真實", en: "When you stop forcing things, they begin to show themselves as they are.", zh: "當你不再勉強，一切會顯露出原來的樣子。" },
  // 不偷盜 Asteya
  { id: 16, limb: "yama", theme: "不偷盜", en: "Someone else's path was never shaped for your feet.", zh: "別人的路，終究不會更適合你的腳步。" },
  { id: 17, limb: "yama", theme: "不偷盜", en: "You don't need to borrow answers from someone else's life.", zh: "你不必到別人的人生裡尋找答案。" },
  { id: 18, limb: "yama", theme: "不偷盜", en: "Keep your time for what truly matters.", zh: "把時間留給真正重要的事。" },
  { id: 19, limb: "yama", theme: "不偷盜", en: "Some things seem more precious simply because they are out of reach.", zh: "有些東西之所以顯得特別，只是因為它不在你手裡。" },
  { id: 20, limb: "yama", theme: "不偷盜", en: "What you already have deserves to be seen.", zh: "你已經擁有的一切，也值得被好好看見。" },
  { id: 21, limb: "yama", theme: "不偷盜", en: "When comparison quiets, something within you returns.", zh: "不再比較的那一刻，你也會找回一部分的自己。" },
  // 節制 Brahmacharya
  { id: 22, limb: "yama", theme: "節制", en: "You don't have to spend all your energy today.", zh: "今天，不必把所有力氣都用完。" },
  { id: 23, limb: "yama", theme: "節制", en: "Sometimes, doing just enough is enough.", zh: "有些事，做到剛剛好就很好。" },
  { id: 24, limb: "yama", theme: "節制", en: "Leave a little room for tomorrow.", zh: "留一點空間給明天。" },
  { id: 25, limb: "yama", theme: "節制", en: "Not every invitation needs a yes.", zh: "不是所有邀請，都需要答應。" },
  { id: 26, limb: "yama", theme: "節制", en: "Your energy deserves care, too.", zh: "你的能量，也值得被好好照顧。" },
  { id: 27, limb: "yama", theme: "節制", en: "Sometimes less brings you closer to what you really want.", zh: "有時候，少一些，反而更靠近真正想要的。" },
  { id: 28, limb: "yama", theme: "節制", en: "Let your light fall where it matters most.", zh: "把你的光，留給值得照亮的地方。" },
  // 不執取 Aparigraha
  { id: 29, limb: "yama", theme: "不執取", en: "Some things begin to flow again only when you loosen your grip.", zh: "有些事情，要等你鬆開手之後，才會重新流動。" },
  { id: 30, limb: "yama", theme: "不執取", en: "You don't have to keep everything.", zh: "不必急著把一切留住。" },
  { id: 31, limb: "yama", theme: "不執取", en: "Some departures are simply making room for something new.", zh: "有些離開，只是在為新的事物騰出空間。" },
  { id: 32, limb: "yama", theme: "不執取", en: "Open your hands a little and see what else they can receive.", zh: "把手鬆開一點，你才知道還能接住什麼。" },
  { id: 33, limb: "yama", theme: "不執取", en: "What isn't yours does not need to be held so tightly.", zh: "不屬於你的東西，不必一直用力握著。" },
  { id: 34, limb: "yama", theme: "不執取", en: "Some answers appear only when you stop chasing them.", zh: "有些答案，要等你不再追尋時才會出現。" },
  { id: 35, limb: "yama", theme: "不執取", en: "You can cherish something without needing to possess it.", zh: "你可以珍惜，而不必佔有。" },
  { id: 36, limb: "yama", theme: "不執取", en: "Letting go does not always mean losing.", zh: "放下，不代表失去。" },

  // ── 精進 Niyama ───────────────────────────
  // 潔淨 Saucha
  { id: 37, limb: "niyama", theme: "潔淨", en: "Clear a little space, and something inside you can breathe.", zh: "清理掉一些東西，心裡也會多出一點呼吸的空間。" },
  { id: 38, limb: "niyama", theme: "潔淨", en: "Some things have already walked as far with you as they were meant to.", zh: "有些事物，陪你走到這裡，就已經足夠了。" },
  { id: 39, limb: "niyama", theme: "潔淨", en: "Let life be a little simpler today.", zh: "今天，讓生活簡單一點。" },
  { id: 40, limb: "niyama", theme: "潔淨", en: "Not everything needs to come with you.", zh: "不是所有東西，都需要繼續帶著。" },
  { id: 41, limb: "niyama", theme: "潔淨", en: "When the noise fades, you can hear yourself more clearly.", zh: "當雜音少了，你會更容易聽見自己。" },
  { id: 42, limb: "niyama", theme: "潔淨", en: "Sometimes a new beginning starts with clearing one small corner.", zh: "有時候，重新開始，只需要先整理好一個角落。" },
  // 知足 Santosha
  { id: 43, limb: "niyama", theme: "知足", en: "There is something here, even now, worth appreciating.", zh: "此刻，也有值得欣賞之處。" },
  { id: 44, limb: "niyama", theme: "知足", en: "What you are waiting for may not be better than what is already here.", zh: "你所等待的，未必比眼前已有的更好。" },
  { id: 45, limb: "niyama", theme: "知足", en: "Something is already here, quietly keeping you company.", zh: "此刻，已有一份安靜的陪伴在你身旁。" },
  { id: 46, limb: "niyama", theme: "知足", en: "You don't need everything to be complete before you can feel at ease.", zh: "不必等到一切都完整，才允許自己安心。" },
  { id: 47, limb: "niyama", theme: "知足", en: "Sometimes happiness is simply not overlooking what is already here.", zh: "幸福有時候，只是沒有錯過眼前的美好。" },
  { id: 48, limb: "niyama", theme: "知足", en: "Look again at the good things you have grown used to.", zh: "再看看那些你早已習以為常的美好。" },
  { id: 49, limb: "niyama", theme: "知足", en: "Enough is not always a number.", zh: "足夠，不一定是一個數字。" },
  { id: 50, limb: "niyama", theme: "知足", en: "This moment can be a place to rest.", zh: "這一刻，也可以是一個停靠的地方。" },
  // 自律 Tapas
  { id: 51, limb: "niyama", theme: "自律", en: "Just go a little farther. That is enough for now.", zh: "再走一點點就好。" },
  { id: 52, limb: "niyama", theme: "自律", en: "Showing up today is already enough.", zh: "今天，你願意來到這裡，本身就已經足夠。" },
  { id: 53, limb: "niyama", theme: "自律", en: "You don't have to move fast. Just stay with it.", zh: "不需要走得很快，只要繼續走下去就好。" },
  { id: 54, limb: "niyama", theme: "自律", en: "Change may still be happening even when you cannot see it.", zh: "即使看不見，變化也可能正在發生。" },
  { id: 55, limb: "niyama", theme: "自律", en: "Some things need time to deepen.", zh: "有些事情，需要時間，才會慢慢變得深刻。" },
  { id: 56, limb: "niyama", theme: "自律", en: "A little persistence can slowly change your course.", zh: "再小的堅持，也會慢慢改變你前進的方向。" },
  { id: 57, limb: "niyama", theme: "自律", en: "This discomfort may be making room for something new.", zh: "眼前的不舒服，也許正為新的可能騰出空間。" },
  // 自我研習 Svadhyaya
  { id: 58, limb: "niyama", theme: "自我研習", en: "What is it about this that keeps bringing you back here?", zh: "這件事為什麼又讓你停在這裡？" },
  { id: 59, limb: "niyama", theme: "自我研習", en: "Sometimes your reaction has more to show you than the event itself.", zh: "有些反應，比事情本身更值得被看見。" },
  { id: 60, limb: "niyama", theme: "自我研習", en: "Before changing anything, let yourself see it clearly.", zh: "先別急著改變，先好好看清楚。" },
  { id: 61, limb: "niyama", theme: "自我研習", en: "What keeps repeating may be trying to tell you something.", zh: "有些事情一再出現，也許是想提醒你什麼。" },
  { id: 62, limb: "niyama", theme: "自我研習", en: "You know yourself more deeply than you think.", zh: "你比自己以為的，更了解自己。" },
  { id: 63, limb: "niyama", theme: "自我研習", en: "Go a little deeper. There may be another feeling underneath.", zh: "再往內看一些，可能還有另一層感受。" },
  { id: 64, limb: "niyama", theme: "自我研習", en: "Some things can only be understood in quiet.", zh: "有些事情，只有在安靜下來之後，才會明白。" },
  // 交託 Ishvara Pranidhana
  { id: 65, limb: "niyama", theme: "交託", en: "Some things are not yours to finish.", zh: "有些事情，不一定要由你來完成。" },
  { id: 66, limb: "niyama", theme: "交託", en: "Today, loosen your need for control just a little.", zh: "今天，試著少掌控一點。" },
  { id: 67, limb: "niyama", theme: "交託", en: "You don't need to know where this will lead.", zh: "你不需要知道最後會去哪裡。" },
  { id: 68, limb: "niyama", theme: "交託", en: "When the next step appears, you will recognize it.", zh: "當下一步浮現時，你自然會看見。" },
  { id: 69, limb: "niyama", theme: "交託", en: "Some burdens were never yours to carry.", zh: "有些重量，本來就不需要你一直背著。" },
  { id: 70, limb: "niyama", theme: "交託", en: "Let there be no answer for now.", zh: "允許事情暫時沒有答案。" },
  { id: 71, limb: "niyama", theme: "交託", en: "You have done what you can. You can release the rest.", zh: "你已經做了所能做的，剩下的可以交出去。" },
  { id: 72, limb: "niyama", theme: "交託", en: "Sometimes trust is simply letting things keep unfolding.", zh: "有時候，信任就是先讓事情繼續展開。" },

  // ── 內六肢 ────────────────────────────────
  // 體位 Asana
  { id: 73, limb: "asana", theme: null, en: "Find a place where you do not have to force yourself.", zh: "找一個不需要勉強自己的位置。" },
  { id: 74, limb: "asana", theme: null, en: "Steadiness does not have to take so much effort.", zh: "穩定，不一定要很用力。" },
  { id: 75, limb: "asana", theme: null, en: "Your body may already have answered for you.", zh: "你的身體，可能早已替你說出了答案。" },
  { id: 76, limb: "asana", theme: null, en: "When the ground beneath you feels steady, fewer things feel urgent.", zh: "當腳下安穩，很多事情就沒那麼急。" },
  { id: 77, limb: "asana", theme: null, en: "Come back to your body. Stay for a while.", zh: "回到身體裡，待一下。" },
  { id: 78, limb: "asana", theme: null, en: "You do not always need to be somewhere else.", zh: "你不需要一直往別的地方去。" },
  { id: 79, limb: "asana", theme: null, en: "You can let the ground carry some of the weight.", zh: "有些重量，可以交給地面。" },
  // 調息 Pranayama
  { id: 80, limb: "pranayama", theme: null, en: "Breathe first. You can decide afterward.", zh: "先呼吸，再決定也不遲。" },
  { id: 81, limb: "pranayama", theme: null, en: "Let a little go, and something new will have room to enter.", zh: "先輕輕呼出去，才有空間讓新的進來。" },
  { id: 82, limb: "pranayama", theme: null, en: "As your breath slows, the world may slow with it.", zh: "呼吸慢下來，世界也會跟著慢一點。" },
  { id: 83, limb: "pranayama", theme: null, en: "Let this breath remind you that, in this moment, everything is okay.", zh: "讓這一口氣告訴你：現在沒事。" },
  { id: 84, limb: "pranayama", theme: null, en: "You do not have to pull the breath in. It will come on its own.", zh: "不必用力吸，空氣自然會來。" },
  { id: 85, limb: "pranayama", theme: null, en: "There is a little space between each breath.", zh: "每一口呼吸之間，都留著一點空白。" },
  { id: 86, limb: "pranayama", theme: null, en: "Come back with your breath, just once today.", zh: "今天，讓呼吸帶你回來一次。" },
  // 制感 Pratyahara
  { id: 87, limb: "pratyahara", theme: null, en: "Not every voice needs your response.", zh: "不是每一個聲音，都需要回應。" },
  { id: 88, limb: "pratyahara", theme: null, en: "What is outside can remain outside for a while.", zh: "外面的事情，可以暫時留在外面。" },
  { id: 89, limb: "pratyahara", theme: null, en: "As things grow quieter, you may hear another voice.", zh: "安靜一點，你會聽見另一種聲音。" },
  { id: 90, limb: "pratyahara", theme: null, en: "The world can wait a little longer for your reply.", zh: "今天，你可以晚一點再回覆世界。" },
  { id: 91, limb: "pratyahara", theme: null, en: "There has always been a place within you that no one else can disturb.", zh: "你心裡一直有一個地方，沒有人能夠打擾。" },
  { id: 92, limb: "pratyahara", theme: null, en: "Come back in. The storm outside can wait.", zh: "先回來吧，外面的風雨可以晚一點再面對。" },
  // 專注 Dharana
  { id: 93, limb: "dharana", theme: null, en: "For now, stay with just this one thing.", zh: "現在，只做眼前這一件事。" },
  { id: 94, limb: "dharana", theme: null, en: "You do not have to think through everything all at once.", zh: "你不必一次想清楚所有事情。" },
  { id: 95, limb: "dharana", theme: null, en: "When your attention wanders, simply return.", zh: "分心了，再回來就好。" },
  { id: 96, limb: "dharana", theme: null, en: "Some things become clearer when held lightly.", zh: "有些事情，輕輕地放在心上，反而看得更清楚。" },
  { id: 97, limb: "dharana", theme: null, en: "Every return counts.", zh: "每一次回來，都算數。" },
  { id: 98, limb: "dharana", theme: null, en: "When what truly matters comes forward, everything else slowly falls away.", zh: "當真正重要的事浮現，其他的就會慢慢退開。" },
  // 禪那 Dhyana
  { id: 99, limb: "dhyana", theme: null, en: "There comes a moment when you forget you are trying.", zh: "有一刻，你會忘記自己正在努力。" },
  { id: 100, limb: "dhyana", theme: null, en: "Stay with the quiet a little longer, and you will not need to follow every thought.", zh: "在安靜裡多待一會兒，就不必再追著每一個念頭走。" },
  { id: 101, limb: "dhyana", theme: null, en: "You can remain here without holding on to anything.", zh: "不必抓住什麼，也可以待在這裡。" },
  { id: 102, limb: "dhyana", theme: null, en: "There has always been space between your thoughts.", zh: "念頭之間，其實一直有空間。" },
  { id: 103, limb: "dhyana", theme: null, en: "Some stillness cannot be made. You can only let it arrive.", zh: "有些平靜，無法刻意創造，只能讓它自然到來。" },
  // 三摩地 Samadhi
  { id: 104, limb: "samadhi", theme: null, en: "Sometimes you are closer to what is before you than you realize.", zh: "有時候，你和眼前這一刻的距離，比想像中更近。" },
  { id: 105, limb: "samadhi", theme: null, en: "When you stop standing outside the moment, all that remains is what is happening.", zh: "當你全然回到這一刻，眼前就只剩下正在發生的一切。" },
  { id: 106, limb: "samadhi", theme: null, en: "There comes a moment when nothing needs a name.", zh: "有一刻，不需要再替事情命名。" },
  { id: 107, limb: "samadhi", theme: null, en: "When stillness grows deep enough, even the self can be set down for a while.", zh: "在足夠深的寂靜裡，連「我」也可以暫時放下。" },
  { id: 108, limb: "samadhi", theme: null, en: "When the boundaries soften, you may find that you were never separate from it.", zh: "當邊界漸漸鬆開，你會發現，自己從未與這一切分離。" },
];

/** id -> Card，給抽卡紀錄回查用 */
export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function getCard(id: number): Card | undefined {
  return CARD_BY_ID.get(id);
}
