// 每日抽卡：108 張卡文。
//
// 結構依帕坦伽利八肢（Aṣṭāṅga）展開，三等份各 36：
//   持戒 Yama 36 / 精進 Niyama 36 / 內六肢 36
// 108 呼應念珠。
//
// 中英對照，語氣溫柔、留給讀者解讀空間。全部原創（市售彩虹卡有版權，
// 不可引用或改寫）。歷代版本都在 git 歷史裡。
//
// 2026-09 改版，中文卡文遵守三條規則（要改卡文前先讀這三條）：
//   1. 單句不用逗號 —— 「A，B。」那種對句是英文從句直譯回來的殘骸，讀起來像機翻
//   2. 陳述句一律肯定 —— 講「做什麼」不講「不做什麼」。否定句會先讓讀者
//      感覺到那個不好的東西（「別握太緊」→ 先意識到自己握太緊了）
//   3. 口語、身體感的動詞 —— 不用「承接」「迎接」這類書面語
// 夜晚卡的問句是例外，保留 —— 反思要靠提問打開，那是它跟白天卡的分別。
// 中文平均 7 字，最長 11 字。
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
  { id: 1, limb: 'yama', theme: '非暴力', en: 'Call a truce today.', zh: '今天休戰。' },
  { id: 2, limb: 'yama', theme: '非暴力', en: 'Gentleness has strength in it.', zh: '溫柔也有力氣。' },
  { id: 3, limb: 'yama', theme: '非暴力', en: 'You\'ve gone far enough.', zh: '你走得夠遠了。' },
  { id: 4, limb: 'yama', theme: '非暴力', en: 'Soften what can soften.', zh: '能鬆的就鬆。' },
  { id: 5, limb: 'yama', theme: '非暴力', en: 'You did what you could.', zh: '你盡力了。' },
  { id: 6, limb: 'yama', theme: '非暴力', en: 'Old wounds need time.', zh: '舊傷需要時間。' },
  { id: 7, limb: 'yama', theme: '非暴力', en: 'Keep some kindness for yourself.', zh: '善意留一份給自己。' },
  { id: 8, limb: 'yama', theme: '非暴力', en: 'Real strength is soft.', zh: '真正的力氣是軟的。' },
  // 真實
  { id: 9, limb: 'yama', theme: '真實', en: 'You knew already.', zh: '你早就知道了。' },
  { id: 10, limb: 'yama', theme: '真實', en: 'Your feelings speak for themselves.', zh: '你的感覺會說話。' },
  { id: 11, limb: 'yama', theme: '真實', en: 'Say it and it lightens.', zh: '說出來就輕了。' },
  { id: 12, limb: 'yama', theme: '真實', en: 'Say it straight.', zh: '有話就直說。' },
  { id: 13, limb: 'yama', theme: '真實', en: 'Listen to yourself before you speak.', zh: '開口前先聽自己。' },
  { id: 14, limb: 'yama', theme: '真實', en: 'Let go and it gets clear.', zh: '鬆手才看得清。' },
  { id: 15, limb: 'yama', theme: '真實', en: 'Give the truth somewhere to stand.', zh: '讓真話有地方站。' },
  // 不偷盜
  { id: 16, limb: 'yama', theme: '不偷盜', en: 'Walk your own road.', zh: '走你自己的路。' },
  { id: 17, limb: 'yama', theme: '不偷盜', en: 'Bring your eyes back.', zh: '把眼睛收回來。' },
  { id: 18, limb: 'yama', theme: '不偷盜', en: 'Look at what\'s in your hands.', zh: '看看手上有什麼。' },
  { id: 19, limb: 'yama', theme: '不偷盜', en: 'Compare and you\'ve lost.', zh: '一比較就輸了。' },
  { id: 20, limb: 'yama', theme: '不偷盜', en: 'The answer is here in you.', zh: '答案在你這裡。' },
  { id: 21, limb: 'yama', theme: '不偷盜', en: 'Take only your share.', zh: '拿你的那份就好。' },
  // 節制
  { id: 22, limb: 'yama', theme: '節制', en: 'Let the fire burn slow.', zh: '火慢慢燒。' },
  { id: 23, limb: 'yama', theme: '節制', en: 'Stop at enough.', zh: '夠了就停。' },
  { id: 24, limb: 'yama', theme: '節制', en: 'Leave a gap in today.', zh: '今天留點空白。' },
  { id: 25, limb: 'yama', theme: '節制', en: 'Let that one pass.', zh: '讓那個聲音過去。' },
  { id: 26, limb: 'yama', theme: '節制', en: 'Keep some strength for yourself.', zh: '留點力氣給自己。' },
  { id: 27, limb: 'yama', theme: '節制', en: 'Try doing less.', zh: '少做一點試試。' },
  { id: 28, limb: 'yama', theme: '節制', en: 'Spend your strength on what matters.', zh: '力氣留給重要的事。' },
  // 不執取
  { id: 29, limb: 'yama', theme: '不執取', en: 'Loosen your hand.', zh: '手鬆一點。' },
  { id: 30, limb: 'yama', theme: '不執取', en: 'Keep only what you want to keep.', zh: '想留的才留。' },
  { id: 31, limb: 'yama', theme: '不執取', en: 'Empty holds more.', zh: '空著才裝得下。' },
  { id: 32, limb: 'yama', theme: '不執取', en: 'Love it and let it go.', zh: '愛它也放它走。' },
  { id: 33, limb: 'yama', theme: '不執取', en: 'Let it move on its own.', zh: '讓它自己走。' },
  { id: 34, limb: 'yama', theme: '不執取', en: 'Hand this one to time.', zh: '這次交給時間。' },
  { id: 35, limb: 'yama', theme: '不執取', en: 'If it goes, let it.', zh: '留不住就放手。' },
  { id: 36, limb: 'yama', theme: '不執取', en: 'Letting go moves you too.', zh: '放下也是往前。' },
  // ── 精進 Niyama ─
  // 潔淨
  { id: 37, limb: 'niyama', theme: '潔淨', en: 'Let the air in.', zh: '讓風進來。' },
  { id: 38, limb: 'niyama', theme: '潔淨', en: 'Let the old things go.', zh: '舊東西讓它走。' },
  { id: 39, limb: 'niyama', theme: '潔淨', en: 'Keep it simple.', zh: '簡單一點。' },
  { id: 40, limb: 'niyama', theme: '潔淨', en: 'Clear one corner.', zh: '整理一個角落。' },
  { id: 41, limb: 'niyama', theme: '潔淨', en: 'Turn off what\'s loud.', zh: '吵的東西關掉。' },
  { id: 42, limb: 'niyama', theme: '潔淨', en: 'Keep one patch of open ground.', zh: '留一塊空地。' },
  // 知足
  { id: 43, limb: 'niyama', theme: '知足', en: 'The good is right here.', zh: '好東西就在眼前。' },
  { id: 44, limb: 'niyama', theme: '知足', en: 'Some things never left.', zh: '有些東西一直在。' },
  { id: 45, limb: 'niyama', theme: '知足', en: 'You can rest easy now.', zh: '現在就可以安心。' },
  { id: 46, limb: 'niyama', theme: '知足', en: 'This is already enough.', zh: '這些已經夠了。' },
  { id: 47, limb: 'niyama', theme: '知足', en: 'There\'s good in the ordinary.', zh: '平常裡有好東西。' },
  { id: 48, limb: 'niyama', theme: '知足', en: 'A little counts too.', zh: '一點點也算數。' },
  { id: 49, limb: 'niyama', theme: '知足', en: 'Stop and you\'ll see.', zh: '停下來就看見了。' },
  { id: 50, limb: 'niyama', theme: '知足', en: 'Stay here a while.', zh: '在這裡待一下。' },
  // 自律
  { id: 51, limb: 'niyama', theme: '自律', en: 'A little more.', zh: '再一點點。' },
  { id: 52, limb: 'niyama', theme: '自律', en: 'One step out is the start.', zh: '踏出去就是開始。' },
  { id: 53, limb: 'niyama', theme: '自律', en: 'Slow is still walking.', zh: '慢也是在走。' },
  { id: 54, limb: 'niyama', theme: '自律', en: 'Change can be quiet.', zh: '改變有時很安靜。' },
  { id: 55, limb: 'niyama', theme: '自律', en: 'Roots grow slowly.', zh: '根長得很慢。' },
  { id: 56, limb: 'niyama', theme: '自律', en: 'Start with something small.', zh: '先從小事開始。' },
  { id: 57, limb: 'niyama', theme: '自律', en: 'The ache is change moving.', zh: '不舒服是在變。' },
  // 自我研習
  { id: 58, limb: 'niyama', theme: '自我研習', en: 'That thought is back.', zh: '那個念頭又來了。' },
  { id: 59, limb: 'niyama', theme: '自我研習', en: 'The reaction is more honest than the thing.', zh: '反應比事情誠實。' },
  { id: 60, limb: 'niyama', theme: '自我研習', en: 'Just watch it.', zh: '先看著它。' },
  { id: 61, limb: 'niyama', theme: '自我研習', en: 'Repetition is the clue.', zh: '重複就是線索。' },
  { id: 62, limb: 'niyama', theme: '自我研習', en: 'You know yourself.', zh: '你懂你自己。' },
  { id: 63, limb: 'niyama', theme: '自我研習', en: 'Look deeper.', zh: '再看深一點。' },
  { id: 64, limb: 'niyama', theme: '自我研習', en: 'Quiet makes it visible.', zh: '安靜了才看得見。' },
  // 交託
  { id: 65, limb: 'niyama', theme: '交託', en: 'Some things finish themselves.', zh: '有些事自己會完成。' },
  { id: 66, limb: 'niyama', theme: '交託', en: 'Pick one thing and let go.', zh: '挑一件事放手。' },
  { id: 67, limb: 'niyama', theme: '交託', en: 'You\'ll know on the way.', zh: '路上就知道了。' },
  { id: 68, limb: 'niyama', theme: '交託', en: 'The road comes back.', zh: '路會再出現。' },
  { id: 69, limb: 'niyama', theme: '交託', en: 'Carry your own share.', zh: '揹好自己那份。' },
  { id: 70, limb: 'niyama', theme: '交託', en: 'The answer can wait.', zh: '答案晚點再說。' },
  { id: 71, limb: 'niyama', theme: '交託', en: 'You\'ve done enough.', zh: '你做得夠多了。' },
  { id: 72, limb: 'niyama', theme: '交託', en: 'Let it finish on its own.', zh: '讓它自己走完。' },
  // ── 體位 Asana ─
  { id: 73, limb: 'asana', theme: null, en: 'Find a place that\'s comfortable.', zh: '找個舒服的位置。' },
  { id: 74, limb: 'asana', theme: null, en: 'Loose and still standing.', zh: '鬆著也站得住。' },
  { id: 75, limb: 'asana', theme: null, en: 'The body knows before you do.', zh: '身體比你先知道。' },
  { id: 76, limb: 'asana', theme: null, en: 'Stand before you walk.', zh: '站穩再走。' },
  { id: 77, limb: 'asana', theme: null, en: 'Come back into the body.', zh: '回到身體裡。' },
  { id: 78, limb: 'asana', theme: null, en: 'Just stay here.', zh: '先待在這裡。' },
  { id: 79, limb: 'asana', theme: null, en: 'Give your weight to the floor.', zh: '把重量交給地板。' },
  // ── 調息 Pranayama ─
  { id: 80, limb: 'pranayama', theme: null, en: 'Breathe first.', zh: '先呼吸。' },
  { id: 81, limb: 'pranayama', theme: null, en: 'Empty out before you breathe in.', zh: '空出來才吸得進。' },
  { id: 82, limb: 'pranayama', theme: null, en: 'The breath slows and the mind follows.', zh: '氣慢了心就慢了。' },
  { id: 83, limb: 'pranayama', theme: null, en: 'Come back on this breath.', zh: '跟著這口氣回來。' },
  { id: 84, limb: 'pranayama', theme: null, en: 'The next breath comes by itself.', zh: '下一口自己會來。' },
  { id: 85, limb: 'pranayama', theme: null, en: 'Between two breaths it\'s empty.', zh: '兩口氣中間是空的。' },
  { id: 86, limb: 'pranayama', theme: null, en: 'One breath after another.', zh: '一口接一口。' },
  // ── 制感 Pratyahara ─
  { id: 87, limb: 'pratyahara', theme: null, en: 'Let some of it pass.', zh: '有些話讓它過去。' },
  { id: 88, limb: 'pratyahara', theme: null, en: 'Outside things stay outside.', zh: '外面的事留在外面。' },
  { id: 89, limb: 'pratyahara', theme: null, en: 'Turn it down.', zh: '把音量轉小。' },
  { id: 90, limb: 'pratyahara', theme: null, en: 'The world can wait.', zh: '世界可以等。' },
  { id: 91, limb: 'pratyahara', theme: null, en: 'It\'s still quiet in there.', zh: '裡面還是安靜的。' },
  { id: 92, limb: 'pratyahara', theme: null, en: 'Pull your attention back.', zh: '把注意力收回來。' },
  // ── 專注 Dharana ─
  { id: 93, limb: 'dharana', theme: null, en: 'One thing at a time.', zh: '一次一件事。' },
  { id: 94, limb: 'dharana', theme: null, en: 'One thought at a time.', zh: '一次想一件。' },
  { id: 95, limb: 'dharana', theme: null, en: 'When it wanders bring it back.', zh: '跑掉了就帶回來。' },
  { id: 96, limb: 'dharana', theme: null, en: 'Look at what\'s in front of you.', zh: '看著眼前就好。' },
  { id: 97, limb: 'dharana', theme: null, en: 'Coming back counts.', zh: '回來就算數。' },
  { id: 98, limb: 'dharana', theme: null, en: 'Mind what matters.', zh: '顧好重要的事。' },
  // ── 禪那 Dhyana ─
  { id: 99, limb: 'dhyana', theme: null, en: 'Leave time to do nothing.', zh: '留點時間發呆。' },
  { id: 100, limb: 'dhyana', theme: null, en: 'Watch thoughts come and go.', zh: '看著念頭來來去去。' },
  { id: 101, limb: 'dhyana', theme: null, en: 'Just sit quietly.', zh: '靜靜坐著就好。' },
  { id: 102, limb: 'dhyana', theme: null, en: 'Between thoughts it\'s empty.', zh: '念頭中間是空的。' },
  { id: 103, limb: 'dhyana', theme: null, en: 'Stillness arrives on its own.', zh: '平靜自己會來。' },
  // ── 三摩地 Samadhi ─
  { id: 104, limb: 'samadhi', theme: null, en: 'Back into your life.', zh: '回到生活裡。' },
  { id: 105, limb: 'samadhi', theme: null, en: 'Move toward what\'s happening.', zh: '靠近正在發生的事。' },
  { id: 106, limb: 'samadhi', theme: null, en: 'Feel it first.', zh: '先感覺看看。' },
  { id: 107, limb: 'samadhi', theme: null, en: 'Edges can loosen.', zh: '邊界可以鬆開。' },
  { id: 108, limb: 'samadhi', theme: null, en: 'All of you here.', zh: '整個人在這裡。' },
];

// 夜晚卡（108）：靜坐後的回看與反省。
// 19:00 後的靜坐會抽這一組。
// id 與白天卡對齊（1..108），共用同一套 limb / theme。
export const NIGHT_CARDS: Card[] = [
  // ── 持戒 Yama ─
  // 非暴力
  { id: 1, limb: 'yama', theme: '非暴力', en: 'Did you push too hard today?', zh: '今天逼太緊了嗎？' },
  { id: 2, limb: 'yama', theme: '非暴力', en: 'Today took a lot to hold up.', zh: '今天撐得很辛苦吧。' },
  { id: 3, limb: 'yama', theme: '非暴力', en: 'You can let yourself off today.', zh: '今天可以放過自己。' },
  { id: 4, limb: 'yama', theme: '非暴力', en: 'What\'s still unsaid?', zh: '還有什麼話沒說？' },
  { id: 5, limb: 'yama', theme: '非暴力', en: 'You can set down what you carried.', zh: '揹著的可以放下了。' },
  { id: 6, limb: 'yama', theme: '非暴力', en: 'You worked hard enough today.', zh: '你今天夠努力了。' },
  { id: 7, limb: 'yama', theme: '非暴力', en: 'What would you say to yourself back there?', zh: '回到那一刻你想說什麼？' },
  { id: 8, limb: 'yama', theme: '非暴力', en: 'That fight can stop.', zh: '那場仗可以停了。' },
  // 真實
  { id: 9, limb: 'yama', theme: '真實', en: 'What surfaced?', zh: '什麼浮上來了？' },
  { id: 10, limb: 'yama', theme: '真實', en: 'What did you already know?', zh: '你早就知道什麼？' },
  { id: 11, limb: 'yama', theme: '真實', en: 'That\'s enough said.', zh: '說到這裡就好。' },
  { id: 12, limb: 'yama', theme: '真實', en: 'What got clearer?', zh: '什麼變清楚了？' },
  { id: 13, limb: 'yama', theme: '真實', en: 'Which truth is still unsaid?', zh: '哪句真話還沒說？' },
  { id: 14, limb: 'yama', theme: '真實', en: 'Seeing it was enough.', zh: '看見了就夠了。' },
  { id: 15, limb: 'yama', theme: '真實', en: 'Let the feeling stay a while.', zh: '讓感覺待一會兒。' },
  // 不偷盜
  { id: 16, limb: 'yama', theme: '不偷盜', en: 'Where did your attention go?', zh: '注意力去哪了？' },
  { id: 17, limb: 'yama', theme: '不偷盜', en: 'The comparing ends here.', zh: '比較到這裡。' },
  { id: 18, limb: 'yama', theme: '不偷盜', en: 'You have more than you remember.', zh: '你有的比你記得的多。' },
  { id: 19, limb: 'yama', theme: '不偷盜', en: 'Who got your time?', zh: '時間都給誰了？' },
  { id: 20, limb: 'yama', theme: '不偷盜', en: 'What\'s theirs stays at the door.', zh: '別人的事留在門外。' },
  { id: 21, limb: 'yama', theme: '不偷盜', en: 'Give yourself back.', zh: '把自己還給自己。' },
  // 節制
  { id: 22, limb: 'yama', theme: '節制', en: 'Where did your strength go?', zh: '力氣花到哪去了？' },
  { id: 23, limb: 'yama', theme: '節制', en: 'Half is enough for some things.', zh: '有些事做一半就好。' },
  { id: 24, limb: 'yama', theme: '節制', en: 'Save what\'s left for sleep.', zh: '剩下的力氣留著睡。' },
  { id: 25, limb: 'yama', theme: '節制', en: 'Did you say yes too fast?', zh: '是不是答應太快了？' },
  { id: 26, limb: 'yama', theme: '節制', en: 'Less would have been lighter.', zh: '少做一點就輕了。' },
  { id: 27, limb: 'yama', theme: '節制', en: 'What drained you most?', zh: '哪件事最耗你？' },
  { id: 28, limb: 'yama', theme: '節制', en: 'This is enough.', zh: '這樣就夠了。' },
  // 不執取
  { id: 29, limb: 'yama', theme: '不執取', en: 'What\'s still in your hand?', zh: '手裡還抓著什麼？' },
  { id: 30, limb: 'yama', theme: '不執取', en: 'What if you just left it?', zh: '就放著會怎樣？' },
  { id: 31, limb: 'yama', theme: '不執取', en: 'It left. You\'re still here.', zh: '東西走了人還在。' },
  { id: 32, limb: 'yama', theme: '不執取', en: 'Leave the thought at the door.', zh: '把念頭留在門口。' },
  { id: 33, limb: 'yama', theme: '不執取', en: 'Leave the unfinished here.', zh: '沒做完的留在這裡。' },
  { id: 34, limb: 'yama', theme: '不執取', en: 'Loosen a little.', zh: '鬆開一點。' },
  { id: 35, limb: 'yama', theme: '不執取', en: 'Carry what you can carry.', zh: '扛得動的再扛。' },
  { id: 36, limb: 'yama', theme: '不執取', en: 'What\'s left after you let go?', zh: '放下後還剩什麼？' },
  // ── 精進 Niyama ─
  // 潔淨
  { id: 37, limb: 'niyama', theme: '潔淨', en: 'Leave the noise at the door.', zh: '把雜音留在門外。' },
  { id: 38, limb: 'niyama', theme: '潔淨', en: 'Wash a little of today off.', zh: '把今天洗掉一點。' },
  { id: 39, limb: 'niyama', theme: '潔淨', en: 'What\'s taking up too much room?', zh: '什麼佔了太多位置？' },
  { id: 40, limb: 'niyama', theme: '潔淨', en: 'Leave the old things with today.', zh: '舊東西留給今天。' },
  { id: 41, limb: 'niyama', theme: '潔淨', en: 'One corner is enough.', zh: '收一個角落就好。' },
  { id: 42, limb: 'niyama', theme: '潔淨', en: 'Leave some blank before sleep.', zh: '睡前留點空白。' },
  // 知足
  { id: 43, limb: 'niyama', theme: '知足', en: 'Take one good thing with you.', zh: '帶一件好事走。' },
  { id: 44, limb: 'niyama', theme: '知足', en: 'Thank the ordinary things too.', zh: '平常的事也要謝。' },
  { id: 45, limb: 'niyama', theme: '知足', en: 'There was a moment you were full.', zh: '有一刻你是滿的。' },
  { id: 46, limb: 'niyama', theme: '知足', en: 'What was always there still is.', zh: '一直在的都還在。' },
  { id: 47, limb: 'niyama', theme: '知足', en: 'Remember what you had today.', zh: '記得你今天有什麼。' },
  { id: 48, limb: 'niyama', theme: '知足', en: 'Today was whole.', zh: '今天是完整的。' },
  { id: 49, limb: 'niyama', theme: '知足', en: 'Today had what it needed.', zh: '今天該有的都有了。' },
  { id: 50, limb: 'niyama', theme: '知足', en: 'Take something good to sleep.', zh: '帶著好的事去睡。' },
  // 自律
  { id: 51, limb: 'niyama', theme: '自律', en: 'You held on today.', zh: '你今天撐住了。' },
  { id: 52, limb: 'niyama', theme: '自律', en: 'It was hard and you got through.', zh: '很辛苦你也過來了。' },
  { id: 53, limb: 'niyama', theme: '自律', en: 'Growth happens where you can\'t see.', zh: '看不見的地方在長。' },
  { id: 54, limb: 'niyama', theme: '自律', en: 'Today\'s effort counts.', zh: '今天的努力算數。' },
  { id: 55, limb: 'niyama', theme: '自律', en: 'What did the ache show you?', zh: '難受帶你看見什麼？' },
  { id: 56, limb: 'niyama', theme: '自律', en: 'Results can come later.', zh: '結果可以晚點來。' },
  { id: 57, limb: 'niyama', theme: '自律', en: 'Today ends here.', zh: '今天到這裡就好。' },
  // 自我研習
  { id: 58, limb: 'niyama', theme: '自我研習', en: 'What got under your skin?', zh: '哪件事戳到你了？' },
  { id: 59, limb: 'niyama', theme: '自我研習', en: 'What\'s under the reaction?', zh: '反應底下是什麼？' },
  { id: 60, limb: 'niyama', theme: '自我研習', en: 'Same pattern again?', zh: '老樣子又來了嗎？' },
  { id: 61, limb: 'niyama', theme: '自我研習', en: 'Did you meet a self you hadn\'t met?', zh: '看到沒看過的自己嗎？' },
  { id: 62, limb: 'niyama', theme: '自我研習', en: 'What did today teach you?', zh: '今天教了你什麼？' },
  { id: 63, limb: 'niyama', theme: '自我研習', en: 'Name it tomorrow.', zh: '名字明天再說。' },
  { id: 64, limb: 'niyama', theme: '自我研習', en: 'The answer comes on its own.', zh: '答案會自己來。' },
  // 交託
  { id: 65, limb: 'niyama', theme: '交託', en: 'You did what you could.', zh: '能做的你做了。' },
  { id: 66, limb: 'niyama', theme: '交託', en: 'Hand the rest over.', zh: '剩下的交出去。' },
  { id: 67, limb: 'niyama', theme: '交託', en: 'Handle what you can tomorrow.', zh: '管得動的明天再管。' },
  { id: 68, limb: 'niyama', theme: '交託', en: 'You can sleep without the answer.', zh: '沒答案也能睡。' },
  { id: 69, limb: 'niyama', theme: '交託', en: 'Set the worry down.', zh: '擔心先放著。' },
  { id: 70, limb: 'niyama', theme: '交託', en: 'Tomorrow has its own tomorrow.', zh: '明天還有明天。' },
  { id: 71, limb: 'niyama', theme: '交託', en: 'The answer has its own timing.', zh: '答案有它的時間。' },
  { id: 72, limb: 'niyama', theme: '交託', en: 'Open your hand on the outcome.', zh: '把結果放開。' },
  // ── 體位 Asana ─
  { id: 73, limb: 'asana', theme: null, en: 'What\'s still holding on?', zh: '哪裡還在撐？' },
  { id: 74, limb: 'asana', theme: null, en: 'There was a moment you stood firm.', zh: '有一刻你站穩了。' },
  { id: 75, limb: 'asana', theme: null, en: 'Did the body know first?', zh: '身體先知道了嗎？' },
  { id: 76, limb: 'asana', theme: null, en: 'What can soften now?', zh: '現在可以鬆哪裡？' },
  { id: 77, limb: 'asana', theme: null, en: 'Back in the body the circling stops.', zh: '回到身體念頭就停了。' },
  { id: 78, limb: 'asana', theme: null, en: 'Let the weight reach the ground.', zh: '讓重量落到地上。' },
  { id: 79, limb: 'asana', theme: null, en: 'The posture can dissolve.', zh: '姿勢可以散了。' },
  // ── 調息 Pranayama ─
  { id: 80, limb: 'pranayama', theme: null, en: 'Was there a moment you forgot to breathe?', zh: '有一刻忘了呼吸嗎？' },
  { id: 81, limb: 'pranayama', theme: null, en: 'One breath brought you back.', zh: '有一口氣把你帶回來。' },
  { id: 82, limb: 'pranayama', theme: null, en: 'Breathe today out.', zh: '把今天吐出去。' },
  { id: 83, limb: 'pranayama', theme: null, en: 'What\'s still on your chest?', zh: '胸口還壓著什麼？' },
  { id: 84, limb: 'pranayama', theme: null, en: 'Empty this breath out.', zh: '把這口氣吐乾淨。' },
  { id: 85, limb: 'pranayama', theme: null, en: 'Let the breath close it.', zh: '讓呼吸收尾。' },
  { id: 86, limb: 'pranayama', theme: null, en: 'The next breath is enough.', zh: '下一口氣就夠了。' },
  // ── 制感 Pratyahara ─
  { id: 87, limb: 'pratyahara', theme: null, en: 'Which voice stayed with you too long?', zh: '哪個聲音跟你太久了？' },
  { id: 88, limb: 'pratyahara', theme: null, en: 'Switch off today\'s voices.', zh: '把今天的聲音關掉。' },
  { id: 89, limb: 'pratyahara', theme: null, en: 'Reply tomorrow.', zh: '話明天再回。' },
  { id: 90, limb: 'pratyahara', theme: null, en: 'Let the sound settle.', zh: '讓聲音沉下去。' },
  { id: 91, limb: 'pratyahara', theme: null, en: 'The world can find you later.', zh: '世界晚點再找你。' },
  { id: 92, limb: 'pratyahara', theme: null, en: 'Your mind can come back now.', zh: '心可以收回來了。' },
  // ── 專注 Dharana ─
  { id: 93, limb: 'dharana', theme: null, en: 'Where did your mind go most?', zh: '心最常跑去哪？' },
  { id: 94, limb: 'dharana', theme: null, en: 'What was worth your attention?', zh: '什麼才值得看？' },
  { id: 95, limb: 'dharana', theme: null, en: 'There was a moment you were all here.', zh: '有一刻你全在這裡。' },
  { id: 96, limb: 'dharana', theme: null, en: 'What kept pulling you off?', zh: '什麼一直拉走你？' },
  { id: 97, limb: 'dharana', theme: null, en: 'Coming back at all was enough.', zh: '有回來過就好。' },
  { id: 98, limb: 'dharana', theme: null, en: 'Keep one thing for sleep.', zh: '睡前只留一件事。' },
  // ── 禪那 Dhyana ─
  { id: 99, limb: 'dhyana', theme: null, en: 'When did the quiet arrive on its own?', zh: '哪一刻安靜自己來了？' },
  { id: 100, limb: 'dhyana', theme: null, en: 'Just sitting was enough.', zh: '只是坐著也很好。' },
  { id: 101, limb: 'dhyana', theme: null, en: 'Was there space between thoughts?', zh: '念頭中間有空白嗎？' },
  { id: 102, limb: 'dhyana', theme: null, en: 'Thoughts can leave on their own.', zh: '念頭可以自己走。' },
  { id: 103, limb: 'dhyana', theme: null, en: 'The mind settles by itself.', zh: '心會自己靜下來。' },
  // ── 三摩地 Samadhi ─
  { id: 104, limb: 'samadhi', theme: null, en: 'There was a moment you forgot the time.', zh: '有一刻你忘了時間。' },
  { id: 105, limb: 'samadhi', theme: null, en: 'There was a moment you were part of it all.', zh: '有一刻你跟一切在一起。' },
  { id: 106, limb: 'samadhi', theme: null, en: 'Some feelings can just stay.', zh: '有些感覺就這樣留著。' },
  { id: 107, limb: 'samadhi', theme: null, en: 'Let the edges loosen.', zh: '讓邊界鬆一點。' },
  { id: 108, limb: 'samadhi', theme: null, en: 'Only this breath left.', zh: '只剩這一口氣。' },
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
