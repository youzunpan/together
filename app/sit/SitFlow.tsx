"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { recordSit } from "@/lib/actions/sits";
import { playBell, createBellContext } from "@/components/BellSound";
import { createClient as createSupabase } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { taipeiDatetimeLocal } from "@/lib/tz";
import NoSleep from "nosleep.js";

type Step = "pick" | "prepare" | "timer" | "record" | "manual";
const PRESETS = [5, 10, 15, 20, 30, 45, 60];

const inputStyle = {
  width: "100%", background: "#2c2c2a", border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#edecea", outline: "none",
  borderRadius: 4,
};

export default function SitFlow() {
  const [step, setStep] = useState<Step>("pick");
  const [selectedMin, setSelectedMin] = useState(20);
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
  const noSleepRef = useRef<NoSleep | null>(null);
  const presenceRef = useRef<RealtimeChannel | null>(null);

  // 雙保險防鎖屏 / 防靜音：
  // 1. Screen Wake Lock：標準 API，避免螢幕熄屏
  // 2. NoSleep.js：背景播放極短靜音 loop，保住 audio session 活著，
  //    即使 iOS 鎖屏，結束鐘仍能從喇叭響出來
  async function acquireWakeLock() {
    try {
      if (navigator.wakeLock && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current?.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      }
    } catch {}
    // NoSleep 必須在 user gesture 內 enable，否則 iOS 會擋
    try {
      if (!noSleepRef.current) noSleepRef.current = new NoSleep();
      await noSleepRef.current.enable();
    } catch {}
  }
  function releaseWakeLock() {
    try {
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    } catch {}
    try {
      noSleepRef.current?.disable();
    } catch {}
  }
  // 從背景回前景時，若 wakeLock 已被釋放且還在計時，自動重拿
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && step === "timer" && !paused) {
        acquireWakeLock();
        // 順便嘗試 resume AudioContext（被背景 suspend 的話）
        audioCtxRef.current?.resume().catch(() => {});
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paused]);
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
    // 結束鐘：敲 3 下，間隔 5 秒，每聲自然漸弱（缽聲本身的長尾衰減）
    audioCtxRef.current?.resume().catch(() => {});
    const ringOnce = () => {
      audioCtxRef.current?.resume().catch(() => {});
      playBell(audioCtxRef.current);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(400);
      }
    };
    ringOnce();
    setTimeout(ringOnce, 5000);
    setTimeout(ringOnce, 10000);
    setActualMin(durationMin);
    leaveLiveSitters();
    releaseWakeLock();
    // 三聲打完再進記錄頁（10s + 約 4s 尾音）
    setTimeout(() => setStep("record"), 14000);
  }, []);

  function beginPrepare(min: number) {
    // 必須在 user gesture 內建 AudioContext，之後的鐘才能在 iOS 上發聲
    if (!audioCtxRef.current) audioCtxRef.current = createBellContext();
    // wakeLock 也在 user gesture 內請求：iOS Safari 比較會核准
    acquireWakeLock();
    prepareMinRef.current = min;
    setPrepareLeft(10);
    setStep("prepare");
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
    playBell(audioCtxRef.current); // 開始鐘
    acquireWakeLock(); // 補保險（beginPrepare 已請求過一次，這裡確保仍生效）
    joinLiveSitters(); // 加入「正在靜坐的人」
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
      <div className="max-w-md mx-auto px-4 py-10">
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

        <div className="grid grid-cols-4 gap-1.5 mb-3">
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
          <button onClick={() => setShowCustom(true)}
            style={{
              padding: "0.75rem 0", fontSize: "0.75rem",
              fontFamily: "var(--font-space-mono)",
              background: showCustom ? "#BEC23F" : "#2c2c2a",
              color: showCustom ? "#1a1b18" : "rgba(237,236,234,0.3)",
              border: "none", cursor: "pointer", transition: "all 0.15s",
              letterSpacing: "0.05em",
              borderRadius: 4,
            }}>
            OTHER
          </button>
        </div>

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
          <button onClick={() => { if (mins >= 1 && mins <= 240) beginPrepare(mins); }}
            disabled={mins < 1 || mins > 240}
            className="btn-primary w-full" style={{ letterSpacing: "0.12em" }}>
            開始靜心
          </button>
          <button onClick={() => { setStep("manual"); setSatAt(taipeiDatetimeLocal()); setManualMin(String(mins || 20)); }}
            className="btn-ghost w-full" style={{ letterSpacing: "0.1em" }}>
            我已經坐完了 →
          </button>
        </div>
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
