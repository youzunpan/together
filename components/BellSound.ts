export function playBell() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const convolver = ctx.createConvolver();

    // 簡單 reverb：用白噪音 impulse
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
    osc.frequency.setValueAtTime(528, ctx.currentTime);       // 缽鐘基頻
    osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.5);

    osc.onended = () => ctx.close();
  } catch {
    // 音頻不可用時靜默失敗
  }
}
