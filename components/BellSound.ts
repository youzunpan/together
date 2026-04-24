// 缽鐘音效。AudioContext 必須在 user gesture 內建立（iOS 限制），
// 因此由呼叫端持有 ctx，每次鐘都重用同一個。

type Ctx = AudioContext;

export function createBellContext(): Ctx | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    // 有些瀏覽器初始 state 是 "suspended"，立刻 resume 解鎖
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

export function playBell(ctx: Ctx | null) {
  if (!ctx) return;
  try {
    // 有可能在背景被 suspend，呼叫時再 resume 一次
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const convolver = ctx.createConvolver();

    const rate = ctx.sampleRate;
    const length = rate * 1.5;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    convolver.buffer = impulse;

    osc.connect(gain);
    gain.connect(convolver);
    convolver.connect(ctx.destination);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.5);
  } catch {
    // 音頻不可用時靜默失敗
  }
}
