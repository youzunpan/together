// 每日抽卡：108 張卡文。
//
// 結構依帕坦伽利八肢（Aṣṭāṅga）展開，三等份各 36：
//   持戒 Yama 36 / 精進 Niyama 36 / 內六肢 36
// 108 呼應念珠。
//
// 中英對照，語氣溫柔、留給讀者解讀空間。全部原創（市售彩虹卡有版權，
// 不可引用或改寫）。歷代版本都在 git 歷史裡。
//
// 版本（2026-09）：
//   - 白天卡：2026-09-18 換成樽自己整理的「彩虹卡語感」版，原文照收，不要潤稿。
//   - 夜晚卡：2026-09-15 的版本。寫法規則是「單句不用逗號、陳述句一律肯定、
//     口語不書面」，問句保留（反思要靠提問打開）。
// 卡文由樽在 app 外改稿、交 markdown 表格回來整批換，不要自行改字。
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
  { id: 1, limb: 'yama', theme: '非暴力', en: 'Care for yourself as you would someone you love.', zh: '把自己當成喜歡的人來照顧。' },
  { id: 2, limb: 'yama', theme: '非暴力', en: 'Stand your ground with gentleness.', zh: '溫柔地守住自己的立場。' },
  { id: 3, limb: 'yama', theme: '非暴力', en: 'Rest a while when you’re tired.', zh: '走累了就歇一會兒。' },
  { id: 4, limb: 'yama', theme: '非暴力', en: 'Let out a sigh of relief.', zh: '鬆一口氣吧。' },
  { id: 5, limb: 'yama', theme: '非暴力', en: 'Offer yourself a little understanding.', zh: '給自己一點體諒。' },
  { id: 6, limb: 'yama', theme: '非暴力', en: 'The places that hurt deserve a gentle touch.', zh: '受傷的地方值得被輕輕照顧。' },
  { id: 7, limb: 'yama', theme: '非暴力', en: 'Save some kindness for yourself.', zh: '留一點善意給自己。' },
  { id: 8, limb: 'yama', theme: '非暴力', en: 'There is strength in gentleness.', zh: '溫柔裡也有力量。' },
  // 真實
  { id: 9, limb: 'yama', theme: '真實', en: 'That quiet voice within you is worth listening to.', zh: '心裡那個輕輕的聲音值得一聽。' },
  { id: 10, limb: 'yama', theme: '真實', en: 'Every feeling has a reason for being here.', zh: '每一種感受都有它的來由。' },
  { id: 11, limb: 'yama', theme: '真實', en: 'Speaking honestly may bring a little relief.', zh: '說出真心話的時候，也許會鬆一口氣。' },
  { id: 12, limb: 'yama', theme: '真實', en: 'Say it in your own words.', zh: '用自己的話說就好。' },
  { id: 13, limb: 'yama', theme: '真實', en: 'Listen to yourself before you speak.', zh: '說出口以前，先聽聽自己。' },
  { id: 14, limb: 'yama', theme: '真實', en: 'What do you really want?', zh: '你真正想要的是什麼？' },
  { id: 15, limb: 'yama', theme: '真實', en: 'You can be honest with yourself.', zh: '在自己面前可以坦白一點。' },
  // 不偷盜
  { id: 16, limb: 'yama', theme: '不偷盜', en: 'Your own path is worth following.', zh: '走自己的路也很好。' },
  { id: 17, limb: 'yama', theme: '不偷盜', en: 'Bring your attention back to your own life.', zh: '把目光帶回自己的生活。' },
  { id: 18, limb: 'yama', theme: '不偷盜', en: 'Notice what you already hold in your hands.', zh: '看看你已經擁有的。' },
  { id: 19, limb: 'yama', theme: '不偷盜', en: 'You can enjoy the view from someone else’s path.', zh: '試著從別人的角度來欣賞風景' },
  { id: 20, limb: 'yama', theme: '不偷盜', en: 'Your own life deserves your care.', zh: '自己的日子值得好好過。' },
  { id: 21, limb: 'yama', theme: '不偷盜', en: 'Leave a share for someone else.', zh: '留一份給別人。' },
  // 節制
  { id: 22, limb: 'yama', theme: '節制', en: 'You can pace yourself.', zh: '放慢腳步' },
  { id: 23, limb: 'yama', theme: '節制', en: 'Let enough be enough.', zh: '剛剛好就很好。' },
  { id: 24, limb: 'yama', theme: '節制', en: 'Leave a little space in your day.', zh: '留一點空白給這一天。' },
  { id: 25, limb: 'yama', theme: '節制', en: 'Save your yes for what you truly want.', zh: '把答應留給心裡願意的事。' },
  { id: 26, limb: 'yama', theme: '節制', en: 'Remember to leave yourself some breathing room.', zh: '記得為自己留點餘裕。' },
  { id: 27, limb: 'yama', theme: '節制', en: 'What would it feel like to do a little less?', zh: '少做一點會是什麼感覺？' },
  { id: 28, limb: 'yama', theme: '節制', en: 'Give your energy to what you truly care about.', zh: '把心力用在真正在乎的事上。' },
  // 不執取
  { id: 29, limb: 'yama', theme: '不執取', en: 'You can open your hands now.', zh: '張開你的雙手。' },
  { id: 30, limb: 'yama', theme: '不執取', en: 'Keep what you love.', zh: '去蕪存菁' },
  { id: 31, limb: 'yama', theme: '不執取', en: 'An open space may make room for a new encounter.', zh: '空出來的地方也許會有新的相遇。' },
  { id: 32, limb: 'yama', theme: '不執取', en: 'Cherish the time you have together.', zh: '好好珍惜彼此相伴的時候。' },
  { id: 33, limb: 'yama', theme: '不執取', en: 'Let things unfold on their own for a while.', zh: '讓事情自然發展一會兒。' },
  { id: 34, limb: 'yama', theme: '不執取', en: 'What happens if you let go for a while?', zh: '暫時放手會怎麼樣？' },
  { id: 35, limb: 'yama', theme: '不執取', en: 'Say a gentle goodbye.', zh: '好好說一聲再見。' },
  { id: 36, limb: 'yama', theme: '不執取', en: 'A lighter load can make for a lighter step.', zh: '行李輕一點，腳步也會輕一些。' },
  // ── 精進 Niyama ─
  // 潔淨
  { id: 37, limb: 'niyama', theme: '潔淨', en: 'Open a window for yourself.', zh: '替自己開一扇窗。' },
  { id: 38, limb: 'niyama', theme: '潔淨', en: 'Take your time sorting through what you’ve kept.', zh: '舊東西可以慢慢整理。' },
  { id: 39, limb: 'niyama', theme: '潔淨', en: 'Keep it simple.', zh: '簡單一點。' },
  { id: 40, limb: 'niyama', theme: '潔淨', en: 'Start by clearing one small corner.', zh: '從整理一個小角落開始。' },
  { id: 41, limb: 'niyama', theme: '潔淨', en: 'With a little less noise around you, your own voice becomes clearer.', zh: '周圍安靜一點，心裡的聲音就清楚一些。' },
  { id: 42, limb: 'niyama', theme: '潔淨', en: 'Keep one uncluttered space for yourself.', zh: '留一處清爽的地方給自己。' },
  // 知足
  { id: 43, limb: 'niyama', theme: '知足', en: 'There is something to love in the ordinary moments around you.', zh: '眼前也有值得喜歡的日常。' },
  { id: 44, limb: 'niyama', theme: '知足', en: 'Cherish the company you’ve grown used to.', zh: '熟悉的陪伴也值得珍惜。' },
  { id: 45, limb: 'niyama', theme: '知足', en: 'Let yourself enjoy this little stretch of time.', zh: '安心享受這一小段時光。' },
  { id: 46, limb: 'niyama', theme: '知足', en: 'Perhaps this is lovely just as it is.', zh: '原來這樣就很好。' },
  { id: 47, limb: 'niyama', theme: '知足', en: 'Everyday life holds little joys.', zh: '平常的日子也藏著小幸福。' },
  { id: 48, limb: 'niyama', theme: '知足', en: 'Small good things are worth remembering.', zh: '小小的好也值得記住。' },
  { id: 49, limb: 'niyama', theme: '知足', en: 'Pause and look around.', zh: '停一停，看看身邊。' },
  { id: 50, limb: 'niyama', theme: '知足', en: 'Stay here for a while.', zh: '就在這裡待一下。' },
  // 自律
  { id: 51, limb: 'niyama', theme: '自律', en: 'Just one more small step.', zh: '再走一小步就好。' },
  { id: 52, limb: 'niyama', theme: '自律', en: 'You can begin right where you stand.', zh: '開始的地方就在腳下。' },
  { id: 53, limb: 'niyama', theme: '自律', en: 'Move at your own pace.', zh: '照著自己的步調走。' },
  { id: 54, limb: 'niyama', theme: '自律', en: 'Change can happen quietly.', zh: '改變有時候會發生在不知不覺之中' },
  { id: 55, limb: 'niyama', theme: '自律', en: 'Roots are slowly reaching deeper.', zh: '根正在慢慢往下扎' },
  { id: 56, limb: 'niyama', theme: '自律', en: 'A little each day adds up.', zh: '每天多一點點' },
  { id: 57, limb: 'niyama', theme: '自律', en: 'Your practice needs patience too.', zh: '練習也需要耐心陪伴。' },
  // 自我研習
  { id: 58, limb: 'niyama', theme: '自我研習', en: 'That thought is back. Listen to what it might be saying.', zh: '那個念頭又來了，聽聽它想說什麼。' },
  { id: 59, limb: 'niyama', theme: '自我研習', en: 'What stirs you may reveal what matters to you.', zh: '心裡的波動也許藏著你在乎的事。' },
  { id: 60, limb: 'niyama', theme: '自我研習', en: 'Look at your reaction with curiosity.', zh: '觀照自己的反應' },
  { id: 61, limb: 'niyama', theme: '自我研習', en: 'A familiar pattern can hold a new clue.', zh: '熟悉的情節裡也有新的線索。' },
  { id: 62, limb: 'niyama', theme: '自我研習', en: 'Take your time getting to know yourself.', zh: '慢慢認識自己就好。' },
  { id: 63, limb: 'niyama', theme: '自我研習', en: 'Ask yourself again: what is really bothering you?', zh: '問問自己，真正介意的是什麼？' },
  { id: 64, limb: 'niyama', theme: '自我研習', en: 'A little quiet may help something become clear.', zh: '安靜時也許會明白一些事。' },
  // 交託
  { id: 65, limb: 'niyama', theme: '交託', en: 'Some things can be entrusted to others.', zh: '有些事可以放心交出去。' },
  { id: 66, limb: 'niyama', theme: '交託', en: 'Let one thing take its own course.', zh: '讓一件事順其自然。' },
  { id: 67, limb: 'niyama', theme: '交託', en: 'Take your questions with you as you move forward.', zh: '帶著心裡的疑問往前走。' },
  { id: 68, limb: 'niyama', theme: '交託', en: 'You may find your direction as you go.', zh: '走著走著，也許就知道方向了。' },
  { id: 69, limb: 'niyama', theme: '交託', en: 'You can accept help too.', zh: '你也可以接受別人的幫忙。' },
  { id: 70, limb: 'niyama', theme: '交託', en: 'The answers can come in their own time.', zh: '答案可以慢慢來。' },
  { id: 71, limb: 'niyama', theme: '交託', en: 'Let your part be enough.', zh: '做完自己的那一份就好。' },
  { id: 72, limb: 'niyama', theme: '交託', en: 'Flowers bloom in their own time.', zh: '花有自己的花期。' },
  // ── 體位 Asana ─
  { id: 73, limb: 'asana', theme: null, en: 'Settle into a comfortable position.', zh: '找個舒服的位置安頓自己。' },
  { id: 74, limb: 'asana', theme: null, en: 'You can relax and still stand steady.', zh: '放鬆一點也能站得穩。' },
  { id: 75, limb: 'asana', theme: null, en: 'Listen to what your body is telling you.', zh: '聽聽身體想告訴你什麼。' },
  { id: 76, limb: 'asana', theme: null, en: 'Take a moment to feel the ground beneath your feet.', zh: '好好感覺腳下的地面。' },
  { id: 77, limb: 'asana', theme: null, en: 'Come back to your body.', zh: '回到身體裡。' },
  { id: 78, limb: 'asana', theme: null, en: 'You can settle here for a while.', zh: '這裡可以安心停留。' },
  { id: 79, limb: 'asana', theme: null, en: 'The ground can hold your weight.', zh: '地面承得住你的重量。' },
  // ── 調息 Pranayama ─
  { id: 80, limb: 'pranayama', theme: null, en: 'Breathe first.', zh: '先呼吸就好。' },
  { id: 81, limb: 'pranayama', theme: null, en: 'Relax gently as you breathe out.', zh: '隨著吐氣慢慢放鬆。' },
  { id: 82, limb: 'pranayama', theme: null, en: 'Let your breath help you slow down.', zh: '讓呼吸陪你慢下來。' },
  { id: 83, limb: 'pranayama', theme: null, en: 'This breath can bring you back to the present.', zh: '這一口氣可以帶你回到此刻。' },
  { id: 84, limb: 'pranayama', theme: null, en: 'Let your breath find its own rhythm.', zh: '讓呼吸照自己的節奏來。' },
  { id: 85, limb: 'pranayama', theme: null, en: 'Notice the brief quiet between breaths.', zh: '留意呼吸之間的片刻安靜。' },
  { id: 86, limb: 'pranayama', theme: null, en: 'Just follow the next breath.', zh: '跟著下一口氣就好。' },
  // ── 制感 Pratyahara ─
  { id: 87, limb: 'pratyahara', theme: null, en: 'Let sounds come and go.', zh: '讓外在的聲音經過' },
  { id: 88, limb: 'pratyahara', theme: null, en: 'The outside world can wait a little.', zh: '外面的事可以等一會兒。' },
  { id: 89, limb: 'pratyahara', theme: null, en: 'Turn the volume down a little.', zh: '把音量調小一點。' },
  { id: 90, limb: 'pratyahara', theme: null, en: 'Keep these few minutes for yourself.', zh: '這幾分鐘留給自己。' },
  { id: 91, limb: 'pratyahara', theme: null, en: 'There is a place to rest within you too.', zh: '心裡也有可以歇腳的地方。' },
  { id: 92, limb: 'pratyahara', theme: null, en: 'Gently gather your scattered attention.', zh: '把散出去的注意力慢慢收回來。' },
  // ── 專注 Dharana ─
  { id: 93, limb: 'dharana', theme: null, en: 'One thing at a time.', zh: '一次一件事。' },
  { id: 94, limb: 'dharana', theme: null, en: 'What matters most to you right now?', zh: '心裡最重要的那件事是什麼？' },
  { id: 95, limb: 'dharana', theme: null, en: 'When your mind wanders, gently bring it back.', zh: '心跑遠了，再輕輕帶它回來。' },
  { id: 96, limb: 'dharana', theme: null, en: 'Give your full attention to what you’re doing.', zh: '好好專注在手上這件事。' },
  { id: 97, limb: 'dharana', theme: null, en: 'Let your mind rest in this moment.', zh: '讓心在這一刻停一停。' },
  { id: 98, limb: 'dharana', theme: null, en: 'What’s in front of you is worth your full attention.', zh: '專心在你眼前這件事情。' },
  // ── 禪那 Dhyana ─
  { id: 99, limb: 'dhyana', theme: null, en: 'Make a little time to sit quietly.', zh: '留一點時間安靜地待著。' },
  { id: 100, limb: 'dhyana', theme: null, en: 'Watch your thoughts come and go.', zh: '看著念頭來來去去。' },
  { id: 101, limb: 'dhyana', theme: null, en: 'Simply sit quietly.', zh: '靜靜坐著就好。' },
  { id: 102, limb: 'dhyana', theme: null, en: 'Clouds drift by, and the sky stays wide.', zh: '雲慢慢飄過，天空依然寬闊。' },
  { id: 103, limb: 'dhyana', theme: null, en: 'Give stillness a little time.', zh: '給平靜一點時間。' },
  // ── 三摩地 Samadhi ─
  { id: 104, limb: 'samadhi', theme: null, en: 'Come a little closer to life.', zh: '和生活靠近一點。' },
  { id: 105, limb: 'samadhi', theme: null, en: 'Feel the breeze against your skin.', zh: '感覺風吹過皮膚。' },
  { id: 106, limb: 'samadhi', theme: null, en: 'Take in what is right here.', zh: '試著感受眼前的一切。' },
  { id: 107, limb: 'samadhi', theme: null, en: 'You are part of this world too.', zh: '你也是這個世界的一部分。' },
  { id: 108, limb: 'samadhi', theme: null, en: 'Be fully here.', zh: '全心待在這一刻。' },
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
