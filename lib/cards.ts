// 每日抽卡：108 張卡文。
//
// 結構依帕坦伽利八肢（Aṣṭāṅga）展開，三等份各 36：
//   持戒 Yama 36 / 精進 Niyama 36 / 內六肢 36
// 108 呼應念珠。
//
// 中英對照，語氣溫柔、留給讀者解讀空間。全部原創（市售彩虹卡有版權，
// 不可引用或改寫）。歷代版本都在 git 歷史裡。
//
// 版本：2026-09-18 換成樽自己整理的「彩虹卡語感」版，原文照收。
// 卡文由樽在 app 外改稿、交 markdown 表格回來整批換，不要自行改字。
//
// 2026-09-24：拿掉日夜兩副牌的設計，統一只留這 108 張。
// 夜晚卡的卡文留在 git 歷史裡（commit f9f190a 之前）。
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

// 108 張卡。靜坐完抽一張。
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

/** id -> Card，給抽卡紀錄回查用。DB 的 daily_cards 只存 card_id。 */
export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function getCard(id: number): Card | undefined {
  return CARD_BY_ID.get(id);
}
