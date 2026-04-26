// 大型銅缽聲：低基頻 + 多非整數倍泛音 + 長尾殘響。
// AudioContext 必須在 user gesture 內建立（iOS 限制），由呼叫端持有並重用。
//
// 兩種播放路徑：
// 1. playBell(ctx)：即時 Web Audio 合成。在 iOS 上會被靜音鍵擋、鎖屏後 suspend。
// 2. renderBellWavBlob() + HTMLAudioElement：先用 OfflineAudioContext 合成成 WAV，
//    再透過 <audio> 播。iOS 視為媒體播放，靜音鍵 + 鎖屏皆可繞過（搭配 NoSleep）。

type Ctx = AudioContext;
type OfflineCtx = OfflineAudioContext;

export function createBellContext(): Ctx | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

// 大 Tibetan / Himalayan singing bowl 的泛音結構（非整數倍，每個 partial 衰減不同）
// 用實測大缽的 partial ratio 近似
const PARTIALS: { ratio: number; gain: number; decay: number; detune: number }[] = [
  { ratio: 1.0,  gain: 0.55, decay: 8.0, detune: 0   },   // 基頻（最粗的嗡嗡聲）
  { ratio: 2.76, gain: 0.35, decay: 6.0, detune: 3   },   // 第一泛音
  { ratio: 5.40, gain: 0.18, decay: 4.5, detune: -4  },   // 第二泛音
  { ratio: 8.93, gain: 0.10, decay: 3.0, detune: 5   },   // 高亮泛音
  { ratio: 13.3, gain: 0.05, decay: 2.0, detune: -6  },   // 擦邊時的極高頻
];

const FUNDAMENTAL = 196; // G3，約等於較大缽的基頻

export function playBell(ctx: Ctx | null) {
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const t0 = ctx.currentTime;

    // 共用長尾殘響
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = rate * 4; // 4 秒 impulse，長尾
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        // 衰減噪音 + 輕微調製，讓殘響有空間感
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 1.8);
      }
    }
    convolver.buffer = impulse;

    // 殘響後的總音量
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.55;
    convolver.connect(wetGain);
    wetGain.connect(ctx.destination);

    // 主出去（直達聲）
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.9;
    dryGain.connect(ctx.destination);

    // 一個非常輕微的低通，讓聲音不要刺耳
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 4500;
    lowpass.Q.value = 0.4;
    lowpass.connect(dryGain);
    lowpass.connect(convolver);

    // 攻擊噪音：模擬棒頭接觸的「擦」聲
    const noiseBuf = ctx.createBuffer(1, rate * 0.15, rate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseData.length, 3);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    const noiseBp = ctx.createBiquadFilter();
    noiseBp.type = "bandpass";
    noiseBp.frequency.value = 2200;
    noiseBp.Q.value = 0.8;
    noise.connect(noiseBp);
    noiseBp.connect(noiseGain);
    noiseGain.connect(lowpass);
    noise.start(t0);

    // 敲擊後每個 partial 的振盪器
    PARTIALS.forEach(({ ratio, gain, decay, detune }) => {
      const freq = FUNDAMENTAL * ratio;

      // 每個 partial 用兩個略微失諧的正弦疊起，製造 beating / 顫動感
      [0, 1].forEach((i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t0);
        // 非常緩慢的下滑，模擬金屬應力釋放
        osc.frequency.exponentialRampToValueAtTime(freq * 0.995, t0 + decay);
        osc.detune.value = detune + (i === 0 ? -1.5 : 1.5);

        const g = ctx.createGain();
        // 攻擊瞬間快速上升、再長長衰減
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gain / 2, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);

        osc.connect(g);
        g.connect(lowpass);

        osc.start(t0);
        osc.stop(t0 + decay + 0.1);
      });
    });
  } catch {
    // 音頻不可用時靜默失敗
  }
}

// ── 離線合成成 WAV blob，給 HTMLAudioElement 用（繞過 iOS 靜音鍵 + 鎖屏限制） ──

function buildBellOnContext(ctx: Ctx | OfflineCtx, t0: number) {
  // 殘響
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * 4);
  const convolver = ctx.createConvolver();
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 1.8);
    }
  }
  convolver.buffer = impulse;

  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.55;
  convolver.connect(wetGain);
  wetGain.connect(ctx.destination);

  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.9;
  dryGain.connect(ctx.destination);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 4500;
  lowpass.Q.value = 0.4;
  lowpass.connect(dryGain);
  lowpass.connect(convolver);

  // 攻擊噪音
  const noiseBuf = ctx.createBuffer(1, Math.floor(rate * 0.15), rate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseData.length, 3);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.08, t0);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
  const noiseBp = ctx.createBiquadFilter();
  noiseBp.type = "bandpass";
  noiseBp.frequency.value = 2200;
  noiseBp.Q.value = 0.8;
  noise.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(lowpass);
  noise.start(t0);

  // Partials
  PARTIALS.forEach(({ ratio, gain, decay, detune }) => {
    const freq = FUNDAMENTAL * ratio;
    [0, 1].forEach((i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.995, t0 + decay);
      osc.detune.value = detune + (i === 0 ? -1.5 : 1.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain / 2, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
      osc.connect(g);
      g.connect(lowpass);
      osc.start(t0);
      osc.stop(t0 + decay + 0.1);
    });
  });
}

// AudioBuffer → 16-bit PCM WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;

  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);

  function writeStr(off: number, s: string) {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  }

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buf], { type: "audio/wav" });
}

// 把銅缽聲離線合成一份固定的 WAV，回傳 object URL。呼叫一次即可，cache 起來重用。
export async function renderBellWavUrl(): Promise<string | null> {
  try {
    const OfflineCtor =
      (typeof window !== "undefined" && window.OfflineAudioContext) ||
      ((typeof window !== "undefined" && (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext) as typeof OfflineAudioContext | undefined);
    if (!OfflineCtor) return null;
    const sampleRate = 44100;
    // 4 秒：保留主體 + 短尾韻，避免使用者一鎖屏鈴聲還沒播完，
    // iOS 中斷音訊 session 而觸發系統「逼」聲。
    const duration = 4;
    const offline = new OfflineCtor(2, Math.floor(sampleRate * duration), sampleRate);
    buildBellOnContext(offline, 0);
    const rendered = await offline.startRendering();
    const blob = audioBufferToWavBlob(rendered);
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
