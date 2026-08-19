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

// 白天卡（108）：靜坐後的意圖與方向。
// 19:00 前的靜坐會抽這一組。
export const CARDS: Card[] = [
  // ── 持戒 Yama ─
  // 非暴力
  { id: 1, limb: "yama", theme: "非暴力", en: "You don't have to be so hard on yourself today.", zh: "今天，不必對自己那麼用力。" },
  { id: 2, limb: "yama", theme: "非暴力", en: "A little gentleness may help things loosen.", zh: "溫柔一點，也許事情會更容易鬆開。" },
  { id: 3, limb: "yama", theme: "非暴力", en: "Not everything has to be carried by force.", zh: "不是每件事，都需要靠撐住來完成。" },
  { id: 4, limb: "yama", theme: "非暴力", en: "Today, don't rush to blame yourself.", zh: "今天，先別急著責怪自己。" },
  { id: 5, limb: "yama", theme: "非暴力", en: "Let your strength have a softer place to rest.", zh: "讓你的力量，也有柔軟的地方。" },
  { id: 6, limb: "yama", theme: "非暴力", en: "Some things can simply be left alone.", zh: "有些事，放過它就好。" },
  { id: 7, limb: "yama", theme: "非暴力", en: "Fight one less battle with yourself today.", zh: "今天，少跟自己打一場仗。" },
  { id: 8, limb: "yama", theme: "非暴力", en: "You can be firm and still be gentle.", zh: "你可以堅定，也可以溫柔。" },
  // 真實
  { id: 9, limb: "yama", theme: "真實", en: "Today, trust what you already know.", zh: "今天，先相信那個你已經知道的。" },
  { id: 10, limb: "yama", theme: "真實", en: "You don't have to convince yourself right away.", zh: "不必急著把自己說服。" },
  { id: 11, limb: "yama", theme: "真實", en: "What you truly feel does not need polishing.", zh: "真實的感受，不需要被修飾。" },
  { id: 12, limb: "yama", theme: "真實", en: "Say one thing today without going around it.", zh: "今天，說一句不必繞路的話。" },
  { id: 13, limb: "yama", theme: "真實", en: "Some answers become clearer when things grow quiet.", zh: "有些答案，安靜下來就會比較清楚。" },
  { id: 14, limb: "yama", theme: "真實", en: "When you stop forcing, things show themselves more clearly.", zh: "不勉強的時候，事情比較容易露出原樣。" },
  { id: 15, limb: "yama", theme: "真實", en: "Today, let yourself be a little more honest.", zh: "今天，讓自己誠實一點就好。" },
  // 不偷盜
  { id: 16, limb: "yama", theme: "不偷盜", en: "Someone else's path does not have to become your direction.", zh: "別人的路，不需要變成你的方向。" },
  { id: 17, limb: "yama", theme: "不偷盜", en: "Keep your time for what truly matters.", zh: "把時間留給真正重要的事。" },
  { id: 18, limb: "yama", theme: "不偷盜", en: "Today, you don't need to borrow answers from someone else's life.", zh: "今天，不需要從別人的人生裡找答案。" },
  { id: 19, limb: "yama", theme: "不偷盜", en: "What you already have deserves to be seen.", zh: "你已經有的，也值得被看見。" },
  { id: 20, limb: "yama", theme: "不偷盜", en: "Before comparing, come back and look at your own life.", zh: "比較之前，先回來看看自己。" },
  { id: 21, limb: "yama", theme: "不偷盜", en: "Today, take only what is truly yours.", zh: "今天，只拿屬於你的那一份。" },
  // 節制
  { id: 22, limb: "yama", theme: "節制", en: "You don't have to spend all your energy today.", zh: "今天，不必把所有力氣都用完。" },
  { id: 23, limb: "yama", theme: "節制", en: "Sometimes, just enough is exactly right.", zh: "有些事，做到剛剛好就很好。" },
  { id: 24, limb: "yama", theme: "節制", en: "Leave a little room for what has not happened yet.", zh: "留一點空間給還沒發生的事。" },
  { id: 25, limb: "yama", theme: "節制", en: "Not every invitation needs a yes.", zh: "不是所有邀請，都需要答應。" },
  { id: 26, limb: "yama", theme: "節制", en: "Your energy is worth protecting, too.", zh: "你的力氣，也值得被保留。" },
  { id: 27, limb: "yama", theme: "節制", en: "Today, a little less is allowed.", zh: "今天，少一點也可以。" },
  { id: 28, limb: "yama", theme: "節制", en: "Let your light fall where it truly matters.", zh: "把你的光，留給真正重要的地方。" },
  // 不執取
  { id: 29, limb: "yama", theme: "不執取", en: "You don't have to hold everything today.", zh: "今天，不必把所有事情都抓在手裡。" },
  { id: 30, limb: "yama", theme: "不執取", en: "Some things begin to move again only when you loosen your hold.", zh: "有些東西鬆開之後，才會重新流動。" },
  { id: 31, limb: "yama", theme: "不執取", en: "Not everything you love has to stay.", zh: "不是每一樣喜歡的，都需要留下。" },
  { id: 32, limb: "yama", theme: "不執取", en: "Open your hands a little so something new can arrive.", zh: "手鬆一點，才有地方接住新的。" },
  { id: 33, limb: "yama", theme: "不執取", en: "What isn't yours does not need to be held so tightly.", zh: "不屬於你的，不需要一直用力握著。" },
  { id: 34, limb: "yama", theme: "不執取", en: "Try controlling one less thing today.", zh: "今天，試著少控制一件事。" },
  { id: 35, limb: "yama", theme: "不執取", en: "You can cherish something without needing to possess it.", zh: "你可以珍惜，而不必佔有。" },
  { id: 36, limb: "yama", theme: "不執取", en: "Letting go is not always losing.", zh: "放下，不一定等於失去。" },

  // ── 精進 Niyama ─
  // 潔淨
  { id: 37, limb: "niyama", theme: "潔淨", en: "Let life be a little simpler today.", zh: "今天，讓生活簡單一點。" },
  { id: 38, limb: "niyama", theme: "潔淨", en: "Clear a little away and leave yourself some room to breathe.", zh: "清掉一點東西，也替自己留一點空氣。" },
  { id: 39, limb: "niyama", theme: "潔淨", en: "Not everything needs to come with you.", zh: "不是所有東西，都需要繼續帶著。" },
  { id: 40, limb: "niyama", theme: "潔淨", en: "Clearing one small corner can help clear the day.", zh: "整理一個角落，也是在整理一天。" },
  { id: 41, limb: "niyama", theme: "潔淨", en: "With less noise, you can hear yourself more clearly.", zh: "雜音少一點，你會更容易聽見自己。" },
  { id: 42, limb: "niyama", theme: "潔淨", en: "Leave a little clean space in your day.", zh: "今天，留一點乾淨的空白。" },
  // 知足
  { id: 43, limb: "niyama", theme: "知足", en: "There is something here, even now, worth appreciating.", zh: "此刻，也有值得喜歡的地方。" },
  { id: 44, limb: "niyama", theme: "知足", en: "Today, remember to notice what is already here.", zh: "今天，別忘了看看已經擁有的。" },
  { id: 45, limb: "niyama", theme: "知足", en: "You don't have to wait for everything to be complete before you rest.", zh: "不必等一切完整，才允許自己安心。" },
  { id: 46, limb: "niyama", theme: "知足", en: "Sometimes happiness is simply not missing what is already here.", zh: "幸福有時只是沒有錯過眼前。" },
  { id: 47, limb: "niyama", theme: "知足", en: "Look again at the goodness you have grown used to.", zh: "看看那些你已經習以為常的好。" },
  { id: 48, limb: "niyama", theme: "知足", en: "Enough is not always a number.", zh: "足夠，不一定是一個數字。" },
  { id: 49, limb: "niyama", theme: "知足", en: "Today, it is enough simply to live this day well.", zh: "今天，也可以只是好好過今天。" },
  { id: 50, limb: "niyama", theme: "知足", en: "This moment can be a place to rest.", zh: "這一刻，也可以是一個停靠的地方。" },
  // 自律
  { id: 51, limb: "niyama", theme: "自律", en: "A little further is enough for today.", zh: "今天，只要再往前一點點就好。" },
  { id: 52, limb: "niyama", theme: "自律", en: "Showing up is already a kind of completion.", zh: "願意出現，本身就是一種完成。" },
  { id: 53, limb: "niyama", theme: "自律", en: "You don't have to move fast. Just stay with it.", zh: "不需要很快，只要沒有離開。" },
  { id: 54, limb: "niyama", theme: "自律", en: "Change may still be happening even when you cannot see it.", zh: "看不見變化的時候，變化也可能正在發生。" },
  { id: 55, limb: "niyama", theme: "自律", en: "Some things need time to grow deep.", zh: "有些事情，需要時間把它做深。" },
  { id: 56, limb: "niyama", theme: "自律", en: "Small acts of devotion can quietly change your direction.", zh: "小小的堅持，也會慢慢改變方向。" },
  { id: 57, limb: "niyama", theme: "自律", en: "Today's discomfort may simply be part of growing.", zh: "今天的不舒服，也可能是成長的一部分。" },
  // 自我研習
  { id: 58, limb: "niyama", theme: "自我研習", en: "Notice what keeps making you pause today.", zh: "今天，留意什麼事情總是讓你停下來。" },
  { id: 59, limb: "niyama", theme: "自我研習", en: "Sometimes your reaction has more to show you than the event itself.", zh: "有些反應，比事情本身更值得看看。" },
  { id: 60, limb: "niyama", theme: "自我研習", en: "Before changing anything, let yourself see it clearly.", zh: "不急著改變，先好好看見。" },
  { id: 61, limb: "niyama", theme: "自我研習", en: "What keeps repeating may be trying to show you something.", zh: "重複出現的，也許正在提醒你什麼。" },
  { id: 62, limb: "niyama", theme: "自我研習", en: "You know yourself more deeply than you think.", zh: "你比自己以為的，更了解自己。" },
  { id: 63, limb: "niyama", theme: "自我研習", en: "Today, look a little deeper into what you feel.", zh: "今天，試著再往感覺裡面看一點。" },
  { id: 64, limb: "niyama", theme: "自我研習", en: "Some things only make sense when everything grows quiet.", zh: "有些事情，安靜下來才聽得懂。" },
  // 交託
  { id: 65, limb: "niyama", theme: "交託", en: "Some things are not yours to finish.", zh: "有些事情，不一定要由你來完成。" },
  { id: 66, limb: "niyama", theme: "交託", en: "Today, loosen your need to control just a little.", zh: "今天，試著少控制一點。" },
  { id: 67, limb: "niyama", theme: "交託", en: "You don't need to know where this will lead.", zh: "你不需要知道最後會去哪裡。" },
  { id: 68, limb: "niyama", theme: "交託", en: "When the next step appears, you will see it.", zh: "下一步出現的時候，你自然會看見。" },
  { id: 69, limb: "niyama", theme: "交託", en: "Some weight was never yours to carry this long.", zh: "有些重量，本來就不需要你一直背著。" },
  { id: 70, limb: "niyama", theme: "交託", en: "Let there be no answer for now.", zh: "允許事情暫時沒有答案。" },
  { id: 71, limb: "niyama", theme: "交託", en: "You have done what you can. The rest can be released.", zh: "你已經做了能做的，剩下的可以交出去。" },
  { id: 72, limb: "niyama", theme: "交託", en: "Sometimes trust is simply letting things keep unfolding.", zh: "有時候，信任只是讓事情繼續發生。" },

  // ── 體位 Asana ─
  { id: 73, limb: "asana", theme: null, en: "Today, find a place where you do not have to force yourself.", zh: "今天，找一個不需要勉強自己的位置。" },
  { id: 74, limb: "asana", theme: null, en: "Steadiness does not have to feel hard.", zh: "穩定，不一定要很用力。" },
  { id: 75, limb: "asana", theme: null, en: "Your body may have answered before your mind did.", zh: "身體可能已經先替你回答了。" },
  { id: 76, limb: "asana", theme: null, en: "When the ground feels steady, not everything feels so urgent.", zh: "當腳下安穩，很多事情就沒那麼急。" },
  { id: 77, limb: "asana", theme: null, en: "Remember to come back into your body today.", zh: "今天，記得回到身體裡待一下。" },
  { id: 78, limb: "asana", theme: null, en: "You do not always need to be somewhere else.", zh: "你不需要一直往別的地方去。" },
  { id: 79, limb: "asana", theme: null, en: "Some weight can be given back to the ground.", zh: "有些重量，可以交給地面。" },

  // ── 調息 Pranayama ─
  { id: 80, limb: "pranayama", theme: null, en: "Breathe first. You can decide afterward.", zh: "先呼吸，再決定也不遲。" },
  { id: 81, limb: "pranayama", theme: null, en: "Empty a little, and something new can enter.", zh: "吐掉一些，才有地方讓新的進來。" },
  { id: 82, limb: "pranayama", theme: null, en: "As your breath slows, the world may soften with it.", zh: "呼吸慢下來，世界也會跟著慢一點。" },
  { id: 83, limb: "pranayama", theme: null, en: "Let this breath remind you: for this moment, everything is okay.", zh: "讓這一口氣提醒你：此刻沒事。" },
  { id: 84, limb: "pranayama", theme: null, en: "You do not have to pull the breath in. It will come.", zh: "不必用力吸，空氣自然會來。" },
  { id: 85, limb: "pranayama", theme: null, en: "There is a little space between every breath.", zh: "每一次呼吸之間，都有一點空白。" },
  { id: 86, limb: "pranayama", theme: null, en: "Come back with your breath, just once today.", zh: "今天，跟著呼吸回來一次。" },

  // ── 制感 Pratyahara ─
  { id: 87, limb: "pratyahara", theme: null, en: "Not every voice needs your response.", zh: "不是每一個聲音，都需要回應。" },
  { id: 88, limb: "pratyahara", theme: null, en: "What is outside can stay outside for a while.", zh: "外面的事情，可以暫時留在外面。" },
  { id: 89, limb: "pratyahara", theme: null, en: "When things grow quieter, you may hear another voice.", zh: "安靜一點，你會聽見另一種聲音。" },
  { id: 90, limb: "pratyahara", theme: null, en: "The world can wait a little longer for your reply today.", zh: "今天，你可以晚一點再回覆世界。" },
  { id: 91, limb: "pratyahara", theme: null, en: "There is a place within you that does not need to be disturbed.", zh: "你心裡一直有一個不被打擾的地方。" },
  { id: 92, limb: "pratyahara", theme: null, en: "Today, remember to gather some of yourself back in.", zh: "今天，也記得把自己收回來一點。" },

  // ── 專注 Dharana ─
  { id: 93, limb: "dharana", theme: null, en: "For now, stay with this one thing.", zh: "現在，只做眼前這一件事。" },
  { id: 94, limb: "dharana", theme: null, en: "You do not have to think through everything at once.", zh: "不需要同時想完所有事情。" },
  { id: 95, limb: "dharana", theme: null, en: "When you wander, simply return.", zh: "分心了，再回來就好。" },
  { id: 96, limb: "dharana", theme: null, en: "Some things become clearer when held lightly.", zh: "有些事情，輕輕放在心上反而更清楚。" },
  { id: 97, limb: "dharana", theme: null, en: "Every return counts.", zh: "每一次回來，都算數。" },
  { id: 98, limb: "dharana", theme: null, en: "When what matters becomes clear, the rest begins to fall away.", zh: "真正重要的浮出來時，其他的會慢慢退開。" },

  // ── 禪那 Dhyana ─
  { id: 99, limb: "dhyana", theme: null, en: "Leave a little time today to chase nothing.", zh: "今天，留一點時間什麼都不追。" },
  { id: 100, limb: "dhyana", theme: null, en: "Stay quiet long enough, and you do not have to follow every thought.", zh: "安靜久一點，就不必跟著每個念頭走。" },
  { id: 101, limb: "dhyana", theme: null, en: "You can remain here without holding on to anything.", zh: "不必抓住什麼，也可以待在這裡。" },
  { id: 102, limb: "dhyana", theme: null, en: "There has always been space between your thoughts.", zh: "念頭之間，其實一直有空間。" },
  { id: 103, limb: "dhyana", theme: null, en: "Some stillness cannot be made.", zh: "有些平靜，不是做出來的。" },

  // ── 三摩地 Samadhi ─
  { id: 104, limb: "samadhi", theme: null, en: "Today, try standing a little less outside your own life.", zh: "今天，試著少站在生活的外面一點。" },
  { id: 105, limb: "samadhi", theme: null, en: "Sometimes there is less distance between you and this moment than you think.", zh: "有一刻，你和眼前的事情其實沒有那麼遠。" },
  { id: 106, limb: "samadhi", theme: null, en: "Sometimes nothing needs a name.", zh: "有些時候，不需要再替事情命名。" },
  { id: 107, limb: "samadhi", theme: null, en: "When the edges soften, you may see more.", zh: "當邊界鬆開，你會看見更多。" },
  { id: 108, limb: "samadhi", theme: null, en: "Today, let yourself be fully here.", zh: "今天，讓自己完整地待在這一刻。" },
];

// 夜晚卡（108）：靜坐後的回看與反省。
// 19:00 後的靜坐會抽這一組。
// id 與白天卡對齊（1..108），共用同一套 limb / theme。
export const NIGHT_CARDS: Card[] = [
  // ── 持戒 Yama ─
  // 非暴力
  { id: 1, limb: "yama", theme: "非暴力", en: "Where could you have been gentler with yourself today?", zh: "今天，有哪一刻你其實可以對自己更溫柔？" },
  { id: 2, limb: "yama", theme: "非暴力", en: "Did you make yourself hold on for too long today?", zh: "今天，你有沒有又逼自己撐得太久？" },
  { id: 3, limb: "yama", theme: "非暴力", en: "Which words stayed with you the longest today?", zh: "哪一句話，今天留在你心裡最久？" },
  { id: 4, limb: "yama", theme: "非暴力", en: "Did you carry someone else's weight as if it were your own today?", zh: "今天，你有沒有把別人的重量也背在自己身上？" },
  { id: 5, limb: "yama", theme: "非暴力", en: "What can you stop blaming yourself for tonight?", zh: "有什麼，是今晚可以不再責怪自己的？" },
  { id: 6, limb: "yama", theme: "非暴力", en: "Where were you already enough today?", zh: "今天的你，哪裡已經做得夠好了？" },
  { id: 7, limb: "yama", theme: "非暴力", en: "If you could revisit one moment, what would you offer yourself more of?", zh: "如果可以重來一刻，你想多給自己一點什麼？" },
  { id: 8, limb: "yama", theme: "非暴力", en: "Which inner battle can you let rest tonight?", zh: "今晚，讓哪一場內在的仗先停下來？" },
  // 真實
  { id: 9, limb: "yama", theme: "真實", en: "What feeling did you not fully admit today?", zh: "今天，有什麼感受你沒有完全承認？" },
  { id: 10, limb: "yama", theme: "真實", en: "When did you already know the answer?", zh: "哪一刻，你其實已經知道答案了？" },
  { id: 11, limb: "yama", theme: "真實", en: "Did you say anything today that moved farther from what you truly felt?", zh: "今天，有沒有一句話你說得比心裡更遠？" },
  { id: 12, limb: "yama", theme: "真實", en: "What became clearer once things grew quiet?", zh: "哪件事，在安靜下來之後變得比較清楚？" },
  { id: 13, limb: "yama", theme: "真實", en: "What no longer needs an explanation from you?", zh: "今天，有什麼是不需要再替自己解釋的？" },
  { id: 14, limb: "yama", theme: "真實", en: "When did you feel closest to your true self today?", zh: "哪一刻，你最接近真正的自己？" },
  { id: 15, limb: "yama", theme: "真實", en: "Tonight, let one honest feeling remain.", zh: "今晚，允許一個真實的感受留下來。" },
  // 不偷盜
  { id: 16, limb: "yama", theme: "不偷盜", en: "How much of today did you give to what truly mattered?", zh: "今天，你把多少時間留給了真正重要的事？" },
  { id: 17, limb: "yama", theme: "不偷盜", en: "When did you compare yourself with someone else today?", zh: "有哪一刻，你又拿自己去和別人比較？" },
  { id: 18, limb: "yama", theme: "不偷盜", en: "What was already enough today?", zh: "今天，有什麼其實已經足夠？" },
  { id: 19, limb: "yama", theme: "不偷盜", en: "Did you overlook something you already have?", zh: "你有沒有忽略自己其實已經擁有的？" },
  { id: 20, limb: "yama", theme: "不偷盜", en: "Did you bring home a responsibility that was never yours?", zh: "今天，有沒有把不屬於你的責任帶回來？" },
  { id: 21, limb: "yama", theme: "不偷盜", en: "Tonight, give your attention back to yourself.", zh: "今晚，把注意力還給自己。" },
  // 節制
  { id: 22, limb: "yama", theme: "節制", en: "Where did you spend too much energy today?", zh: "今天，哪裡花掉了太多力氣？" },
  { id: 23, limb: "yama", theme: "節制", en: "What did not need to be done so completely?", zh: "有什麼其實不需要做到那麼滿？" },
  { id: 24, limb: "yama", theme: "節制", en: "Did you save any energy for yourself today?", zh: "今天，你有留下一點力氣給自己嗎？" },
  { id: 25, limb: "yama", theme: "節制", en: "Which yes cost you more than you wanted to give?", zh: "哪一個答應，其實讓你有點太累？" },
  { id: 26, limb: "yama", theme: "節制", en: "Where might less have been better today?", zh: "今天，有哪一刻少一點反而會更好？" },
  { id: 27, limb: "yama", theme: "節制", en: "Where did your attention go today?", zh: "你的注意力今天去了哪裡？" },
  { id: 28, limb: "yama", theme: "節制", en: "Tonight, let the energy you have left belong to rest.", zh: "今晚，把還剩下的力氣留給休息。" },
  // 不執取
  { id: 29, limb: "yama", theme: "不執取", en: "What were you still holding on to today?", zh: "今天，有什麼是你一直不肯放下的？" },
  { id: 30, limb: "yama", theme: "不執取", en: "Was there something you did not need to control?", zh: "有沒有一件事，其實不需要再控制？" },
  { id: 31, limb: "yama", theme: "不執取", en: "What left today while you remained whole?", zh: "今天，什麼離開了，而你其實還好好的？" },
  { id: 32, limb: "yama", theme: "不執取", en: "Which thought did you carry for too long?", zh: "哪一個念頭，你帶著太久了？" },
  { id: 33, limb: "yama", theme: "不執取", en: "What can stay with today instead of following you into tomorrow?", zh: "有什麼可以留在今天，不必帶進明天？" },
  { id: 34, limb: "yama", theme: "不執取", en: "When did you hold on too tightly today?", zh: "今天，有哪一刻你握得太緊？" },
  { id: 35, limb: "yama", theme: "不執取", en: "Tonight, let one thing be without your intervention.", zh: "今晚，試著讓一件事自己待著。" },
  { id: 36, limb: "yama", theme: "不執取", en: "What remains when you let go?", zh: "放下之後，你還剩下什麼？" },

  // ── 精進 Niyama ─
  // 潔淨
  { id: 37, limb: "niyama", theme: "潔淨", en: "What noise followed you through the day?", zh: "今天，有什麼雜音一直跟著你？" },
  { id: 38, limb: "niyama", theme: "潔淨", en: "What feeling can you rinse away a little tonight?", zh: "有什麼情緒，今晚可以先洗掉一點？" },
  { id: 39, limb: "niyama", theme: "潔淨", en: "What took up too much space today?", zh: "今天，你讓什麼佔據了太多空間？" },
  { id: 40, limb: "niyama", theme: "潔淨", en: "What no longer needs to come with you?", zh: "有什麼已經不需要再帶著了？" },
  { id: 41, limb: "niyama", theme: "潔淨", en: "What small corner deserves clearing tonight?", zh: "今晚，哪一個角落值得被整理？" },
  { id: 42, limb: "niyama", theme: "潔淨", en: "Before sleep, leave yourself a little clean space.", zh: "睡前，替自己留一點乾淨的空白。" },
  // 知足
  { id: 43, limb: "niyama", theme: "知足", en: "What small goodness did you notice today?", zh: "今天，有什麼小小的好被你看見了？" },
  { id: 44, limb: "niyama", theme: "知足", en: "What ordinary thing was quietly worth being grateful for?", zh: "哪一件平常的事，其實值得感謝？" },
  { id: 45, limb: "niyama", theme: "知足", en: "Was there a moment today when you already had enough?", zh: "今天，有沒有一刻你其實已經很滿足？" },
  { id: 46, limb: "niyama", theme: "知足", en: "What has always been there that you almost forgot to notice?", zh: "有什麼一直都在，只是你差點忘了？" },
  { id: 47, limb: "niyama", theme: "知足", en: "Did you miss something good that was right in front of you?", zh: "今天，你有沒有錯過眼前的好？" },
  { id: 48, limb: "niyama", theme: "知足", en: "When did today feel like enough?", zh: "哪一刻，今天的生活已經足夠？" },
  { id: 49, limb: "niyama", theme: "知足", en: "Tonight, you do not have to chase what today did not give you.", zh: "今晚，不必再去追今天沒有得到的。" },
  { id: 50, limb: "niyama", theme: "知足", en: "Carry one good thing from today into sleep.", zh: "帶一件今天的好事進入睡眠。" },
  // 自律
  { id: 51, limb: "niyama", theme: "自律", en: "Where did you keep going today, even in a small way?", zh: "今天，你在哪一件小事上沒有放棄？" },
  { id: 52, limb: "niyama", theme: "自律", en: "Where did you show up even when it was difficult?", zh: "哪一個不容易的時刻，你還是出現了？" },
  { id: 53, limb: "niyama", theme: "自律", en: "What may be growing even if you cannot see it yet?", zh: "今天，有什麼雖然看不見，但可能正在長？" },
  { id: 54, limb: "niyama", theme: "自律", en: "What effort deserves your own recognition tonight?", zh: "哪一點努力，值得被你自己看見？" },
  { id: 55, limb: "niyama", theme: "自律", en: "What did today's discomfort teach you?", zh: "今天的不舒服，教了你什麼？" },
  { id: 56, limb: "niyama", theme: "自律", en: "What does not need to show results tonight?", zh: "有哪件事，不需要今晚就看到結果？" },
  { id: 57, limb: "niyama", theme: "自律", en: "Tonight, let today's effort end with today.", zh: "今晚，讓努力停在今天就好。" },
  // 自我研習
  { id: 58, limb: "niyama", theme: "自我研習", en: "What stirred a strong reaction in you today?", zh: "今天，什麼事情讓你反應特別大？" },
  { id: 59, limb: "niyama", theme: "自我研習", en: "What was underneath that reaction?", zh: "那個反應下面，還有什麼？" },
  { id: 60, limb: "niyama", theme: "自我研習", en: "What pattern showed up again today?", zh: "今天，有什麼模式又出現了？" },
  { id: 61, limb: "niyama", theme: "自我研習", en: "When did you notice something new about yourself?", zh: "哪一刻，你看見了自己以前沒注意到的地方？" },
  { id: 62, limb: "niyama", theme: "自我研習", en: "What did you learn about yourself today?", zh: "今天，你從自己身上學到了什麼？" },
  { id: 63, limb: "niyama", theme: "自我研習", en: "What feeling does not need a name yet?", zh: "有什麼感覺，你還不需要急著命名？" },
  { id: 64, limb: "niyama", theme: "自我研習", en: "Tonight, let one answer remain unfinished.", zh: "今晚，讓一個答案先不要出現。" },
  // 交託
  { id: 65, limb: "niyama", theme: "交託", en: "What did you already do as well as you could today?", zh: "今天，有什麼你已經做了能做的？" },
  { id: 66, limb: "niyama", theme: "交託", en: "What no longer needs to be finished by you?", zh: "還有什麼，不必再由你繼續完成？" },
  { id: 67, limb: "niyama", theme: "交託", en: "What was beyond your control today?", zh: "今天，有沒有一件事你控制不了？" },
  { id: 68, limb: "niyama", theme: "交託", en: "Would you feel lighter if you did not need the outcome yet?", zh: "如果不急著知道結果，你現在會輕一點嗎？" },
  { id: 69, limb: "niyama", theme: "交託", en: "What can you hand over tonight?", zh: "今晚，有什麼可以先交出去？" },
  { id: 70, limb: "niyama", theme: "交託", en: "What unfinished thing can safely wait until tomorrow?", zh: "哪一件未完成，可以安心留到明天？" },
  { id: 71, limb: "niyama", theme: "交託", en: "Today's answer does not have to arrive today.", zh: "今天的答案，不一定要在今天出現。" },
  { id: 72, limb: "niyama", theme: "交託", en: "Before sleep, set the outcome down.", zh: "睡前，把結果放下來。" },

  // ── 體位 Asana ─
  { id: 73, limb: "asana", theme: null, en: "Where did your body work the hardest today?", zh: "今天，你的身體在哪裡最用力？" },
  { id: 74, limb: "asana", theme: null, en: "When did you truly feel grounded today?", zh: "有哪一刻，你真的感覺自己站穩了？" },
  { id: 75, limb: "asana", theme: null, en: "Did your body tell you something before your mind did?", zh: "今天，身體有沒有先告訴你什麼？" },
  { id: 76, limb: "asana", theme: null, en: "Where can you soften a little now?", zh: "哪一個地方，現在可以鬆一點？" },
  { id: 77, limb: "asana", theme: null, en: "Did you truly return to your body at any point today?", zh: "今天，你有沒有真的回到自己的身體裡？" },
  { id: 78, limb: "asana", theme: null, en: "What weight can you give to the bed and the ground tonight?", zh: "有什麼重量，今晚可以交給床和地面？" },
  { id: 79, limb: "asana", theme: null, en: "Right now, you do not have to hold any posture.", zh: "此刻，不必再維持任何姿勢。" },

  // ── 調息 Pranayama ─
  { id: 80, limb: "pranayama", theme: null, en: "When did you lose touch with your breath today?", zh: "今天，你有什麼時候忘了呼吸？" },
  { id: 81, limb: "pranayama", theme: null, en: "When did one breath bring you back?", zh: "哪一刻，一口氣讓你重新回來？" },
  { id: 82, limb: "pranayama", theme: null, en: "Tonight, let the day leave with your exhale.", zh: "今晚，先把今天慢慢吐出去。" },
  { id: 83, limb: "pranayama", theme: null, en: "What is still caught in your chest?", zh: "有什麼還卡在胸口？" },
  { id: 84, limb: "pranayama", theme: null, en: "Right now, you do not need to take anything else in.", zh: "現在，不需要再把任何東西吸進來。" },
  { id: 85, limb: "pranayama", theme: null, en: "Let your breath close the day.", zh: "讓呼吸替今天收尾。" },
  { id: 86, limb: "pranayama", theme: null, en: "Tonight, just follow the next breath.", zh: "今晚，只要跟著下一口氣就好。" },

  // ── 制感 Pratyahara ─
  { id: 87, limb: "pratyahara", theme: null, en: "Which voice took up too much of your day?", zh: "今天，哪個聲音佔據了你太久？" },
  { id: 88, limb: "pratyahara", theme: null, en: "What can stay outside now?", zh: "有什麼外面的事情，現在可以留在外面？" },
  { id: 89, limb: "pratyahara", theme: null, en: "Did you answer something today that did not need your response?", zh: "今天，你有沒有回應了其實不需要回應的事？" },
  { id: 90, limb: "pratyahara", theme: null, en: "If you turn down the noise now, what do you hear?", zh: "現在關掉一點聲音，你會聽見什麼？" },
  { id: 91, limb: "pratyahara", theme: null, en: "Tonight, the world can find you later.", zh: "今晚，世界可以晚一點再找到你。" },
  { id: 92, limb: "pratyahara", theme: null, en: "Slowly bring your attention back from the outside world.", zh: "把注意力從外面，慢慢帶回來。" },

  // ── 專注 Dharana ─
  { id: 93, limb: "dharana", theme: null, en: "Where did your mind wander most today?", zh: "今天，你的心最常跑去哪裡？" },
  { id: 94, limb: "dharana", theme: null, en: "What truly deserved your attention today?", zh: "有哪一件事，今天真的值得你的注意？" },
  { id: 95, limb: "dharana", theme: null, en: "When were you fully present today?", zh: "哪一刻，你完全在場？" },
  { id: 96, limb: "dharana", theme: null, en: "What kept pulling you away from yourself today?", zh: "今天，有什麼讓你一再離開自己？" },
  { id: 97, limb: "dharana", theme: null, en: "Every return counts. How many times did you come back today?", zh: "每一次回來，都算數。你今天回來了幾次？" },
  { id: 98, limb: "dharana", theme: null, en: "Tonight, let only one thing remain in your attention.", zh: "今晚，只留一件事在心裡。" },

  // ── 禪那 Dhyana ─
  { id: 99, limb: "dhyana", theme: null, en: "Was there a moment today when you forgot you were trying?", zh: "今天，有沒有一刻你忘了自己正在努力？" },
  { id: 100, limb: "dhyana", theme: null, en: "When were you simply there, without effort?", zh: "哪一刻，你只是安靜地在那裡？" },
  { id: 101, limb: "dhyana", theme: null, en: "Did you notice any space between your thoughts today?", zh: "今天的念頭之間，有沒有一點空白？" },
  { id: 102, limb: "dhyana", theme: null, en: "Now, you do not have to follow any thought.", zh: "現在，不必再跟著任何念頭走。" },
  { id: 103, limb: "dhyana", theme: null, en: "Tonight, let stillness come on its own.", zh: "今晚，讓平靜自己來。" },

  // ── 三摩地 Samadhi ─
  { id: 104, limb: "samadhi", theme: null, en: "Was there a moment today when you were no longer standing outside your life?", zh: "今天，有沒有一刻你不再站在生活外面？" },
  { id: 105, limb: "samadhi", theme: null, en: "When did there seem to be no distance between you and what was happening?", zh: "哪一刻，你和正在發生的事沒有距離？" },
  { id: 106, limb: "samadhi", theme: null, en: "Was there a moment today when nothing needed a name?", zh: "今天，有沒有一刻不需要替事情命名？" },
  { id: 107, limb: "samadhi", theme: null, en: "Which boundary can soften tonight?", zh: "今晚，哪一條邊界可以先鬆開？" },
  { id: 108, limb: "samadhi", theme: null, en: "Before sleep, let only this breathing moment remain.", zh: "睡前，只留下正在呼吸的這一刻。" },
];

/** id -> Card，給抽卡紀錄回查用。
 * 舊 API：預設查白天卡；帶 kind='night' 查夜晚卡。
 * DB 的 daily_cards 存 (card_id, kind)，回查時用 getCard(id, kind)。 */
export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));
export const NIGHT_CARD_BY_ID = new Map(NIGHT_CARDS.map((c) => [c.id, c]));

export type CardKind = "day" | "night";

export function getCard(id: number, kind: CardKind = "day"): Card | undefined {
  return kind === "night" ? NIGHT_CARD_BY_ID.get(id) : CARD_BY_ID.get(id);
}

export function cardsFor(kind: CardKind): Card[] {
  return kind === "night" ? NIGHT_CARDS : CARDS;
}
