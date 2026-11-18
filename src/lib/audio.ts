import { focusSoundscapePlayer, SoundscapeTrackId } from './soundscapeService';

export type SoundType = 'click' | 'accomplishment' | 'bell' | 'start' | 'pause' | 'tick';

let audioEnabled = true;
let vibrationEnabled = true;

export const setAudioPreferences = (prefs: { sound?: boolean; vibration?: boolean }) => {
  if (typeof prefs.sound === 'boolean') {
    audioEnabled = prefs.sound;
  }
  if (typeof prefs.vibration === 'boolean') {
    vibrationEnabled = prefs.vibration;
  }
};

export const triggerVibration = (pattern: number | number[] = 20) => {
  if (!vibrationEnabled) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore vibration API errors
  }
};

export const playSound = (type: SoundType) => {
  if (type === 'accomplishment' || type === 'bell') {
    triggerVibration([25, 40, 25]);
  } else if (type === 'start' || type === 'pause') {
    triggerVibration(15);
  }

  if (!audioEnabled) return;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const ctx = new AudioContextClass();

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(329.63, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'pause') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(392.00, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'bell' || type === 'accomplishment') {
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 1.2);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 1.2);
      });
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    }
  } catch {
    // Ignore browser autoplay audio restrictions
  }
};

export type AmbientSoundType = SoundscapeTrackId;

export const focusAudio = {
  setVolume: (vol: number) => focusSoundscapePlayer.setVolume(vol),
  stop: () => focusSoundscapePlayer.stop(),
  play: (type: AmbientSoundType) => focusSoundscapePlayer.selectTrack(type, true),
  getCurrentType: (): AmbientSoundType => focusSoundscapePlayer.getState().currentTrackId,
};
