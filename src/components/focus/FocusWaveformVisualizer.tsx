import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  focusSoundscapePlayer,
  SoundscapePlayerState,
  SoundscapeTrackId,
  SOUNDSCAPE_TRACKS
} from '../../lib/soundscapeService';
import { cn } from '../../lib/utils';
import { Volume2, VolumeX, Sparkles, Activity } from 'lucide-react';

interface FocusWaveformVisualizerProps {
  className?: string;
  variant?: 'compact' | 'expanded' | 'ambient';
  showTrackLabel?: boolean;
}

// Characteristic acoustic signatures per soundscape type
const TRACK_SIGNATURES: Record<SoundscapeTrackId, {
  color: string;
  glowColor: string;
  gradient: string;
  accent: string;
  baseSpeed: number;
  barCount: number;
  tag: string;
  rhythm: 'smooth' | 'binaural' | 'rain' | 'noise' | 'zen';
}> = {
  off: {
    color: '#6B7280',
    glowColor: 'rgba(107, 114, 128, 0.2)',
    gradient: 'from-gray-500/20 to-gray-600/10',
    accent: '#9CA3AF',
    baseSpeed: 0,
    barCount: 24,
    tag: 'SILENCE',
    rhythm: 'smooth',
  },
  binaural: {
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    gradient: 'from-purple-500 via-indigo-500 to-primary',
    accent: '#C084FC',
    baseSpeed: 1.0,
    barCount: 28,
    tag: '10Hz ALPHA',
    rhythm: 'binaural',
  },
  pink_noise: {
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    gradient: 'from-pink-500 via-rose-500 to-amber-500',
    accent: '#F472B6',
    baseSpeed: 1.8,
    barCount: 28,
    tag: 'PINK SPECTRUM',
    rhythm: 'noise',
  },
  brown_noise: {
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    gradient: 'from-amber-600 via-orange-500 to-amber-400',
    accent: '#FBBF24',
    baseSpeed: 0.8,
    barCount: 28,
    tag: 'DEEP BROWN',
    rhythm: 'smooth',
  },
  zen_drone: {
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    gradient: 'from-violet-600 via-purple-500 to-cyan-400',
    accent: '#A78BFA',
    baseSpeed: 0.6,
    barCount: 28,
    tag: 'ZEN HARMONIC',
    rhythm: 'zen',
  },
  rain_synth: {
    color: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    gradient: 'from-cyan-500 via-teal-400 to-blue-500',
    accent: '#22D3EE',
    baseSpeed: 2.2,
    barCount: 28,
    tag: 'ATMOSPHERIC RAIN',
    rhythm: 'rain',
  },
};

export const FocusWaveformVisualizer: React.FC<FocusWaveformVisualizerProps> = ({
  className,
  variant = 'compact',
  showTrackLabel = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playerState, setPlayerState] = useState<SoundscapePlayerState>(() =>
    focusSoundscapePlayer.getState()
  );

  // Subscribe to central player state changes
  useEffect(() => {
    const unsub = focusSoundscapePlayer.subscribe(setPlayerState);
    return unsub;
  }, []);

  const currentTrack =
    SOUNDSCAPE_TRACKS.find((t) => t.id === playerState.currentTrackId) ||
    SOUNDSCAPE_TRACKS[0];
  const signature = TRACK_SIGNATURES[playerState.currentTrackId] || TRACK_SIGNATURES.off;
  const isPlaying = playerState.isPlaying && playerState.currentTrackId !== 'off';

  // Smooth animation frame loop for the waveform canvas
  useEffect(() => {
    let animId: number;
    let phase = 0;
    const barCount = variant === 'expanded' ? 36 : 24;
    // Smoothed bar heights array for fluid audio inertia
    const smoothedHeights = new Array(barCount).fill(0.08);

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Responsive device pixel ratio support
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
          canvas.width = Math.floor(rect.width * dpr);
          canvas.height = Math.floor(rect.height * dpr);
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Check for real live frequency data from AnalyserNode
      const freqData = focusSoundscapePlayer.getFrequencyData();
      const hasRealAudioData = !!(freqData && freqData.length > 0 && freqData.some((v) => v > 0));

      // Advance phase based on track acoustic rhythm
      const speed = isPlaying ? signature.baseSpeed * (0.04 + playerState.volume * 0.04) : 0.005;
      phase += speed;

      // Draw subtle background center baseline
      const centerY = h / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      const totalBars = barCount;
      const barSpacing = w / totalBars;
      const barWidth = Math.max(2 * dpr, barSpacing * 0.55);

      for (let i = 0; i < totalBars; i++) {
        let targetNormHeight = 0.08;

        if (isPlaying) {
          const effectiveVolume = playerState.isMuted ? 0.05 : Math.max(0.2, playerState.volume);

          if (hasRealAudioData && freqData) {
            // Map bar index to audio frequency bin
            const binIndex = Math.min(
              freqData.length - 1,
              Math.floor((i / totalBars) * (freqData.length * 0.75))
            );
            const rawVal = freqData[binIndex] / 255;
            targetNormHeight = Math.max(0.1, rawVal * effectiveVolume * 0.95);
          } else {
            // Fallback organic wave synthesis modeled after specific soundscapes
            const normI = i / totalBars;
            let synValue = 0.2;

            if (signature.rhythm === 'binaural') {
              // Dual harmonic sine envelope with 10Hz beat pulsing
              const beatMod = 0.5 + 0.5 * Math.sin(phase * 4);
              const waveA = Math.sin(normI * Math.PI * 2.2 + phase);
              const waveB = Math.sin(normI * Math.PI * 4.4 - phase * 0.7);
              synValue = (0.35 + 0.35 * Math.abs(waveA) + 0.2 * waveB * beatMod) * effectiveVolume;
            } else if (signature.rhythm === 'rain') {
              // Random droplet spatter + gentle ambient swell
              const droplet = Math.sin(normI * 12 + phase * 3) > 0.7 ? 0.35 * Math.random() : 0.05;
              const swell = 0.25 + 0.25 * Math.sin(phase * 0.8 + normI * Math.PI);
              synValue = (swell + droplet) * effectiveVolume;
            } else if (signature.rhythm === 'noise') {
              // Pink spectrum noise: heavier on low frequencies, fluttering on highs
              const lowWeighted = 1 - normI * 0.55;
              const jitter = Math.sin(phase * 5 + i * 1.7) * 0.15 + (Math.random() - 0.5) * 0.15;
              synValue = (0.28 * lowWeighted + jitter + 0.2) * effectiveVolume;
            } else if (signature.rhythm === 'zen') {
              // Harmonic overtone bell resonance curve
              const bellCurve = Math.sin(normI * Math.PI);
              const slowBreathing = 0.5 + 0.5 * Math.sin(phase * 1.2);
              synValue = (bellCurve * (0.35 + 0.45 * slowBreathing)) * effectiveVolume;
            } else {
              // Deep brown noise: gentle deep bass roll
              const curve = Math.cos(normI * Math.PI * 0.8);
              synValue = (0.3 + 0.3 * Math.max(0, curve) + 0.15 * Math.sin(phase + normI * 2)) * effectiveVolume;
            }

            targetNormHeight = Math.min(0.92, Math.max(0.08, synValue));
          }
        } else {
          // Idle ambient resting state: very gentle baseline micro-wave
          targetNormHeight = 0.06 + 0.03 * Math.sin(phase * 0.6 + (i / totalBars) * Math.PI * 2);
        }

        // Apply smooth inertia damping
        const lerpFactor = isPlaying ? 0.22 : 0.1;
        smoothedHeights[i] += (targetNormHeight - smoothedHeights[i]) * lerpFactor;

        const currentNorm = smoothedHeights[i];
        const barHeight = Math.max(3 * dpr, currentNorm * (h * 0.85));
        const x = i * barSpacing + (barSpacing - barWidth) / 2;
        const y = centerY - barHeight / 2;

        // Gradient styling matching current soundscape
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        if (isPlaying) {
          grad.addColorStop(0, signature.accent);
          grad.addColorStop(0.5, signature.color);
          grad.addColorStop(1, signature.accent);

          // Subtle neon glow behind active bars
          ctx.shadowColor = signature.glowColor;
          ctx.shadowBlur = 8 * dpr;
        } else {
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = grad;

        // Rounded bar caps
        const radius = Math.min(barWidth / 2, 3 * dpr);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();

        // Reset shadow for next operations
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, signature, playerState.volume, playerState.isMuted, variant]);

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between transition-all duration-300",
        variant === 'compact' && "w-full max-w-sm px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 backdrop-blur-md",
        variant === 'expanded' && "w-full max-w-md px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]",
        variant === 'ambient' && "w-full py-1 bg-transparent",
        className
      )}
    >
      {/* Track info & Live Acoustic Indicator */}
      {showTrackLabel && (
        <div className="flex items-center gap-2.5 mr-3 min-w-0">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
              isPlaying
                ? "border shadow-[0_0_12px]"
                : "bg-white/5 border border-white/5 text-platinum/40"
            )}
            style={{
              backgroundColor: isPlaying ? `${signature.color}20` : undefined,
              borderColor: isPlaying ? `${signature.color}50` : undefined,
              color: isPlaying ? signature.color : undefined,
              boxShadow: isPlaying ? `0 0 14px ${signature.glowColor}` : undefined,
            }}
          >
            {isPlaying ? (
              <Activity className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 opacity-60" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-white tracking-tight truncate max-w-[110px] sm:max-w-[140px]">
                {currentTrack.label}
              </span>
              {isPlaying && (
                <span
                  className="text-[8px] font-mono font-black uppercase px-1 py-0.2 rounded border shrink-0"
                  style={{
                    backgroundColor: `${signature.color}15`,
                    borderColor: `${signature.color}35`,
                    color: signature.accent,
                  }}
                >
                  {signature.tag}
                </span>
              )}
            </div>
            <span className="text-[9px] text-platinum/50 font-mono flex items-center gap-1 truncate">
              {isPlaying ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>
                    Sync'd • {playerState.isMuted ? 'Muted' : `${Math.round(playerState.volume * 100)}% vol`}
                  </span>
                </>
              ) : (
                <span>No soundscape active</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Real-time Dynamic Waveform Canvas */}
      <div className="relative flex-1 h-7 sm:h-8 flex items-center justify-center overflow-hidden min-w-[90px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ imageRendering: 'auto' }}
        />

        {/* Ambient Subtle Edge Vignette for aesthetic softness */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-bg-dark/40 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-bg-dark/40 to-transparent" />
      </div>

      {/* Interactive Micro Quick-Play / Mute Control */}
      {playerState.currentTrackId !== 'off' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            focusSoundscapePlayer.togglePlayPause();
          }}
          className={cn(
            "ml-2.5 p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 active:scale-95",
            isPlaying
              ? "bg-white/5 hover:bg-white/10 text-platinum/80 hover:text-white border-white/10"
              : "bg-primary/20 hover:bg-primary/30 text-primary border-primary/30"
          )}
          title={isPlaying ? "Pause Soundscape" : "Resume Soundscape"}
        >
          {isPlaying ? (
            <Volume2 className="w-3.5 h-3.5" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-platinum/50" />
          )}
        </button>
      )}
    </div>
  );
};

export default FocusWaveformVisualizer;
