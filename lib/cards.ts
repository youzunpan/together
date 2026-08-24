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
  { id: 1, limb: 'yama', theme: '非暴力', en: 'Fight one less battle with yourself.', zh: '少和自己打一場仗。' },
  { id: 2, limb: 'yama', theme: '非暴力', en: 'Gentleness is not the same as giving in.', zh: '溫柔，不代表退讓。' },
  { id: 3, limb: 'yama', theme: '非暴力', en: 'Don’t push yourself too far.', zh: '別把自己推得太遠。' },
  { id: 4, limb: 'yama', theme: '非暴力', en: 'Where you can soften, stop pushing.', zh: '可以放鬆的地方，就別再用力了。' },
  { id: 5, limb: 'yama', theme: '非暴力', en: 'Stop blaming yourself for a moment.', zh: '先別責怪自己。' },
  { id: 6, limb: 'yama', theme: '非暴力', en: 'You don’t have to reopen every wound.', zh: '不是每個傷口，都需要重新揭開。' },
  { id: 7, limb: 'yama', theme: '非暴力', en: 'Save some kindness for yourself.', zh: '留一點善意給自己。' },
  { id: 8, limb: 'yama', theme: '非暴力', en: 'Strength can be soft, too.', zh: '力量也可以是柔軟的。' },
  // 真實
  { id: 9, limb: 'yama', theme: '真實', en: 'Deep down, you already know.', zh: '其實，你心裡已經知道了。' },
  { id: 10, limb: 'yama', theme: '真實', en: 'Your feelings don’t need an explanation right away.', zh: '感受不必急著解釋。' },
  { id: 11, limb: 'yama', theme: '真實', en: 'Telling the truth often feels lighter.', zh: '說真話，心裡通常會輕一點。' },
  { id: 12, limb: 'yama', theme: '真實', en: 'Try not to circle around what you really mean.', zh: '試著別繞開真正想說的話。' },
  { id: 13, limb: 'yama', theme: '真實', en: 'Listen to yourself before you speak.', zh: '說出口以前，先聽聽自己。' },
  { id: 14, limb: 'yama', theme: '真實', en: 'Things become clearer when you stop forcing yourself.', zh: '不勉強自己，事情反而會清楚一點。' },
  { id: 15, limb: 'yama', theme: '真實', en: 'Make room for what is true.', zh: '給真實留一點空間。' },
  // 不偷盜
  { id: 16, limb: 'yama', theme: '不偷盜', en: 'Someone else’s path does not have to become yours.', zh: '別人的路，不必變成你的方向。' },
  { id: 17, limb: 'yama', theme: '不偷盜', en: 'Bring your attention back to yourself.', zh: '把注意力帶回自己身上。' },
  { id: 18, limb: 'yama', theme: '不偷盜', en: 'What you already have deserves to be seen.', zh: '你已經擁有的，也值得被看見。' },
  { id: 19, limb: 'yama', theme: '不偷盜', en: 'Comparison can make you overlook what you already have.', zh: '一比較，就容易看輕自己擁有的。' },
  { id: 20, limb: 'yama', theme: '不偷盜', en: 'You don’t need to look to someone else’s life for your answers.', zh: '不必從別人的人生裡，找自己的答案。' },
  { id: 21, limb: 'yama', theme: '不偷盜', en: 'Take only what is truly yours.', zh: '只拿真正屬於你的。' },
  // 節制
  { id: 22, limb: 'yama', theme: '節制', en: 'Don’t spend all your energy at once.', zh: '別把所有力氣一次用完。' },
  { id: 23, limb: 'yama', theme: '節制', en: 'Just enough can still feel complete.', zh: '剛剛好，也是一種完整。' },
  { id: 24, limb: 'yama', theme: '節制', en: 'Leave some room for what has not happened yet.', zh: '替還沒發生的事留點位置。' },
  { id: 25, limb: 'yama', theme: '節制', en: 'Not every call requires you to turn around.', zh: '不是每一聲呼喚，都要回頭。' },
  { id: 26, limb: 'yama', theme: '節制', en: 'Saving some energy for yourself is also a form of care.', zh: '為自己留一些力氣，也是一種照顧。' },
  { id: 27, limb: 'yama', theme: '節制', en: 'Try doing a little less and see what happens.', zh: '少做一點，看看會發生什麼。' },
  { id: 28, limb: 'yama', theme: '節制', en: 'Save your energy for what truly matters.', zh: '把力氣留給真正重要的事。' },
  // 不執取
  { id: 29, limb: 'yama', theme: '不執取', en: 'Loosen your grip.', zh: '別握得那麼緊。' },
  { id: 30, limb: 'yama', theme: '不執取', en: 'Not everything has to stay.', zh: '不必每一樣都留下。' },
  { id: 31, limb: 'yama', theme: '不執取', en: 'Something new can enter when there is room.', zh: '有了空位，新的東西才進得來。' },
  { id: 32, limb: 'yama', theme: '不執取', en: 'You can cherish without holding on.', zh: '珍惜，不一定要握住。' },
  { id: 33, limb: 'yama', theme: '不執取', en: 'Let things unfold on their own.', zh: '先讓事情自然發展。' },
  { id: 34, limb: 'yama', theme: '不執取', en: 'What if you left it alone this time?', zh: '這次先別管它，會怎麼樣？' },
  { id: 35, limb: 'yama', theme: '不執取', en: 'If it won’t stay, don’t force yourself to hold on.', zh: '留不住的，就別再勉強。' },
  { id: 36, limb: 'yama', theme: '不執取', en: 'Letting go is also a way forward.', zh: '放下，也是一種前進。' },
  // ── 精進 Niyama ─
  // 潔淨
  { id: 37, limb: 'niyama', theme: '潔淨', en: 'Clear a little space, and let the air in.', zh: '清出一點空間，讓空氣進來。' },
  { id: 38, limb: 'niyama', theme: '潔淨', en: 'What is no longer needed can leave.', zh: '不再需要的，可以離開。' },
  { id: 39, limb: 'niyama', theme: '潔淨', en: 'Keep it simple.', zh: '簡單一點。' },
  { id: 40, limb: 'niyama', theme: '潔淨', en: 'Clearing one corner is enough.', zh: '整理一個角落就好。' },
  { id: 41, limb: 'niyama', theme: '潔淨', en: 'With less noise, you can hear yourself more clearly.', zh: '雜音少一點，就更聽得見自己。' },
  { id: 42, limb: 'niyama', theme: '潔淨', en: 'Keep one small space clear for yourself.', zh: '替自己留一小塊清爽的空間。' },
  // 知足
  { id: 43, limb: 'niyama', theme: '知足', en: 'There is goodness here, too.', zh: '眼前也有好的東西。' },
  { id: 44, limb: 'niyama', theme: '知足', en: 'Notice what has been with you all along.', zh: '看看那些一直陪著你的事物。' },
  { id: 45, limb: 'niyama', theme: '知足', en: 'You don’t have to wait until everything is complete to feel at ease.', zh: '不必等一切都圓滿，才讓自己安心。' },
  { id: 46, limb: 'niyama', theme: '知足', en: 'What you have may already be enough.', zh: '你擁有的，或許已經足夠。' },
  { id: 47, limb: 'niyama', theme: '知足', en: 'Don’t overlook happiness just because it feels ordinary.', zh: '別因為幸福太平常，就錯過了它。' },
  { id: 48, limb: 'niyama', theme: '知足', en: 'A little goodness still counts.', zh: '一點點好，也算。' },
  { id: 49, limb: 'niyama', theme: '知足', en: 'When you stop chasing, you may notice what’s already here.', zh: '停下追趕，也許就看得見眼前。' },
  { id: 50, limb: 'niyama', theme: '知足', en: 'Stay here for a while.', zh: '就在這裡待一下。' },
  // 自律
  { id: 51, limb: 'niyama', theme: '自律', en: 'Just a little more.', zh: '再一點點就好。' },
  { id: 52, limb: 'niyama', theme: '自律', en: 'Taking the first step is a start.', zh: '願意踏出第一步，就是開始。' },
  { id: 53, limb: 'niyama', theme: '自律', en: 'Slower is still forward.', zh: '慢一點，也還是在前進。' },
  { id: 54, limb: 'niyama', theme: '自律', en: 'Progress can be real even when you can’t see it.', zh: '看不見進展，不代表沒有改變。' },
  { id: 55, limb: 'niyama', theme: '自律', en: 'Roots grow slowly.', zh: '根長得很慢。' },
  { id: 56, limb: 'niyama', theme: '自律', en: 'Start small, and keep going.', zh: '從小處開始，慢慢走下去。' },
  { id: 57, limb: 'niyama', theme: '自律', en: 'Discomfort may be where change begins.', zh: '感到不舒服，也許正是改變的開始。' },
  // 自我研習
  { id: 58, limb: 'niyama', theme: '自我研習', en: 'Notice the thought that keeps returning.', zh: '留意那個一再出現的念頭。' },
  { id: 59, limb: 'niyama', theme: '自我研習', en: 'Your reaction can be more honest than the event itself.', zh: '你的反應，有時比事情本身更誠實。' },
  { id: 60, limb: 'niyama', theme: '自我研習', en: 'Notice it before trying to change it.', zh: '先看見它，不急著改變。' },
  { id: 61, limb: 'niyama', theme: '自我研習', en: 'Repetition is a clue.', zh: '重複，本身就是線索。' },
  { id: 62, limb: 'niyama', theme: '自我研習', en: 'You may know yourself better than you think.', zh: '你也許比想像中更了解自己。' },
  { id: 63, limb: 'niyama', theme: '自我研習', en: 'Try looking a little deeper.', zh: '試著再看深一點。' },
  { id: 64, limb: 'niyama', theme: '自我研習', en: 'Some things only become visible in quiet.', zh: '安靜下來，有些事才看得見。' },
  // 交託
  { id: 65, limb: 'niyama', theme: '交託', en: 'Not everything is yours to finish.', zh: '不是每件事，都得由你完成。' },
  { id: 66, limb: 'niyama', theme: '交託', en: 'Choose one thing to stop controlling.', zh: '選一件事，試著別再控制。' },
  { id: 67, limb: 'niyama', theme: '交託', en: 'You can take the next step without knowing the destination.', zh: '不知道終點，也可以走下一步。' },
  { id: 68, limb: 'niyama', theme: '交託', en: 'The path will appear again.', zh: '路會再出現。' },
  { id: 69, limb: 'niyama', theme: '交託', en: 'Put down the weight that was never yours to carry.', zh: '放下那些本來就不屬於你的重量。' },
  { id: 70, limb: 'niyama', theme: '交託', en: 'You don’t need an answer yet.', zh: '先別急著找答案。' },
  { id: 71, limb: 'niyama', theme: '交託', en: 'You’ve done enough to let it go.', zh: '做到這裡，已經可以放手了。' },
  { id: 72, limb: 'niyama', theme: '交託', en: 'Let things move at their own pace.', zh: '讓事情照自己的節奏走。' },
  // ── 體位 Asana ─
  { id: 73, limb: 'asana', theme: null, en: 'Find a position your body can settle into.', zh: '找一個身體能舒服停留的位置。' },
  { id: 74, limb: 'asana', theme: null, en: 'Steady does not have to mean rigid.', zh: '穩，不一定要硬。' },
  { id: 75, limb: 'asana', theme: null, en: 'Your body may know before you do.', zh: '身體可能比你先知道。' },
  { id: 76, limb: 'asana', theme: null, en: 'Ground yourself before moving forward.', zh: '腳下穩了，再往前。' },
  { id: 77, limb: 'asana', theme: null, en: 'Come back into your body.', zh: '回到身體裡。' },
  { id: 78, limb: 'asana', theme: null, en: 'Stay where you are for a moment.', zh: '先待在現在的位置。' },
  { id: 79, limb: 'asana', theme: null, en: 'Let the ground carry some of your weight.', zh: '讓地面替你承接一些重量。' },
  // ── 調息 Pranayama ─
  { id: 80, limb: 'pranayama', theme: null, en: 'Breathe first.', zh: '先呼吸。' },
  { id: 81, limb: 'pranayama', theme: null, en: 'Make space for the next breath.', zh: '先騰出一點空間，再迎接下一口氣。' },
  { id: 82, limb: 'pranayama', theme: null, en: 'As your breath slows, other things may slow with it.', zh: '呼吸慢下來，別的也會跟著慢。' },
  { id: 83, limb: 'pranayama', theme: null, en: 'Come back with this breath.', zh: '跟著這一口氣回來。' },
  { id: 84, limb: 'pranayama', theme: null, en: 'The next breath will come on its own.', zh: '下一口氣會自己來。' },
  { id: 85, limb: 'pranayama', theme: null, en: 'There is space between breaths, too.', zh: '呼吸之間，也有空白。' },
  { id: 86, limb: 'pranayama', theme: null, en: 'Just follow the next breath.', zh: '跟著下一口氣走就好。' },
  // ── 制感 Pratyahara ─
  { id: 87, limb: 'pratyahara', theme: null, en: 'Not every sound needs a response.', zh: '不必每個聲音都回答。' },
  { id: 88, limb: 'pratyahara', theme: null, en: 'Let what is outside stay outside for now.', zh: '外面的，先留在外面。' },
  { id: 89, limb: 'pratyahara', theme: null, en: 'Turn the volume down.', zh: '把音量調小一點。' },
  { id: 90, limb: 'pratyahara', theme: null, en: 'The world can wait.', zh: '世界可以等。' },
  { id: 91, limb: 'pratyahara', theme: null, en: 'There is still a quiet place within you.', zh: '你心裡，還有一個安靜的地方。' },
  { id: 92, limb: 'pratyahara', theme: null, en: 'Gather your attention back.', zh: '把散出去的注意力收回來。' },
  // ── 專注 Dharana ─
  { id: 93, limb: 'dharana', theme: null, en: 'One thing at a time.', zh: '一次一件事。' },
  { id: 94, limb: 'dharana', theme: null, en: 'You don’t have to figure everything out at once.', zh: '不必一次想清楚所有事情。' },
  { id: 95, limb: 'dharana', theme: null, en: 'When your mind wanders, gently bring it back.', zh: '心跑遠了，再輕輕帶它回來。' },
  { id: 96, limb: 'dharana', theme: null, en: 'Rest your attention gently on what’s in front of you.', zh: '把注意力輕輕放在眼前。' },
  { id: 97, limb: 'dharana', theme: null, en: 'Every return counts.', zh: '每一次回來，都算數。' },
  { id: 98, limb: 'dharana', theme: null, en: 'Focus on what matters, and let the rest fall away.', zh: '專注在重要的事上，其他的自然會退到一旁。' },
  // ── 禪那 Dhyana ─
  { id: 99, limb: 'dhyana', theme: null, en: 'Leave a little time to simply be.', zh: '留一點時間，只是安靜地待著。' },
  { id: 100, limb: 'dhyana', theme: null, en: 'Not every thought needs to be followed.', zh: '念頭來了，不必每個都跟著走。' },
  { id: 101, limb: 'dhyana', theme: null, en: 'You can sit quietly without holding on to anything.', zh: '什麼都不抓，也可以安靜地待著。' },
  { id: 102, limb: 'dhyana', theme: null, en: 'There has always been space between your thoughts.', zh: '念頭之間，一直都有空白。' },
  { id: 103, limb: 'dhyana', theme: null, en: 'Stillness cannot be forced.', zh: '平靜不是用力做出來的。' },
  // ── 三摩地 Samadhi ─
  { id: 104, limb: 'samadhi', theme: null, en: 'Step back into your own life.', zh: '回到自己的生活裡。' },
  { id: 105, limb: 'samadhi', theme: null, en: 'Come closer to what is happening now.', zh: '靠近此刻正在發生的一切。' },
  { id: 106, limb: 'samadhi', theme: null, en: 'Not everything needs a name.', zh: '不必急著替一切命名。' },
  { id: 107, limb: 'samadhi', theme: null, en: 'Edges can soften, too.', zh: '邊界也可以柔軟。' },
  { id: 108, limb: 'samadhi', theme: null, en: 'Be fully here.', zh: '完整地待在這一刻。' },
];

// 夜晚卡（108）：靜坐後的回看與反省。
// 19:00 後的靜坐會抽這一組。
// id 與白天卡對齊（1..108），共用同一套 limb / theme。
export const NIGHT_CARDS: Card[] = [
  // ── 持戒 Yama ─
  // 非暴力
  { id: 1, limb: 'yama', theme: '非暴力', en: 'Did you push yourself too hard?', zh: '你是不是把自己逼得太緊了？' },
  { id: 2, limb: 'yama', theme: '非暴力', en: 'Don’t overlook the part of you that struggled.', zh: '別忽略自己撐得很辛苦的那一面。' },
  { id: 3, limb: 'yama', theme: '非暴力', en: 'You can stop blaming yourself now.', zh: '先別再責怪自己了。' },
  { id: 4, limb: 'yama', theme: '非暴力', en: 'What words are still lingering inside?', zh: '還有什麼話留在心裡？' },
  { id: 5, limb: 'yama', theme: '非暴力', en: 'You can give back the weight that isn’t yours.', zh: '不屬於你的重量，可以還回去了。' },
  { id: 6, limb: 'yama', theme: '非暴力', en: 'You’ve worked hard enough for today.', zh: '你今天已經很努力了。' },
  { id: 7, limb: 'yama', theme: '非暴力', en: 'If you could return to one moment, how would you comfort yourself?', zh: '如果可以回到某一刻，你會怎麼安慰當時的自己？' },
  { id: 8, limb: 'yama', theme: '非暴力', en: 'That inner battle can pause for now.', zh: '那場心裡的仗，可以先停一停了。' },
  // 真實
  { id: 9, limb: 'yama', theme: '真實', en: 'What feeling finally came to the surface?', zh: '有什麼感覺，終於浮上來了？' },
  { id: 10, limb: 'yama', theme: '真實', en: 'What did you already know deep down?', zh: '有什麼事，你其實早就知道了？' },
  { id: 11, limb: 'yama', theme: '真實', en: 'You do not need to explain yourself anymore.', zh: '不需要再替自己解釋。' },
  { id: 12, limb: 'yama', theme: '真實', en: 'What became clearer in the quiet?', zh: '安靜之後，什麼變清楚了？' },
  { id: 13, limb: 'yama', theme: '真實', en: 'Is there a truth you still haven’t admitted to yourself?', zh: '有沒有一句真話，你還沒對自己說？' },
  { id: 14, limb: 'yama', theme: '真實', en: 'Seeing the truth doesn’t mean you need an answer right away.', zh: '看清楚了，也不用急著得出答案。' },
  { id: 15, limb: 'yama', theme: '真實', en: 'Let the feeling be what it is without trying to change it.', zh: '先讓感受如實存在，不急著改變。' },
  // 不偷盜
  { id: 16, limb: 'yama', theme: '不偷盜', en: 'Where did your attention go?', zh: '注意力都去了哪裡？' },
  { id: 17, limb: 'yama', theme: '不偷盜', en: 'You can let go of comparison now.', zh: '那些比較的念頭，現在可以停下了。' },
  { id: 18, limb: 'yama', theme: '不偷盜', en: 'Don’t forget what you already have.', zh: '別忘了看看自己已經擁有的。' },
  { id: 19, limb: 'yama', theme: '不偷盜', en: 'Did you give too much of your time away?', zh: '你是不是把太多時間留給了別人？' },
  { id: 20, limb: 'yama', theme: '不偷盜', en: 'Leave responsibilities that are not yours outside the door.', zh: '不屬於你的責任，留在門外。' },
  { id: 21, limb: 'yama', theme: '不偷盜', en: 'Give yourself back to yourself.', zh: '把自己還給自己。' },
  // 節制
  { id: 22, limb: 'yama', theme: '節制', en: 'Where did you spend too much energy?', zh: '你把太多力氣花在哪裡了？' },
  { id: 23, limb: 'yama', theme: '節制', en: 'Some things didn’t need to be done perfectly.', zh: '有些事，其實不用做到十全十美。' },
  { id: 24, limb: 'yama', theme: '節制', en: 'Save the energy you have left for rest.', zh: '把剩下的力氣留給休息。' },
  { id: 25, limb: 'yama', theme: '節制', en: 'Did you say yes too quickly?', zh: '那個「好」，是不是答應得太快了？' },
  { id: 26, limb: 'yama', theme: '節制', en: 'Doing less might have felt lighter.', zh: '少做一點，也許就能輕鬆一點。' },
  { id: 27, limb: 'yama', theme: '節制', en: 'Notice where your energy went today.', zh: '看看今天的力氣都花到哪裡去了。' },
  { id: 28, limb: 'yama', theme: '節制', en: 'This is enough for now.', zh: '到這裡就好。' },
  // 不執取
  { id: 29, limb: 'yama', theme: '不執取', en: 'What are you still holding on to?', zh: '你手裡還緊握著什麼？' },
  { id: 30, limb: 'yama', theme: '不執取', en: 'What if you left it alone for now?', zh: '如果先不管它，會怎麼樣？' },
  { id: 31, limb: 'yama', theme: '不執取', en: 'Something may have left, but you are still here.', zh: '即使有些東西離開了，你依然在這裡。' },
  { id: 32, limb: 'yama', theme: '不執取', en: 'That thought does not need to follow you into sleep.', zh: '那個念頭，可以不用陪你入睡。' },
  { id: 33, limb: 'yama', theme: '不執取', en: 'What is unfinished can stay here for now.', zh: '沒做完的，先留在這裡也可以。' },
  { id: 34, limb: 'yama', theme: '不執取', en: 'What are you still holding too tightly? Loosen your grip a little.', zh: '你還緊抓著什麼？先鬆開一點。' },
  { id: 35, limb: 'yama', theme: '不執取', en: 'You don’t have to stay in control of everything.', zh: '不是每件事都需要你親手掌控。' },
  { id: 36, limb: 'yama', theme: '不執取', en: 'See what remains when you let go.', zh: '放下之後，看看還剩下什麼。' },
  // ── 精進 Niyama ─
  // 潔淨
  { id: 37, limb: 'niyama', theme: '潔淨', en: 'Leave the noise outside.', zh: '把雜音留在門外。' },
  { id: 38, limb: 'niyama', theme: '潔淨', en: 'Let a little of the day’s weariness wash away.', zh: '把這一天的疲憊洗去一點就好。' },
  { id: 39, limb: 'niyama', theme: '潔淨', en: 'What has been taking up too much space in your mind?', zh: '心裡有什麼，佔了太多空間？' },
  { id: 40, limb: 'niyama', theme: '潔淨', en: 'What you no longer need can stay with this day.', zh: '不再需要的，可以留在這一天。' },
  { id: 41, limb: 'niyama', theme: '潔淨', en: 'Clear one small corner, and your mind may feel lighter too.', zh: '整理好一個小角落，心也會跟著清爽一些。' },
  { id: 42, limb: 'niyama', theme: '潔淨', en: 'Leave a little space in your mind before sleep.', zh: '睡前，替心裡留一點空白。' },
  // 知足
  { id: 43, limb: 'niyama', theme: '知足', en: 'Take one small good thing with you.', zh: '別忘了帶走一件小小的美好。' },
  { id: 44, limb: 'niyama', theme: '知足', en: 'Even the things you take for granted deserve gratitude.', zh: '那些習以為常的，也值得感謝。' },
  { id: 45, limb: 'niyama', theme: '知足', en: 'There was a moment when you felt truly content.', zh: '某一刻，你其實已經很滿足了。' },
  { id: 46, limb: 'niyama', theme: '知足', en: 'The things that have always been with you are still here.', zh: '那些一直陪著你的，依然都在。' },
  { id: 47, limb: 'niyama', theme: '知足', en: 'Don’t focus only on what you didn’t get.', zh: '別只記得沒得到的。' },
  { id: 48, limb: 'niyama', theme: '知足', en: 'This day has its own wholeness.', zh: '這一天，有它自己的完整。' },
  { id: 49, limb: 'niyama', theme: '知足', en: 'There is no need to keep looking outward.', zh: '不必再往外找了。' },
  { id: 50, limb: 'niyama', theme: '知足', en: 'Carry something good with you into sleep.', zh: '帶著一點美好入睡。' },
  // 自律
  { id: 51, limb: 'niyama', theme: '自律', en: 'Don’t forget the moments when you kept going.', zh: '別忘了那些你沒有放棄的時刻。' },
  { id: 52, limb: 'niyama', theme: '自律', en: 'Even when it was hard, you kept going.', zh: '即使辛苦，你還是撐過來了。' },
  { id: 53, limb: 'niyama', theme: '自律', en: 'Some growth may be happening where you can’t see it.', zh: '有些成長，正在你看不見的地方發生。' },
  { id: 54, limb: 'niyama', theme: '自律', en: 'Don’t forget to acknowledge the effort you made.', zh: '別忘了肯定自己今天的努力。' },
  { id: 55, limb: 'niyama', theme: '自律', en: 'What did this discomfort show you?', zh: '這份不舒服，讓你看見了什麼？' },
  { id: 56, limb: 'niyama', theme: '自律', en: 'The results can come later.', zh: '結果晚一點出現也沒關係。' },
  { id: 57, limb: 'niyama', theme: '自律', en: 'You’ve done enough for today. Let yourself stop here.', zh: '今天已經夠努力了，先停在這裡吧。' },
  // 自我研習
  { id: 58, limb: 'niyama', theme: '自我研習', en: 'What brought out a stronger reaction than usual?', zh: '哪件事讓你的反應特別強烈？' },
  { id: 59, limb: 'niyama', theme: '自我研習', en: 'Look beneath the reaction.', zh: '再看看，這個反應底下藏著什麼。' },
  { id: 60, limb: 'niyama', theme: '自我研習', en: 'Did that familiar pattern return?', zh: '那個熟悉的模式，又來了嗎？' },
  { id: 61, limb: 'niyama', theme: '自我研習', en: 'Did you notice a side of yourself you hadn’t seen before?', zh: '你有沒有發現自己以前沒注意到的一面？' },
  { id: 62, limb: 'niyama', theme: '自我研習', en: 'What did this day teach you?', zh: '這一天教了你什麼？' },
  { id: 63, limb: 'niyama', theme: '自我研習', en: 'Some feelings can remain unnamed.', zh: '有些感覺，先不要命名。' },
  { id: 64, limb: 'niyama', theme: '自我研習', en: 'The answer can come tomorrow.', zh: '答案可以明天再來。' },
  // 交託
  { id: 65, limb: 'niyama', theme: '交託', en: 'You have done what you could.', zh: '能做的，已經做了。' },
  { id: 66, limb: 'niyama', theme: '交託', en: 'You don’t have to carry what remains.', zh: '剩下的，不必都由你承擔。' },
  { id: 67, limb: 'niyama', theme: '交託', en: 'What you can’t control doesn’t need to follow you into sleep.', zh: '控制不了的，不必帶進睡眠裡。' },
  { id: 68, limb: 'niyama', theme: '交託', en: 'It’s okay that you don’t know the outcome yet.', zh: '還不知道結果，也沒關係。' },
  { id: 69, limb: 'niyama', theme: '交託', en: 'Let a little of your worry go.', zh: '把一點擔心交出去。' },
  { id: 70, limb: 'niyama', theme: '交託', en: 'You can rest even with things unfinished.', zh: '事情還沒完成，也可以安心休息。' },
  { id: 71, limb: 'niyama', theme: '交託', en: 'Not every answer needs to arrive on the same day.', zh: '不是每個答案都要在同一天出現。' },
  { id: 72, limb: 'niyama', theme: '交託', en: 'Let go of the outcome for now.', zh: '先別再抓著結果不放。' },
  // ── 體位 Asana ─
  { id: 73, limb: 'asana', theme: null, en: 'Where is your body still holding on?', zh: '身體哪裡還在撐？' },
  { id: 74, limb: 'asana', theme: null, en: 'There was a moment when you were truly grounded.', zh: '有一刻，你真的站穩了。' },
  { id: 75, limb: 'asana', theme: null, en: 'Did your body know before your mind did?', zh: '身體是不是比腦袋更早知道？' },
  { id: 76, limb: 'asana', theme: null, en: 'Where can you soften now?', zh: '現在可以鬆哪裡？' },
  { id: 77, limb: 'asana', theme: null, en: 'Come back to your body and let the mental replay fade.', zh: '回到身體，讓反覆回想慢慢停下來。' },
  { id: 78, limb: 'asana', theme: null, en: 'Let the ground take your weight.', zh: '把重量交給地面。' },
  { id: 79, limb: 'asana', theme: null, en: 'You do not have to hold the posture anymore.', zh: '不必再維持姿勢了。' },
  // ── 調息 Pranayama ─
  { id: 80, limb: 'pranayama', theme: null, en: 'Was there a moment when you lost touch with your breath?', zh: '有沒有一刻，你連呼吸都顧不上？' },
  { id: 81, limb: 'pranayama', theme: null, en: 'At some point, a single breath brought you back.', zh: '一口氣，也曾把你帶回來。' },
  { id: 82, limb: 'pranayama', theme: null, en: 'Let the day leave slowly with your exhale.', zh: '把這一天慢慢吐出去。' },
  { id: 83, limb: 'pranayama', theme: null, en: 'What are you still carrying in your chest?', zh: '胸口還壓著什麼？' },
  { id: 84, limb: 'pranayama', theme: null, en: 'You don’t need to take in anything more. Just breathe out.', zh: '不必再接住更多，先好好呼出去。' },
  { id: 85, limb: 'pranayama', theme: null, en: 'Let your breath close the day.', zh: '呼吸會替這一天收尾。' },
  { id: 86, limb: 'pranayama', theme: null, en: 'The next breath is enough.', zh: '下一口氣就夠了。' },
  // ── 制感 Pratyahara ─
  { id: 87, limb: 'pratyahara', theme: null, en: 'Which voice stayed with you too long?', zh: '哪個聲音跟了你太久？' },
  { id: 88, limb: 'pratyahara', theme: null, en: 'What is outside can stay outside now.', zh: '外面的，現在可以留在外面。' },
  { id: 89, limb: 'pratyahara', theme: null, en: 'Some responses are better left unsaid.', zh: '有些回應，其實不必說出口。' },
  { id: 90, limb: 'pratyahara', theme: null, en: 'Turn the volume down.', zh: '把音量關小。' },
  { id: 91, limb: 'pratyahara', theme: null, en: 'Let the world find you later.', zh: '世界晚一點再找到你。' },
  { id: 92, limb: 'pratyahara', theme: null, en: 'Slowly gather your attention back.', zh: '把注意力慢慢收回來。' },
  // ── 專注 Dharana ─
  { id: 93, limb: 'dharana', theme: null, en: 'Where did your mind wander most?', zh: '你的心，最常跑去哪裡？' },
  { id: 94, limb: 'dharana', theme: null, en: 'What truly deserved your attention?', zh: '真正值得注意的是什麼？' },
  { id: 95, limb: 'dharana', theme: null, en: 'There was a moment when you were fully present.', zh: '有一刻，你完全活在當下。' },
  { id: 96, limb: 'dharana', theme: null, en: 'What kept pulling your attention away?', zh: '是什麼一再讓你分心？' },
  { id: 97, limb: 'dharana', theme: null, en: 'Every return counts.', zh: '只要有回來，就算數。' },
  { id: 98, limb: 'dharana', theme: null, en: 'Before sleep, let your mind rest on just one thing.', zh: '睡前，讓心裡只留一件事。' },
  // ── 禪那 Dhyana ─
  { id: 99, limb: 'dhyana', theme: null, en: 'There was a moment when you no longer had to try.', zh: '有一刻，你不再需要刻意用力。' },
  { id: 100, limb: 'dhyana', theme: null, en: 'Simply sitting in stillness was enough.', zh: '只是安靜地待著，也很好。' },
  { id: 101, limb: 'dhyana', theme: null, en: 'Did you notice any space between your thoughts?', zh: '念頭中間，有沒有出現一點空白？' },
  { id: 102, limb: 'dhyana', theme: null, en: 'You do not need to follow another thought.', zh: '不必再跟著念頭走了。' },
  { id: 103, limb: 'dhyana', theme: null, en: 'Let stillness come on its own.', zh: '讓平靜自己來。' },
  // ── 三摩地 Samadhi ─
  { id: 104, limb: 'samadhi', theme: null, en: 'There was a moment when you were simply, fully alive.', zh: '有一刻，你只是完整地活著。' },
  { id: 105, limb: 'samadhi', theme: null, en: 'For a moment, you felt at one with what was happening.', zh: '有一刻，你和正在發生的一切融在一起。' },
  { id: 106, limb: 'samadhi', theme: null, en: 'Some feelings no longer need a name.', zh: '有些感受，不必再替它命名。' },
  { id: 107, limb: 'samadhi', theme: null, en: 'Let the boundary between you and the world soften.', zh: '讓你和世界之間的邊界，先鬆開一點。' },
  { id: 108, limb: 'samadhi', theme: null, en: 'In the end, let only this breath remain.', zh: '最後，只留下這一口呼吸。' },
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
