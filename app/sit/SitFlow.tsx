"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { recordSit } from "@/lib/actions/sits";
import { scheduleSitEndPush, cancelPushJob } from "@/lib/actions/push";
import { playBell, createBellContext, renderBellWavUrl } from "@/components/BellSound";
import { createClient as createSupabase } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { taipeiDatetimeLocal } from "@/lib/tz";

type Step = "pick" | "prepare" | "timer" | "tap_to_end" | "record" | "manual";
const PRESETS = [6, 12, 18, 24, 36, 60];

const inputStyle = {
  width: "100%", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#edecea", outline: "none",
  borderRadius: 4,
};

export default function SitFlow() {
  const [step, setStep] = useState<Step>("pick");
  const [selectedMin, setSelectedMin] = useState(18);
  const [customMin, setCustomMin] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [actualStart, setActualStart] = useState<Date | null>(null);
  const [actualMin, setActualMin] = useState(0);
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
  // 第一次按「開始靜心」前要不要先問通知權限
  const [pushPromptOpen, setPushPromptOpen] = useState(false);
  const [pushPromptBusy, setPushPromptBusy] = useState(false);
  const pendingMinRef = useRef(0);

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
    ensureBellPreloaded();
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
        // 螢幕鎖定 / 切到背景：主動把進行中的鈴聲暫停 + AudioContext suspend，
        // 避免 iOS 直接中斷音訊 session 而發出系統「逼」聲。
        if (step === "timer") wasHiddenRef.current = true;
        const a = activeBellAudioRef.current;
        if (a) {
          // 先把 volume 拉到 0 再 pause：避免直接 pause 在某些情境下出現 click
          try { a.volume = 0; } catch {}
          try { a.pause(); } catch {}
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
        handleTimerEnd(actualStart, selectedMin);
      } else {
        acquireWakeLock();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paused, actualStart, selectedMin]);
  const [reflection, setReflection] = useState("");
  const [satAt, setSatAt] = useState("");
  const [manualMin, setManualMin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [earlyEnd, setEarlyEnd] = useState(false);
  const [prepareLeft, setPrepareLeft] = useState(5);
  const prepareMinRef = useRef(0);
  const [companions, setCompanions] = useState(0); // 此刻除自己外的同坐人數

  function clearTimer() { if (intervalRef.current) clearInterval(intervalRef.current); }

  // 從 ?duration= 預填時長（給「同心」邀坐用），有值就自動進入 prepare
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

  const handleTimerEnd = useCallback((started: Date, durationMin: number) => {
    clearTimer();
    // 前景自然結束 → 取消推播 job，避免重複響
    if (pushJobRef.current) {
      cancelPushJob(pushJobRef.current).catch(() => {});
      pushJobRef.current = null;
    }
    setActualMin(durationMin);
    // 判斷是不是「從背景回來」：若 handleTimerEnd 被呼叫時，時間已超過 endTime 超過 1 秒，
    // 代表 iOS 凍結 JS 之後才解凍處理，過了 gesture window，自動 play 一定被擋。
    // 用時間差比 wasHiddenRef 更可靠（iOS 螢幕鎖定時 visibility hidden 事件可能根本沒跑到）。
    const lateBy = Date.now() - endTimeRef.current;
    if (wasHiddenRef.current || lateBy > 1000) {
      awaitingShownAtRef.current = Date.now();
      // 用獨立 step 而不是疊加 flag，避免任何殘留 setTimeout 干擾
      setStep("tap_to_end");
      return;
    }
    // 全程前景：照常響鈴 + 進記錄頁
    audioCtxRef.current?.resume().catch(() => {});
    ringBell();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(400);
    }
    leaveLiveSitters();
    releaseWakeLock();
    setTimeout(() => setStep("record"), 4500);
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
    setTimeout(() => setStep("record"), 4500);
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
    if (typeof window === "undefined") {
      beginPrepare(min);
      return;
    }
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
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
      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) handleTimerEnd(start, min);
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
    if (elapsed < 3) { setEarlyEnd(true); setTimeout(() => { setEarlyEnd(false); setStep("pick"); }, 2500); }
    else { setActualMin(elapsed); setStep("record"); }
  }

  useEffect(() => {
    if (paused) clearTimer();
    else if (step === "timer") {
      intervalRef.current = setInterval(() => {
        const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setRemaining(left);
        if (left === 0 && actualStart) handleTimerEnd(actualStart, selectedMin);
      }, 500);
    }
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  async function handleRecord(skip = false) {
    if (skip) { window.location.href = "/feed"; return; }
    setSubmitting(true);
    const fd = new FormData();
    const isManual = step === "manual";
    fd.set("duration_min", isManual ? manualMin : String(actualMin || selectedMin));
    fd.set("reflection", reflection);
    // 手動輸入的 satAt 是台北牆上時間（YYYY-MM-DDTHH:mm），用 +08:00 解析後送 UTC ISO
    const manualISO = isManual && satAt ? new Date(`${satAt}:00+08:00`).toISOString() : null;
    fd.set("sat_at", manualISO ?? actualStart?.toISOString() ?? new Date().toISOString());
    await recordSit(fd);
  }

  const mins = showCustom ? Number(customMin) || 0 : selectedMin;

  // ── Step 1: 選時間 ──────────────────────────────
  if (step === "pick") {
    return (
      <div className="max-w-md mx-auto px-4 min-h-[calc(100dvh-8rem)] flex flex-col justify-center pb-8">
        {earlyEnd && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#1a1b18" }}>
            <p style={{ fontSize: "1rem", color: "rgba(237,236,234,0.4)", letterSpacing: "0.05em" }}>
              這次沒有記錄。下次再坐。
            </p>
          </div>
        )}

        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.2)", marginBottom: "1.5rem" }}>
          SELECT DURATION
        </p>
        <h1 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.5rem", color: "#edecea", marginBottom: "2rem", fontWeight: 400 }}>
          今天想坐多久？
        </h1>

        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
          {PRESETS.map(m => (
            <button key={m} onClick={() => { setSelectedMin(m); setShowCustom(false); }}
              style={{
                padding: "0.75rem 0",
                fontSize: "0.875rem",
                fontFamily: "var(--font-space-mono)",
                background: (!showCustom && selectedMin === m) ? "#BEC23F" : "#2c2c2a",
                color: (!showCustom && selectedMin === m) ? "#1a1b18" : "rgba(237,236,234,0.5)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                borderRadius: 4,
              }}>
              {m}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCustom(true)}
          style={{
            width: "100%",
            padding: "0.75rem 0", fontSize: "0.75rem",
            fontFamily: "var(--font-space-mono)",
            background: showCustom ? "#BEC23F" : "#2c2c2a",
            color: showCustom ? "#1a1b18" : "rgba(237,236,234,0.3)",
            border: "none", cursor: "pointer", transition: "all 0.15s",
            letterSpacing: "0.05em",
            borderRadius: 4,
            marginBottom: "0.75rem",
          }}>
          OTHER
        </button>

        {showCustom && (
          <input type="number" min={1} max={240} value={customMin}
            onChange={e => setCustomMin(e.target.value)}
            placeholder="1 – 240 分鐘" autoFocus
            style={{ ...inputStyle, marginBottom: "1.5rem" }}
            onFocus={e => e.target.style.borderColor = "#BEC23F"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />
        )}

        <div className="mt-8 space-y-4">
          <button onClick={() => { if (mins >= 1 && mins <= 240) tryStart(mins); }}
            disabled={mins < 1 || mins > 240}
            className="btn-primary w-full" style={{ letterSpacing: "0.12em" }}>
            開始靜心
          </button>
          <button onClick={() => { setStep("manual"); setSatAt(taipeiDatetimeLocal()); setManualMin(String(mins || 20)); }}
            className="btn-ghost w-full" style={{ letterSpacing: "0.1em" }}>
            我已經坐完了 →
          </button>
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
            animation: "prepareBreathe 4s ease-in-out infinite",
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
            animation: "endTapBreathe 2.4s ease-in-out infinite",
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
    const progress = total > 0 ? (total - remaining) / total : 0;
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");

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
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{
              fontFamily: "var(--font-space-mono)", fontSize: "3.5rem", fontWeight: 400,
              color: "#edecea", letterSpacing: "-0.02em",
              opacity: paused ? 0.4 : 1, transition: "opacity 0.3s",
            }}>
              {mm}:{ss}
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
              animation: "companionsBreathe 2.4s ease-in-out infinite",
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
          <button onClick={handlePause} className="btn-ghost" style={{ letterSpacing: "0.12em" }}>
            {paused ? "RESUME" : "PAUSE"}
          </button>
          <button onClick={handleEarlyEnd} className="btn-ghost" style={{ letterSpacing: "0.12em" }}>
            END
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
            placeholder="像一句呼吸就好" rows={3}
            className="reflection-text"
            style={{ ...inputStyle, resize: "none", lineHeight: 1.7 }}
            onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />
          {reflection.length > 120 && (
            <p className="text-right" style={{ fontSize: "0.7rem", fontFamily: "var(--font-space-mono)", color: reflection.length >= 140 ? "#D65C6A" : "rgba(237,236,234,0.2)" }}>
              {reflection.length >= 140 ? "短一點，像一句呼吸就好。" : `${140 - reflection.length}`}
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

  // ── 手動補記 ──────────────────────────────
  if (step === "manual") {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <button onClick={() => setStep("pick")} className="btn-ghost mb-6" style={{ letterSpacing: "0.1em" }}>← BACK</button>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.2)", marginBottom: "1rem" }}>MANUAL ENTRY</p>
        <h1 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "1.5rem", color: "#edecea", marginBottom: "2rem", fontWeight: 400 }}>記錄這次靜心</h1>
        <div className="space-y-3">
          <div>
            <label className="seq-label block mb-1.5">DURATION (MIN)</label>
            <input type="number" min={1} max={240} value={manualMin} onChange={e => setManualMin(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#BEC23F"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
          </div>
          <div>
            <label className="seq-label block mb-1.5">START TIME</label>
            <input type="datetime-local" value={satAt} onChange={e => setSatAt(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }}
              onFocus={e => e.target.style.borderColor = "#BEC23F"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
          </div>
          <div>
            <label className="seq-label block mb-1.5">NOTE (OPTIONAL)</label>
            <textarea value={reflection} onChange={e => setReflection(e.target.value.slice(0, 140))}
              placeholder="像一句呼吸就好" rows={3} className="reflection-text"
              style={{ ...inputStyle, resize: "none", lineHeight: 1.7 }}
              onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
          </div>
          <button onClick={() => handleRecord(false)} disabled={submitting || !manualMin}
            className="btn-primary w-full" style={{ letterSpacing: "0.12em" }}>
            {submitting ? "SAVING..." : "記錄"}
          </button>
          <button onClick={() => handleRecord(true)} className="btn-ghost w-full" style={{ letterSpacing: "0.1em" }}>不記錄</button>
        </div>
      </div>
    );
  }

  return null;
}
