/**
 * Plays a synthesized water bubble/gulp sound using the Web Audio API.
 * This is 100% client-side, zero-dependency, works offline, and is highly PWA-compatible.
 */
export function playWaterGulpSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Helper to synthesize a single water droplet / bubble "bloop"
    const playBubble = (
      startTime: number,
      startFreq: number,
      endFreq: number,
      duration: number,
      volume: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";

      // Frequency sweep (sweeping upward creates a bubble pop sound)
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration * 0.85);

      // Volume envelope: fast attack, exponential decay
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    };

    // Two soft bubbles, kept quiet so quick-add never feels noisy.
    playBubble(now, 150, 420, 0.11, 0.08);
    playBubble(now + 0.07, 180, 520, 0.14, 0.065);

    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 420);
  } catch (error) {
    console.warn("Failed to play synthesized audio:", error);
  }
}
