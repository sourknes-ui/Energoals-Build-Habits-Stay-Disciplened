/**
 * Deep Focus Soundscape & Music Player Service
 * Handles:
 *  - Central single-instance HTML5 Audio controller (no duplicate playback)
 *  - Play, Pause, Resume, Stop, Volume, and Mute
 *  - Real audio asset integration for all 5 soundscapes + Silence
 *  - Cache API & IndexedDB offline download & offline playback
 *  - Download progress tracking, error handling, and offline verification
 */

export type SoundscapeTrackId = 
  | 'off'
  | 'binaural'
  | 'pink_noise'
  | 'brown_noise'
  | 'zen_drone'
  | 'rain_synth';

export interface SoundscapeTrack {
  id: SoundscapeTrackId;
  label: string;
  desc: string;
  url: string;
  sizeLabel: string;
  badge: string;
  frequency: string;
  benefit: string;
}

export const SOUNDSCAPE_TRACKS: SoundscapeTrack[] = [
  {
    id: 'off',
    label: 'Silence',
    desc: 'No background audio',
    url: '',
    sizeLabel: '0 KB',
    badge: 'Mute',
    frequency: '0 Hz',
    benefit: 'Zero acoustic stimulation for pure silent focus',
  },
  {
    id: 'binaural',
    label: '10Hz Alpha Waves',
    desc: 'Neural focus binaural beat',
    url: '/audio/alpha_waves.mp3',
    sizeLabel: '1.0 MB',
    badge: '10 Hz',
    frequency: 'Alpha Band (8-12Hz)',
    benefit: 'Synchronizes left/right hemispheres for deep cognition',
  },
  {
    id: 'pink_noise',
    label: 'Pink Noise',
    desc: 'Balanced cognitive sound',
    url: '/audio/pink_noise.mp3',
    sizeLabel: '1.0 MB',
    badge: '1/f Noise',
    frequency: 'Pink Spectrum',
    benefit: 'Equal energy per octave; masks distracting speech',
  },
  {
    id: 'brown_noise',
    label: 'Deep Brown Noise',
    desc: 'Low-frequency rumble for deep flow',
    url: '/audio/brown_noise.mp3',
    sizeLabel: '1.0 MB',
    badge: '1/f² Rumble',
    frequency: 'Deep Sub-Bass',
    benefit: 'Warm subterranean resonance for hyperfocus & calm',
  },
  {
    id: 'zen_drone',
    label: 'Zen Meditation',
    desc: 'Harmonic Tibetan resonance',
    url: '/audio/zen_meditation.mp3',
    sizeLabel: '1.0 MB',
    badge: '432 Hz',
    frequency: 'Harmonic Series',
    benefit: 'Overtone singing bowls for grounding mindfulness',
  },
  {
    id: 'rain_synth',
    label: 'Ambient Rainfall',
    desc: 'Gentle atmospheric rainfall',
    url: '/audio/ambient_rainfall.mp3',
    sizeLabel: '1.0 MB',
    badge: 'Acoustic',
    frequency: 'Broadband Nature',
    benefit: 'Natural stochastic rhythm lowers cortisol levels',
  },
];

const CACHE_NAME = 'energoals-soundscapes-v1';
const IDB_DB_NAME = 'energoals_audio_cache';
const IDB_STORE_NAME = 'soundscape_blobs';

// Helper to open IndexedDB fallback if Cache API is unavailable
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Offline Cache Manager
 */
export class SoundscapeCacheManager {
  private downloadedCache: Map<string, boolean> = new Map();

  constructor() {
    this.refreshAllStatus();
  }

  public async isTrackDownloaded(url: string): Promise<boolean> {
    if (!url) return false;
    if (this.downloadedCache.has(url)) {
      return this.downloadedCache.get(url)!;
    }

    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(url);
        if (match) {
          this.downloadedCache.set(url, true);
          return true;
        }
      }
    } catch {}

    // Fallback check in IndexedDB
    try {
      const db = await openIDB();
      const hasItem = await new Promise<boolean>((resolve) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.get(url);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      });
      if (hasItem) {
        this.downloadedCache.set(url, true);
        return true;
      }
    } catch {}

    this.downloadedCache.set(url, false);
    return false;
  }

  public async refreshAllStatus(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const track of SOUNDSCAPE_TRACKS) {
      if (track.url) {
        const status = await this.isTrackDownloaded(track.url);
        results[track.id] = status;
      }
    }
    return results;
  }

  public async downloadTrack(
    track: SoundscapeTrack,
    onProgress?: (percent: number) => void
  ): Promise<boolean> {
    if (!track.url) return false;

    // Check if already downloaded to avoid duplicate copies
    const alreadyDownloaded = await this.isTrackDownloaded(track.url);
    if (alreadyDownloaded) {
      if (onProgress) onProgress(100);
      return true;
    }

    try {
      if (onProgress) onProgress(5);

      const response = await fetch(track.url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to fetch audio track (${response.status})`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 1081513;

      let loadedBytes = 0;
      let blob: Blob;

      if (response.body && typeof ReadableStream !== 'undefined') {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loadedBytes += value.length;
            if (onProgress) {
              const pct = Math.min(95, Math.round((loadedBytes / totalBytes) * 90) + 5);
              onProgress(pct);
            }
          }
        }
        blob = new Blob(chunks, { type: 'audio/mpeg' });
      } else {
        blob = await response.blob();
      }

      if (onProgress) onProgress(98);

      // Store in Cache API
      let storedInCache = false;
      if ('caches' in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const responseToCache = new Response(blob, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': blob.size.toString(),
            },
          });
          await cache.put(track.url, responseToCache);
          storedInCache = true;
        } catch (err) {
          console.warn('Cache API put failed, trying IndexedDB:', err);
        }
      }

      // If Cache API not used or failed, store in IndexedDB
      if (!storedInCache) {
        try {
          const db = await openIDB();
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(IDB_STORE_NAME);
            const req = store.put(blob, track.url);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        } catch (idbErr) {
          console.error('IndexedDB audio storage failed:', idbErr);
          throw new Error('Failed to save audio to local storage');
        }
      }

      this.downloadedCache.set(track.url, true);
      if (onProgress) onProgress(100);
      return true;
    } catch (err) {
      console.error('Download soundscape error:', err);
      throw err;
    }
  }

  public async getPlayableSource(url: string): Promise<string> {
    if (!url) return '';

    // Check Cache API
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(url);
        if (match) {
          const blob = await match.blob();
          return URL.createObjectURL(blob);
        }
      } catch {}
    }

    // Check IndexedDB
    try {
      const db = await openIDB();
      const blob = await new Promise<Blob | null>((resolve) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.get(url);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (blob) {
        return URL.createObjectURL(blob);
      }
    } catch {}

    // Fallback to direct network URL
    return url;
  }
}

export const soundscapeCache = new SoundscapeCacheManager();

export interface SoundscapePlayerState {
  currentTrackId: SoundscapeTrackId;
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  errorMessage: string | null;
  downloads: Record<SoundscapeTrackId, boolean>;
  downloadProgress: Record<SoundscapeTrackId, number>; // 0 to 100
  downloadingTrackId: SoundscapeTrackId | null;
}

type StateListener = (state: SoundscapePlayerState) => void;

/**
 * Singleton Audio Player Controller
 * Guarantees only one track plays at any time, prevents duplicate audio,
 * manages loop, pause, resume, stop, volume, and offline playback.
 */
class SoundscapePlayer {
  private audio: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private listeners: Set<StateListener> = new Set();
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private freqDataArray: Uint8Array | null = null;

  private state: SoundscapePlayerState = {
    currentTrackId: 'off',
    isPlaying: false,
    isPaused: false,
    volume: 0.5,
    isMuted: false,
    isLoading: false,
    currentTime: 0,
    duration: 45,
    errorMessage: null,
    downloads: {
      off: false,
      binaural: false,
      pink_noise: false,
      brown_noise: false,
      zen_drone: false,
      rain_synth: false,
    },
    downloadProgress: {
      off: 0,
      binaural: 0,
      pink_noise: 0,
      brown_noise: 0,
      zen_drone: 0,
      rain_synth: 0,
    },
    downloadingTrackId: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
      this.checkAllDownloads();
    }
  }

  private initAudioElement() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = 'auto';
    this.audio.volume = this.state.volume;
    this.audio.muted = this.state.isMuted;

    this.audio.addEventListener('playing', () => {
      this.updateState({ isPlaying: true, isPaused: false, isLoading: false, errorMessage: null });
    });

    this.audio.addEventListener('pause', () => {
      if (this.state.currentTrackId !== 'off') {
        this.updateState({ isPlaying: false, isPaused: true });
      } else {
        this.updateState({ isPlaying: false, isPaused: false });
      }
    });

    this.audio.addEventListener('waiting', () => {
      this.updateState({ isLoading: true });
    });

    this.audio.addEventListener('canplay', () => {
      this.updateState({ isLoading: false });
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.updateState({
          currentTime: this.audio.currentTime,
          duration: this.audio.duration && !isNaN(this.audio.duration) ? this.audio.duration : 45,
        });
      }
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio && this.audio.duration && !isNaN(this.audio.duration)) {
        this.updateState({ duration: this.audio.duration });
      }
    });

    this.audio.addEventListener('error', () => {
      const error = this.audio?.error;
      let msg = 'Failed to load audio track.';
      if (error) {
        if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          msg = 'Audio format not supported or file not found.';
        } else if (error.code === MediaError.MEDIA_ERR_NETWORK) {
          msg = 'Network error while loading audio. Check internet connection.';
        }
      }
      this.updateState({
        isPlaying: false,
        isPaused: false,
        isLoading: false,
        errorMessage: msg,
      });
    });
  }

  public getState(): SoundscapePlayerState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<SoundscapePlayerState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => {
      try {
        listener(this.getState());
      } catch (err) {
        console.error('Soundscape listener error:', err);
      }
    });
  }

  public async checkAllDownloads() {
    const downloads: Record<SoundscapeTrackId, boolean> = {
      off: false,
      binaural: false,
      pink_noise: false,
      brown_noise: false,
      zen_drone: false,
      rain_synth: false,
    };

    for (const track of SOUNDSCAPE_TRACKS) {
      if (track.url) {
        downloads[track.id] = await soundscapeCache.isTrackDownloaded(track.url);
      }
    }

    this.updateState({ downloads });
  }

  public async downloadTrack(trackId: SoundscapeTrackId) {
    const track = SOUNDSCAPE_TRACKS.find((t) => t.id === trackId);
    if (!track || !track.url) return;

    this.updateState({
      downloadingTrackId: trackId,
      downloadProgress: { ...this.state.downloadProgress, [trackId]: 0 },
      errorMessage: null,
    });

    try {
      await soundscapeCache.downloadTrack(track, (percent) => {
        this.updateState({
          downloadProgress: { ...this.state.downloadProgress, [trackId]: percent },
        });
      });

      this.updateState({
        downloadingTrackId: null,
        downloads: { ...this.state.downloads, [trackId]: true },
        downloadProgress: { ...this.state.downloadProgress, [trackId]: 100 },
      });
    } catch (err: any) {
      this.updateState({
        downloadingTrackId: null,
        downloadProgress: { ...this.state.downloadProgress, [trackId]: 0 },
        errorMessage: `Download failed: ${err.message || 'Network error'}`,
      });
    }
  }

  public async selectTrack(trackId: SoundscapeTrackId, autoPlay: boolean = true) {
    if (trackId === 'off') {
      this.stop();
      this.updateState({ currentTrackId: 'off', errorMessage: null });
      return;
    }

    const track = SOUNDSCAPE_TRACKS.find((t) => t.id === trackId);
    if (!track) return;

    // If already playing this track, do not restart
    if (this.state.currentTrackId === trackId && this.state.isPlaying) {
      return;
    }

    this.updateState({
      currentTrackId: trackId,
      isLoading: true,
      errorMessage: null,
    });

    this.initAudioElement();
    if (!this.audio) return;

    // Clean up previous blob object URL if any
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }

    try {
      // Get playable source (uses offline cached blob URL if downloaded)
      const sourceUrl = await soundscapeCache.getPlayableSource(track.url);
      if (sourceUrl.startsWith('blob:')) {
        this.currentObjectUrl = sourceUrl;
      }

      this.audio.src = sourceUrl;
      this.audio.currentTime = 0;
      this.audio.volume = this.state.volume;
      this.audio.muted = this.state.isMuted;

      if (autoPlay) {
        this.ensureAudioContext();
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } else {
        this.updateState({ isPlaying: false, isPaused: true, isLoading: false });
      }
    } catch (err: any) {
      console.warn('Audio playback error:', err);
      // Browser autoplay policy might block play() until user interacts
      if (err.name === 'NotAllowedError') {
        this.updateState({
          isLoading: false,
          isPlaying: false,
          isPaused: true,
          errorMessage: 'Click Play to start audio (browser policy).',
        });
      } else {
        this.updateState({
          isLoading: false,
          isPlaying: false,
          isPaused: false,
          errorMessage: 'Could not load soundtrack. Please try again.',
        });
      }
    }
  }

  public async play() {
    if (this.state.currentTrackId === 'off') {
      // Default to 10Hz Alpha Waves if silence is currently selected
      await this.selectTrack('binaural', true);
      return;
    }

    this.initAudioElement();
    if (!this.audio) return;

    try {
      this.ensureAudioContext();
      if (this.state.isPaused && this.audio.src) {
        await this.audio.play();
      } else {
        await this.selectTrack(this.state.currentTrackId, true);
      }
    } catch (err: any) {
      console.warn('Audio play error:', err);
      this.updateState({
        errorMessage: err.name === 'NotAllowedError' 
          ? 'Tap Play to begin audio.' 
          : 'Failed to start playback.',
      });
    }
  }

  public togglePlayPause() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public toggleTrack(trackId: SoundscapeTrackId) {
    if (trackId === 'off') {
      this.selectTrack('off');
      return;
    }
    if (this.state.currentTrackId === trackId) {
      if (this.state.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    } else {
      this.selectTrack(trackId, true);
    }
  }

  public seek(seconds: number) {
    if (this.audio && !isNaN(seconds)) {
      const maxDuration = this.state.duration > 0 ? this.state.duration : 45;
      const targetTime = Math.max(0, Math.min(maxDuration, seconds));
      this.audio.currentTime = targetTime;
      this.updateState({ currentTime: targetTime });
    }
  }

  public stepVolume(delta: number) {
    this.setVolume(this.state.volume + delta);
  }

  public pause() {
    if (this.audio && this.state.isPlaying) {
      this.audio.pause();
      this.updateState({ isPlaying: false, isPaused: true });
    }
  }

  public resume() {
    this.play();
  }

  public stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.updateState({
      isPlaying: false,
      isPaused: false,
      isLoading: false,
    });
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.updateState({ volume: clamped, isMuted: clamped === 0 });
    if (this.audio) {
      this.audio.volume = clamped;
      if (clamped > 0 && this.audio.muted) {
        this.audio.muted = false;
      }
    }
  }

  public toggleMute() {
    const nextMuted = !this.state.isMuted;
    this.updateState({ isMuted: nextMuted });
    if (this.audio) {
      this.audio.muted = nextMuted;
    }
  }

  private ensureAudioContext() {
    if (typeof window === 'undefined' || !this.audio) return;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      if (this.audioCtx && !this.analyser) {
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.8;
      }
      if (this.audioCtx && this.analyser && !this.mediaSourceNode && this.audio) {
        try {
          this.mediaSourceNode = this.audioCtx.createMediaElementSource(this.audio);
          this.mediaSourceNode.connect(this.analyser);
          this.analyser.connect(this.audioCtx.destination);
        } catch (e) {
          // If already connected or CORS error, safely catch
          console.debug('MediaElementSource initialization:', e);
        }
      }
      if (this.analyser && (!this.freqDataArray || this.freqDataArray.length !== this.analyser.frequencyBinCount)) {
        this.freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
    } catch (err) {
      console.debug('AudioContext setup skipped:', err);
    }
  }

  public getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.state.isPlaying) return null;
    if (!this.freqDataArray || this.freqDataArray.length !== this.analyser.frequencyBinCount) {
      this.freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    this.analyser.getByteFrequencyData(this.freqDataArray);
    return this.freqDataArray;
  }

  public getWaveformData(): Uint8Array | null {
    if (!this.analyser || !this.state.isPlaying) return null;
    const waveArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(waveArray);
    return waveArray;
  }

  public release() {
    this.stop();
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
    if (this.audio) {
      this.audio.src = '';
      this.audio = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close().catch(() => {});
      } catch {}
    }
    this.audioCtx = null;
    this.analyser = null;
    this.mediaSourceNode = null;
  }
}

export const focusSoundscapePlayer = new SoundscapePlayer();
