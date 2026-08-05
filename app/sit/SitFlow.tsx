"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { recordSit } from "@/lib/actions/sits";
import { scheduleSitEndPush, cancelPushJob } from "@/lib/actions/push";
import { drawCard } from "@/lib/actions/cards";
import { playBell, createBellContext, renderBellWavUrl } from "@/components/BellSound";
import { CardFlip, CardFace, CardBackMini } from "@/components/DailyCard";
import type { Card } from "@/lib/cards";
import { createClient as createSupabase } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

// card = 坐完抽今天的卡（今天已抽過就直接跳過去 record）
type Step = "pick" | "prepare" | "timer" | "tap_to_end" | "card" | "record";
const inputStyle = {
  width: "100%", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.08)",
  // fontSize 必須 ≥ 16px，否則 iOS Safari 點進去會自動放大畫面而且不會自己縮回
  padding: "0.75rem 1rem", fontSize: "16px", color: "#edecea", outline: "none",
  borderRadius: 4,
};

export default function SitFlow() {
  const [step, setStep] = useState<Step>("pick");
  const [selectedMin, setSelectedMin] = useState(18);
  const [customMin, setCustomMin] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [actualStart, setActualStart] = useState<Date | null>(null);
  const [actualMin, setActualMin] = useState(0);
  // 每日抽卡
  const [todayCard, setTodayCard] = useState<Card | null>(null);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [attachCard, setAttachCard] = useState(true); // 預設附上（卡文是公開內容，不涉隱私）
  const drawStartedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const presenceRef = useRef<RealtimeChannel | null>(null);
  // 鈴聲：HTMLAudioElement 路徑（繞過 iOS 靜音鍵 + 螢幕鎖定）
  const bellUrlRef = useRef<string | null>(null);
  // 目前正在播放的 <audio>（用來在螢幕鎖定時主動暫停，避免 iOS 中斷音訊 session 的「逼」聲）
  const activeBellAudioRef = useRef<HTMLAudioElement | null>(null);
  // 結束鈴推播 job id（螢幕鎖定靜默時靠它喚醒；前景自然結束會 cancel 掉）
  const pushJobRef = useRef<string | null>(null);
  // 覆蓋層出現的時間戳，用來忽略前 600ms 的點擊（避免 iOS 把通知的 tap 當作畫面點擊）
  const awaitingShownAtRef = useRef(0);
  // 這次 sit 期間是否有進過背景（螢幕鎖定 / 切 app）。有的話過了 gesture window，結束鳴鐘改走 tap。
  const wasHiddenRef = useRef(false);
  // 計時器跨過 0 的鈴聲是否已響過（避免重複響）。每次 startTimer 重置。
  const bellRangRef = useRef(false);
  // 超時秒數（鈴響後使用者還沒按停止的時間）
  const [overtime, setOvertime] = useState(0);
  // 第一次按「開始靜心」前要不要先問通知權限
  const [pushPromptOpen, setPushPromptOpen] = useState(false);
  const [pushPromptBusy, setPushPromptBusy] = useState(false);
  const pendingMinRef = useRef(0);
  // 時間輸入框：卡片在它上面，所以還沒填就按卡片時把游標帶過來
  const minInputRef = useRef<HTMLInputElement | null>(null);

  // 鈴聲播放：優先走 HTMLAudioElement（iOS 視為媒體，靜音鍵 + 螢幕鎖定皆可），
  // 失敗時 fallback 到原本的 Web Audio 即時合成。
  function ringBell() {
    const url = bellUrlRef.current;
    if (url) {
      try {
        const a = new Audio(url);
        a.preload = "auto";
        a.addEventListener("ended", () => {
          if (activeBellAudioRef.current === a) activeBellAudioRef.current = null;
        });
        activeBellAudioRef.current = a;
        a.play().catch(() => {
          // play 被擋（少見），fallback Web Audio
          playBell(audioCtxRef.current);
        });
        return;
      } catch {
        // 落到下面 fallback
      }
    }
    playBell(audioCtxRef.current);
  }

  // 預先合成銅缽 WAV，cache 給 ringBell 用。可在 user gesture 外呼叫（OfflineAudioContext 不需 gesture）。
  async function ensureBellPreloaded() {
    if (bellUrlRef.current) return;
    const url = await renderBellWavUrl();
    if (url) bellUrlRef.current = url;
  }

  // 進站就先合成（頁面開啟即觸發，使用者按開始時已經 ready）
  useEffect(() => {
    ensureBellPreloaded().catch(() => {
      // 失敗也沒關係，ringBell 會 fallback 到 Web Audio 即時合成
    });
    return () => {
      if (bellUrlRef.current) {
        try { URL.revokeObjectURL(bellUrlRef.current); } catch {}
        bellUrlRef.current = null;
      }
    };
  }, []);

  // Screen Wake Lock：避免在前景時螢幕自動熄屏。
  // 螢幕鎖定（使用者按電源鍵）時 JS 會被 iOS 凍結，那個 case 由 Web Push 處理（見 scheduleSitEndPush）。
  async function acquireWakeLock() {
    try {
      if (navigator.wakeLock && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current?.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      }
    } catch {}
  }
  function releaseWakeLock() {
    try {
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    } catch {}
  }
  // 從背景回前景：補拿 wakeLock + resume AudioContext
  // 關鍵：若計時器在背景已過期（iOS 螢幕鎖定 JS 被凍結），立刻在這個 tick 收尾響鈴。
  // 不能等 setInterval 下一次跑（可能已過了 user gesture window，iOS 會擋音）。
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "hidden") {
        // 螢幕鎖定 / 切到背景：主動把進行中的鈴聲完全銷毀 + AudioContext suspend
        // （只 pause 不夠：iOS Safari 在 resume / 下一個 user gesture 時會把 paused
        // audio 再播一次）
        if (step === "timer") wasHiddenRef.current = true;
        const a = activeBellAudioRef.current;
        if (a) {
          try { a.volume = 0; } catch {}
          try { a.pause(); } catch {}
          try { a.currentTime = 999; } catch {} // 跳到結尾，萬一還是被 resume 也沒聲音
          try { a.src = ""; } catch {}          // 卸掉音訊來源
          try { a.load(); } catch {}            // 強制重設、釋放
          activeBellAudioRef.current = null;
        }
        audioCtxRef.current?.suspend().catch(() => {});
        return;
      }
      if (document.visibilityState !== "visible") return;
      if (step !== "timer" || paused) return;
      audioCtxRef.current?.resume().catch(() => {});
      if (Date.now() >= endTimeRef.current && actualStart) {
        // 時間已到：交給 handleTimerEnd（內部會因 wasHiddenRef=true 改走輕觸鳴鐘）
        handleTimerEnd();
      } else {
        acquireWakeLock();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paused, actualStart, selectedMin]);
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [earlyEnd, setEarlyEnd] = useState(false);
  const [prepareLeft, setPrepareLeft] = useState(5);
  const prepareMinRef = useRef(0);
  const [companions, setCompanions] = useState(0); // 此刻除自己外的同坐人數

  function clearTimer() { if (intervalRef.current) clearInterval(intervalRef.current); }

  // 從 ?duration= 預填時長（給「同心」邀坐用），有值就自動進入 prepare。
  // 沒帶就留空，讓使用者自己填（原本會隨機高亮一個預設時間，已拿掉）。
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const d = Number(params.get("duration"));
    if (d >= 1 && d <= 240) {
      setSelectedMin(d);
      // 清掉 query string，避免 reload 又重觸
      window.history.replaceState({}, "", "/sit");
      // 進入 prepare（延一個 tick 讓 audioCtx 初始化完成）
      setTimeout(() => beginPrepare(d), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function joinLiveSitters() {
    try {
      const supabase = createSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ch = supabase.channel("live-sits", {
        config: { presence: { key: user.id } },
      });
      presenceRef.current = ch;

      // 監聽 presence sync，計算除自己以外的同坐人數
      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState();
        const sitters = Object.keys(state).filter((k) => !k.startsWith("viewer-"));
        const others = sitters.filter((k) => k !== user.id).length;
        setCompanions(others);
      });

      ch.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({ at: Date.now() });
        }
      });
    } catch { /* 靜默失敗，不影響計時 */ }
  }

  function leaveLiveSitters() {
    if (presenceRef.current) {
      presenceRef.current.unsubscribe();
      presenceRef.current = null;
    }
    setCompanions(0);
  }

  // 離開頁面自動退出 presence + 釋放 wakeLock
  useEffect(() => {
    return () => {
      leaveLiveSitters();
      releaseWakeLock();
    };
  }, []);

  // 計時器跨 0 點：響一次鈴 + 進入「超時」模式（不自動進記錄頁）。
  // 取消已排的「結束鈴」推播（前景已經響了，不需要 push fallback）。
  // 不離開 liveSitters / 不釋放 wakeLock —— 學生還在坐。
  const handleTimerEnd = useCallback(() => {
    if (bellRangRef.current) return; // 已響過就不再響
    bellRangRef.current = true;

    if (pushJobRef.current) {
      cancelPushJob(pushJobRef.current).catch(() => {});
      pushJobRef.current = null;
    }

    // 判斷是不是「從背景回來」：若 handleTimerEnd 被呼叫時，時間已超過 endTime 超過 1 秒，
    // 代表 iOS 凍結 JS 之後才解凍處理，過了 gesture window，自動 play 一定被擋。
    const lateBy = Date.now() - endTimeRef.current;
    if (wasHiddenRef.current || lateBy > 1000) {
      // 學生已回神拿起手機，不應該還繼續坐 → 走原本的 tap_to_end → 記錄頁流程
      awaitingShownAtRef.current = Date.now();
      setStep("tap_to_end");
      return;
    }

    // 全程前景：響鈴一次，UI 自動切到「超時計時」（remaining → overtime）。
    // 學生想結束時按「停止」按鈕。
    audioCtxRef.current?.resume().catch(() => {});
    ringBell();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(400);
    }
  }, []);

  // 使用者點「輕觸鳴鐘」覆蓋層 → 這次點擊就是 user gesture，可以播音了
  function confirmEndTap() {
    // 忽略前 600ms 的點擊，避開 iOS 通知 tap 被傳遞到剛揭曉的畫面
    if (Date.now() - awaitingShownAtRef.current < 600) return;
    audioCtxRef.current?.resume().catch(() => {});
    ringBell();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(400);
    }
    leaveLiveSitters();
    releaseWakeLock();
    // 這條路 = 學生鎖屏中時間到了，回來才點輕觸；我們不知道他實際坐了多久，
    // 紀錄就用原訂時間，不要把「離開 app 的時間」算進去
    setActualMin(selectedMin);
    setTimeout(() => setStep("card"), 4500);
  }

  function beginPrepare(min: number) {
    // 必須在 user gesture 內建 AudioContext，之後的鐘才能在 iOS 上發聲
    if (!audioCtxRef.current) audioCtxRef.current = createBellContext();
    // wakeLock 也在 user gesture 內請求：iOS Safari 比較會核准
    acquireWakeLock();
    prepareMinRef.current = min;
    setPrepareLeft(10);
    setStep("prepare");
  }

  // 點「開始靜心」進來這裡：判斷要不要先跳通知權限卡
  function tryStart(min: number) {
    // 把 selectedMin 同步成真實要計時的 min（OTHER 模式時 selectedMin 還停在隨機 preset，
    // 不同步的話結束記錄會抓錯時間）
    setSelectedMin(min);
    if (typeof window === "undefined") {
      beginPrepare(min);
      return;
    }
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    // iPadOS 13+ 報 Macintosh UA，要看 maxTouchPoints 才認得出 iPad
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const isStandalone =
      // @ts-expect-error iOS 自家屬性
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    const asked = localStorage.getItem("push-asked") === "1";
    const canAsk =
      supported &&
      (!isIOS || isStandalone) &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default" &&
      !asked;

    if (canAsk) {
      pendingMinRef.current = min;
      setPushPromptOpen(true);
    } else {
      beginPrepare(min);
    }
  }

  // 在卡片裡按「打開通知」：觸發 requestPermission + subscribe + 上傳訂閱
  async function enablePushFromPrompt() {
    setPushPromptBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          // VAPID public key (base64url) → ArrayBuffer
          const base64url = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
          const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
          const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
          const raw = atob(base64);
          const buf = new ArrayBuffer(raw.length);
          const view = new Uint8Array(buf);
          for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: buf,
          });
        }
        const json = sub.toJSON() as {
          endpoint?: string;
          keys?: { p256dh?: string; auth?: string };
        };
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          const { savePushSubscription } = await import("@/lib/actions/push");
          await savePushSubscription(
            { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
            navigator.userAgent
          );
        }
      }
    } catch {
      // 訂閱失敗也不擋使用者，繼續進靜坐
    } finally {
      localStorage.setItem("push-asked", "1");
      setPushPromptBusy(false);
      setPushPromptOpen(false);
      beginPrepare(pendingMinRef.current);
    }
  }

  function dismissPushPrompt() {
    if (typeof window !== "undefined") {
      localStorage.setItem("push-asked", "1");
    }
    setPushPromptOpen(false);
    beginPrepare(pendingMinRef.current);
  }

  // 倒數緩衝：5 → 0，到 0 時敲開始鐘、進入計時
  useEffect(() => {
    if (step !== "prepare") return;
    if (prepareLeft === 0) {
      startTimer(prepareMinRef.current);
      return;
    }
    const t = setTimeout(() => setPrepareLeft(n => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, prepareLeft]);

  function startTimer(min: number) {
    wasHiddenRef.current = false; // 新的 sit，重置背景旗標
    bellRangRef.current = false;  // 重置鈴響旗標
    setOvertime(0);               // 重置超時
    ringBell(); // 開始鐘（優先走 <audio>，繞過 iOS 靜音鍵）
    acquireWakeLock(); // 補保險（beginPrepare 已請求過一次，這裡確保仍生效）
    joinLiveSitters(); // 加入「正在靜坐的人」
    // 排「結束鈴」推播：iOS 螢幕鎖定 / 應用被殺時，這個負責喚醒
    scheduleSitEndPush(min)
      .then((r) => {
        if ("id" in r) pushJobRef.current = r.id;
      })
      .catch(() => {});
    const now = Date.now(); const start = new Date();
    setActualStart(start); setRemaining(min * 60);
    endTimeRef.current = now + min * 60 * 1000;
    setPaused(false); setStep("timer");
    intervalRef.current = setInterval(() => {
      const diffSec = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (diffSec > 0) {
        setRemaining(diffSec);
      } else {
        // 跨過 0 點：第一次到這裡時響鈴 + 進入超時計時
        setRemaining(0);
        setOvertime(-diffSec);
        if (!bellRangRef.current) handleTimerEnd();
      }
    }, 500);
  }

  function handlePause() {
    if (paused) { endTimeRef.current += Date.now() - pausedAtRef.current; setPaused(false); }
    else { pausedAtRef.current = Date.now(); setPaused(true); }
  }

  function handleEarlyEnd() {
    clearTimer();
    leaveLiveSitters();
    releaseWakeLock();
    // 提前結束 → 取消推播
    if (pushJobRef.current) {
      cancelPushJob(pushJobRef.current).catch(() => {});
      pushJobRef.current = null;
    }
    const elapsed = Math.floor((Date.now() - (actualStart?.getTime() ?? Date.now())) / 60000);
    // 鈴已響過 = 已坐滿原訂時間，學生主動按停止 → 直接記錄（含超時）
    if (bellRangRef.current) {
      setActualMin(elapsed);
      setStep("card");
      return;
    }
    // 鈴沒響過 = 真的提前結束，少於 3 分鐘退回 pick
    if (elapsed < 3) { setEarlyEnd(true); setTimeout(() => { setEarlyEnd(false); setStep("pick"); }, 2500); }
    else { setActualMin(elapsed); setStep("card"); }
  }

  useEffect(() => {
    if (paused) clearTimer();
    else if (step === "timer") {
      intervalRef.current = setInterval(() => {
        const diffSec = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (diffSec > 0) {
          setRemaining(diffSec);
        } else {
          setRemaining(0);
          setOvertime(-diffSec);
          if (!bellRangRef.current) handleTimerEnd();
        }
      }, 500);
    }
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  async function handleRecord(skip = false) {
    if (skip) { window.location.href = "/feed"; return; }
    setSubmitting(true);
    setRecordError("");
    const fd = new FormData();
    fd.set("duration_min", String(actualMin || selectedMin));
    fd.set("reflection", reflection);
    fd.set("sat_at", actualStart?.toISOString() ?? new Date().toISOString());
    // 卡片是選填的：使用者可以只留心得、只附卡、兩個都要、或兩個都不要
    if (todayCard && attachCard) fd.set("card_id", String(todayCard.id));
    // 成功時 recordSit 內部會 redirect("/feed")，不會走到下面。
    // 失敗時要把錯誤顯示出來，否則畫面會停在「SAVING...」什麼都不說。
    const res = await recordSit(fd);
    if (res?.error) {
      setRecordError(res.error);
      setSubmitting(false);
    }
  }

  // 進到 card step 就在背景抽卡。每次坐完都抽一張新的（同一天可以抽很多次）。
  // 這時 sit 還沒寫進 DB，額度算不到它，所以 skipSitCheck。
  useEffect(() => {
    if (step !== "card" || drawStartedRef.current) return;
    drawStartedRef.current = true;
    drawCard(true)
      .then((res) => {
        if (!res.ok) { setStep("record"); return; }
        setTodayCard(res.card);
      })
      .catch(() => setStep("record"));
  }, [step]);

  const mins = Number(customMin) || 0;

  // ── Step 1: 選時間 ──────────────────────────────
  // 卡背當主視覺、時間自己填。原本散落的隨機預設時間全部拿掉。
  if (step === "pick") {
    const minsOk = mins >= 1 && mins <= 240;
    return (
      <div className="max-w-md mx-auto px-4 min-h-[calc(100dvh-8rem)] flex flex-col items-center justify-center pb-8">
        {earlyEnd && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#1a1b18" }}>
            <p style={{ fontSize: "1rem", color: "rgba(237,236,234,0.4)", letterSpacing: "0.05em" }}>
              這次沒有記錄。下次再坐。
            </p>
          </div>
        )}

        {/* 卡片就是開始鍵：按下去就開始坐，坐完它才翻開。
            時間還沒填的時候不會沒反應，而是把游標帶到輸入框。 */}
        <button
          type="button"
          onClick={() => {
            if (minsOk) tryStart(mins);
            else minInputRef.current?.focus();
          }}
          aria-label={minsOk ? `開始靜坐 ${mins} 分鐘` : "先填上時間"}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            opacity: minsOk ? 1 : 0.4,
            transition: "opacity 0.25s, transform 0.15s",
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <CardBackMini width={148} breathe={minsOk} />
        </button>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            color: minsOk ? "rgba(190,194,63,0.7)" : "rgba(237,236,234,0.25)",
            marginTop: "1rem",
            transition: "color 0.25s",
          }}
        >
          {minsOk ? "按一下卡片，開始" : "坐完，翻開這張卡"}
        </p>

        <h1
          style={{
            fontFamily: "var(--font-noto-serif)",
            fontSize: "1.4rem",
            color: "#edecea",
            fontWeight: 400,
            marginTop: "2.75rem",
          }}
        >
          今天想坐多久？
        </h1>

        {/* 填空式輸入：只有一條底線，數字置中 */}
        <div className="flex items-baseline justify-center gap-2" style={{ marginTop: "1.25rem" }}>
          <input
            ref={minInputRef}
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && minsOk) tryStart(mins); }}
            placeholder="－－"
            style={{
              width: "4.5rem",
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${minsOk ? "rgba(190,194,63,0.6)" : "rgba(255,255,255,0.15)"}`,
              padding: "0.3rem 0",
              // ≥16px 否則 iOS Safari 點進去會自動放大且不會縮回
              fontSize: "1.75rem",
              fontFamily: "var(--font-space-mono)",
              color: "#edecea",
              textAlign: "center",
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
          <span style={{ fontSize: "0.85rem", color: "rgba(237,236,234,0.4)" }}>分鐘</span>
        </div>

        {pushPromptOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "rgba(26,27,24,0.92)" }}
          >
            <div
              style={{
                background: "#2c2c2a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "var(--r-card)",
                padding: "1.5rem 1.25rem",
                maxWidth: 360,
                width: "100%",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.2em",
                  color: "rgba(237,236,234,0.35)",
                  marginBottom: "0.75rem",
                }}
              >
                NOTIFICATIONS
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-noto-serif)",
                  fontSize: "1.15rem",
                  color: "#edecea",
                  fontWeight: 400,
                  marginBottom: "0.85rem",
                  letterSpacing: "0.04em",
                }}
              >
                螢幕鎖定時通知喚醒
              </h2>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "rgba(237,236,234,0.6)",
                  lineHeight: 1.7,
                  marginBottom: "1.25rem",
                }}
              >
                靜坐中如果你把螢幕關上，計時聲會被系統暫停。打開通知，時間到了會用一則安靜的訊息把你喚醒。
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={enablePushFromPrompt}
                  disabled={pushPromptBusy}
                  className="btn-primary w-full"
                  style={{ letterSpacing: "0.12em" }}
                >
                  {pushPromptBusy ? "..." : "好，打開通知"}
                </button>
                <button
                  onClick={dismissPushPrompt}
                  disabled={pushPromptBusy}
                  className="btn-ghost w-full"
                  style={{ letterSpacing: "0.1em" }}
                >
                  以後再說
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step 1.5: 倒數緩衝 ──────────────────────────
  if (step === "prepare") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#1a1b18" }}>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(237,236,234,0.3)", marginBottom: "3.5rem" }}>
          準備
        </p>

        {/* 呼吸圓點（與啟動動畫一致） */}
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#BEC23F",
            animation: "prepareBreathe 6s ease-in-out infinite",
          }}
        />

        <p
          style={{
            fontFamily: "var(--font-noto-serif)",
            fontSize: "0.95rem",
            color: "rgba(237,236,234,0.5)",
            marginTop: "3.5rem",
            letterSpacing: "0.08em",
          }}
        >
          調整姿勢，幾次呼吸
        </p>

        <button
          onClick={() => setStep("pick")}
          className="btn-ghost"
          style={{ letterSpacing: "0.12em", marginTop: "4rem" }}
        >
          CANCEL
        </button>

        <style>{`
          @keyframes prepareBreathe {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50%      { opacity: 1;    transform: scale(2.2); }
          }
        `}</style>
      </div>
    );
  }

  // ── Step 2.5: 從背景回來，時間到了 → 等使用者輕觸（user gesture 才能播音）──
  if (step === "tap_to_end") {
    return (
      <button
        onClick={confirmEndTap}
        className="min-h-screen w-full flex flex-col items-center justify-center"
        style={{ background: "#1a1b18", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#BEC23F",
            animation: "endTapBreathe 6s ease-in-out infinite",
            marginBottom: "3rem",
          }}
        />
        <p
          style={{
            fontFamily: "var(--font-noto-serif)",
            fontSize: "1.25rem",
            color: "#edecea",
            letterSpacing: "0.08em",
            marginBottom: "0.75rem",
          }}
        >
          時間到了
        </p>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            color: "rgba(237,236,234,0.4)",
          }}
        >
          TAP TO RING
        </p>
        <style>{`
          @keyframes endTapBreathe {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50%      { opacity: 1;   transform: scale(1.8); }
          }
        `}</style>
      </button>
    );
  }

  // ── Step 2: 計時中 ──────────────────────────────
  if (step === "timer") {
    const total = selectedMin * 60;
    const isOvertime = bellRangRef.current && overtime > 0;
    const progress = isOvertime ? 1 : (total > 0 ? (total - remaining) / total : 0);
    const displaySec = isOvertime ? overtime : remaining;
    const mm = String(Math.floor(displaySec / 60)).padStart(2, "0");
    const ss = String(displaySec % 60).padStart(2, "0");

    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#1a1b18" }}>
        <div className="relative mb-8">
          <svg width="220" height="220" className="rotate-[-90deg]">
            <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <circle cx="110" cy="110" r="100" fill="none"
              stroke="#BEC23F" strokeWidth="1"
              strokeDasharray={`${2 * Math.PI * 100}`}
              strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress)}`}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{
              fontFamily: "var(--font-space-mono)", fontSize: "3.5rem", fontWeight: 400,
              color: "#edecea", letterSpacing: "-0.02em",
              opacity: paused ? 0.4 : 1, transition: "opacity 0.3s",
            }}>
              {isOvertime ? "+" : ""}{mm}:{ss}
            </span>
          </div>
        </div>

        {/* 同坐提示：永遠 +1 個「不在場的同伴」，讓人一進來就感覺有人陪 */}
        <div
          className="flex items-center justify-center gap-2 mb-10"
          style={{ height: "1.2rem" }}
          aria-live="polite"
        >
          <span
            aria-hidden
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#BEC23F",
              animation: "companionsBreathe 6s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.62rem",
              letterSpacing: "0.18em",
              color: "rgba(237,236,234,0.5)",
            }}
          >
            此刻 {companions + 1} 人陪你坐
          </span>
        </div>

        <div className="flex gap-10">
          {!isOvertime && (
            <button onClick={handlePause} className="btn-ghost" style={{ letterSpacing: "0.12em" }}>
              {paused ? "RESUME" : "PAUSE"}
            </button>
          )}
          <button onClick={handleEarlyEnd} className="btn-ghost" style={{ letterSpacing: "0.12em" }}>
            {isOvertime ? "停止 · STOP" : "END"}
          </button>
        </div>

        <style>{`
          @keyframes companionsBreathe {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50%      { opacity: 1;   transform: scale(1.5); }
          }
        `}</style>
      </div>
    );
  }

  // ── Step 2.5: 抽今天的卡 ───────────────────────
  if (step === "card") {
    return (
      <div className="max-w-md mx-auto px-4 min-h-[calc(100dvh-8rem)] flex flex-col items-center justify-center gap-8">
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.25em", color: "rgba(237,236,234,0.25)" }}>
          TODAY&apos;S CARD
        </p>

        <CardFlip
          card={todayCard}
          disabled={!todayCard}
          onFlip={() => setTimeout(() => setCardRevealed(true), 900)}
        />

        {cardRevealed && (
          <button
            onClick={() => setStep("record")}
            className="btn-primary"
            style={{ letterSpacing: "0.12em", minWidth: 180, animation: "cardFadeUp 0.6s ease-out both" }}
          >
            繼續
          </button>
        )}

        <style>{`
          @keyframes cardFadeUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ── Step 3: 記錄 ──────────────────────────────
  if (step === "record") {
    const displayMin = actualMin || selectedMin;
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.2)", marginBottom: "1rem" }}>
          SESSION COMPLETE
        </p>
        <p style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.5rem", color: "#edecea", marginBottom: "2rem", fontWeight: 400 }}>
          你坐了 <span style={{ color: "#BEC23F", fontFamily: "var(--font-space-mono)" }}>{displayMin}</span> 分鐘。
        </p>
        <div className="space-y-3">
          <textarea value={reflection}
            onChange={e => setReflection(e.target.value.slice(0, 140))}
            placeholder="想說點什麼？" rows={3}
            className="reflection-text"
            style={{ ...inputStyle, resize: "none", lineHeight: 1.7 }}
            onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />
          {reflection.length > 120 && (
            <p className="text-right" style={{ fontSize: "0.7rem", fontFamily: "var(--font-space-mono)", color: reflection.length >= 140 ? "#D65C6A" : "rgba(237,236,234,0.2)" }}>
              {reflection.length >= 140 ? "再短一點。" : `${140 - reflection.length}`}
            </p>
          )}

          {/* 今天的卡：要不要一起貼上去，使用者自己決定 */}
          {todayCard && (
            <div style={{ paddingTop: "0.25rem" }}>
              <div style={{ opacity: attachCard ? 1 : 0.35, transition: "opacity 0.2s" }}>
                <CardFace card={todayCard} compact />
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  marginTop: "0.7rem",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 18, height: 18, flexShrink: 0,
                    border: `1.5px solid ${attachCard ? "#BEC23F" : "rgba(255,255,255,0.2)"}`,
                    background: attachCard ? "#BEC23F" : "transparent",
                    borderRadius: 3,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#1a1b18", fontSize: "0.75rem", fontWeight: 700, lineHeight: 1,
                    transition: "all 0.15s",
                  }}
                >
                  {attachCard ? "✓" : ""}
                </span>
                <input
                  type="checkbox"
                  checked={attachCard}
                  onChange={(e) => setAttachCard(e.target.checked)}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
                <span style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.6)" }}>
                  一起附上今天的卡
                </span>
              </label>
            </div>
          )}

          {recordError && (
            <p style={{ fontSize: "0.78rem", color: "#D65C6A", lineHeight: 1.6 }}>
              {recordError}
            </p>
          )}
          <button onClick={() => handleRecord(false)} disabled={submitting}
            className="btn-primary w-full" style={{ letterSpacing: "0.12em" }}>
            {submitting ? "SAVING..." : "記錄"}
          </button>
          <button onClick={() => handleRecord(true)} className="btn-ghost w-full" style={{ letterSpacing: "0.1em" }}>
            不記錄
          </button>
        </div>
      </div>
    );
  }

  return null;
}
