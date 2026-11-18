import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Volume1,
  Download, 
  CheckCircle2, 
  Loader2, 
  Headphones,
  Radio,
  Sliders,
  Minus,
  Plus,
  Check,
  AlertCircle,
  X,
  Timer
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  focusSoundscapePlayer, 
  SOUNDSCAPE_TRACKS, 
  SoundscapeTrack, 
  SoundscapeTrackId,
  SoundscapePlayerState 
} from '../../lib/soundscapeService';
import { playSound } from '../../lib/audio';
import { FocusWaveformVisualizer } from './FocusWaveformVisualizer';

interface FocusSoundscapePanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  sessionMode?: 'focus' | 'break';
  remainingSeconds?: number;
}

export const FocusSoundscapePanel: React.FC<FocusSoundscapePanelProps> = ({
  isOpen,
  onClose,
  className,
  sessionMode = 'focus',
  remainingSeconds,
}) => {
  const [playerState, setPlayerState] = useState<SoundscapePlayerState>(
    focusSoundscapePlayer.getState()
  );
  const [hoveredTrackId, setHoveredTrackId] = useState<SoundscapeTrackId | null>(null);
  const [showVolumePresets, setShowVolumePresets] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time central audio state
  useEffect(() => {
    const unsubscribe = focusSoundscapePlayer.subscribe((state) => {
      setPlayerState(state);
    });
    return unsubscribe;
  }, []);

  // Keyboard accessibility shortcuts while panel is open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing into an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        playSound('click');
        focusSoundscapePlayer.togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        playSound('click');
        focusSoundscapePlayer.toggleMute();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusSoundscapePlayer.stepVolume(0.05);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusSoundscapePlayer.stepVolume(-0.05);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (SOUNDSCAPE_TRACKS[index]) {
          playSound('click');
          if (SOUNDSCAPE_TRACKS[index].id === 'off') {
            focusSoundscapePlayer.selectTrack('off');
          } else {
            focusSoundscapePlayer.selectTrack(SOUNDSCAPE_TRACKS[index].id, true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeTrack = SOUNDSCAPE_TRACKS.find(t => t.id === playerState.currentTrackId) || SOUNDSCAPE_TRACKS[0];

  // Selecting a track: clicks anywhere on the row container immediately select and start the track
  const handleSelectTrack = (track: SoundscapeTrack) => {
    playSound('click');
    if (track.id === 'off') {
      focusSoundscapePlayer.selectTrack('off');
    } else {
      if (playerState.currentTrackId === track.id) {
        // Already selected: if paused, resume playing
        if (!playerState.isPlaying) {
          focusSoundscapePlayer.play();
        }
      } else {
        // Select track and begin playback immediately
        focusSoundscapePlayer.selectTrack(track.id, true);
      }
    }
  };

  const handleQuickPlayPause = (e: React.MouseEvent, track: SoundscapeTrack) => {
    e.stopPropagation();
    playSound('click');
    if (track.id === 'off') {
      focusSoundscapePlayer.selectTrack('off');
    } else if (playerState.currentTrackId === track.id) {
      focusSoundscapePlayer.togglePlayPause();
    } else {
      focusSoundscapePlayer.selectTrack(track.id, true);
    }
  };

  const handleToggleMasterPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    if (playerState.currentTrackId === 'off') {
      // Default to 10Hz Alpha Waves if silence was active
      focusSoundscapePlayer.selectTrack('binaural', true);
    } else {
      focusSoundscapePlayer.togglePlayPause();
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    focusSoundscapePlayer.stop();
  };

  const handleDownload = async (e: React.MouseEvent, track: SoundscapeTrack) => {
    e.stopPropagation();
    playSound('click');
    await focusSoundscapePlayer.downloadTrack(track.id);
  };

  const handleVolumePreset = (val: number) => {
    playSound('click');
    focusSoundscapePlayer.setVolume(val);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = ratio * (playerState.duration || 45);
    focusSoundscapePlayer.seek(targetSeconds);
  };

  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec || 0);
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const currentVolPct = Math.round((playerState.isMuted ? 0 : playerState.volume) * 100);
  const progressRatio = (playerState.duration > 0)
    ? Math.max(0, Math.min(1, playerState.currentTime / playerState.duration))
    : 0;

  return (
    <AnimatePresence>
      {/* 
        Dedicated Modal Backdrop Overlay:
        Completely separates the Sounds panel from the focus timer.
        Solid contrast prevents timer elements and countdown numbers from mixing into the panel.
      */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Focus Soundscape Audio Player"
      >
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-[500px] max-h-[92vh] rounded-3xl bg-[#0D0D17] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.95)] flex flex-col text-platinum select-none overflow-hidden relative",
            className
          )}
        >
          {/* Header with Title, DSP Tag, Timer Status & Close Button */}
          <div className="p-4 pb-3.5 border-b border-white/10 bg-gradient-to-r from-primary/15 via-transparent to-cyan-500/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(177,74,224,0.35)]">
                  <Headphones className="w-4 h-4" />
                </div>
                {playerState.isPlaying && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0D0D17] animate-pulse" />
                )}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span>Focus Soundscapes</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 uppercase">
                    DSP PRO
                  </span>
                </div>
                <div className="text-[10px] text-platinum/50 font-medium flex items-center gap-1.5 mt-0.5">
                  <Radio className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Lossless Neural Audio • Offline Ready</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Ongoing Focus Timer Indicator (reassures user that the timer continues running) */}
              {remainingSeconds !== undefined && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-platinum/70 text-[10px] font-mono">
                  <Timer className="w-3 h-3 text-primary animate-pulse" />
                  <span className="capitalize">{sessionMode}</span>
                  <span className="text-white font-bold">{formatSeconds(remainingSeconds)}</span>
                </div>
              )}

              {/* Status Pill: LIVE / PAUSED / STANDBY */}
              {playerState.isPlaying ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-extrabold uppercase tracking-wider shadow-[0_0_12px_rgba(177,74,224,0.25)]">
                  <span className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-primary rounded-full animate-bounce" />
                    <span className="w-0.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  </span>
                  <span className="font-mono">LIVE</span>
                </div>
              ) : playerState.currentTrackId !== 'off' && playerState.isPaused ? (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>PAUSED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-platinum/40 text-[10px] font-medium">
                  <span>SILENT</span>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-platinum/60 hover:text-white transition-colors cursor-pointer border border-white/5"
                title="Close Soundscapes (Esc)"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error notification banner if any */}
          {playerState.errorMessage && (
            <div className="mx-4 mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-300 text-xs animate-fade-in shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="flex-1 leading-tight">{playerState.errorMessage}</span>
            </div>
          )}

          {/* Active Track Benefit Sub-banner & Live Waveform */}
          {activeTrack.id !== 'off' && (
            <div className="mx-3.5 mt-3 px-3.5 py-2.5 rounded-2xl bg-[#141420] border border-white/5 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs text-platinum/70">
                <span className="truncate flex-1 pr-2">
                  <span className="text-primary font-bold">{activeTrack.frequency}:</span> {activeTrack.benefit}
                </span>
                <span className="font-mono text-[10px] text-cyan-400/90 shrink-0 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Seamless Loop
                </span>
              </div>
              <FocusWaveformVisualizer
                variant="ambient"
                showTrackLabel={false}
                className="py-0 px-0 h-5"
              />
            </div>
          )}

          {/* 
            Soundtrack List (6 options) 
            Each row is fully clickable across 100% of its visible area.
            Hover is applied to the full card container.
            Nested text has pointer-events-none to prevent click/hover flickering.
          */}
          <div className="p-3.5 space-y-2 overflow-y-auto max-h-[295px] custom-scrollbar flex-1">
            {SOUNDSCAPE_TRACKS.map((track, idx) => {
              const isSelected = playerState.currentTrackId === track.id;
              const isTrackPlaying = isSelected && playerState.isPlaying;
              const isTrackPaused = isSelected && playerState.isPaused;
              const isDownloaded = playerState.downloads[track.id];
              const isDownloading = playerState.downloadingTrackId === track.id;
              const downloadPct = playerState.downloadProgress[track.id] || 0;
              const isSilence = track.id === 'off';
              const isHovered = hoveredTrackId === track.id;

              return (
                <div
                  key={track.id}
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => setHoveredTrackId(track.id)}
                  onMouseLeave={() => setHoveredTrackId(null)}
                  onClick={() => handleSelectTrack(track)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectTrack(track);
                    }
                  }}
                  className={cn(
                    "group w-full text-left p-3 rounded-2xl flex items-center justify-between text-xs transition-all duration-150 cursor-pointer select-none border relative overflow-hidden",
                    isSelected
                      ? "bg-gradient-to-r from-primary/25 via-primary/15 to-[#1E1428] border-primary/60 text-white shadow-[0_0_24px_rgba(177,74,224,0.22)] ring-1 ring-primary/40"
                      : isHovered
                      ? "bg-[#1C1C2C] border-white/20 text-white shadow-md"
                      : "bg-[#141420] hover:bg-[#1B1B2C] border-white/5 hover:border-white/15 text-platinum/70 hover:text-white"
                  )}
                >
                  {/* Left Side: Status Icon + Title + Frequency Badge + Benefit Description */}
                  <div className="flex items-center gap-3 min-w-0 pr-2 flex-1 pointer-events-none">
                    {/* Status Box */}
                    <div
                      className={cn(
                        "w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 transition-all font-mono font-bold text-xs",
                        isSelected
                          ? "bg-primary text-white shadow-[0_0_15px_rgba(177,74,224,0.6)]"
                          : "bg-white/5 text-platinum/50 group-hover:bg-white/10 group-hover:text-primary"
                      )}
                    >
                      {isSilence ? (
                        <VolumeX className="w-4 h-4" />
                      ) : isTrackPlaying ? (
                        <span className="flex items-end gap-0.5 h-3.5">
                          <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                          <span className="w-0.5 h-3.5 bg-white rounded-full animate-bounce" />
                          <span className="w-0.5 h-1.5 bg-white rounded-full animate-pulse" />
                          <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce" />
                        </span>
                      ) : isTrackPaused ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <span className="text-[11px] text-platinum/50 group-hover:text-primary font-semibold">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pointer-events-none">
                      <div className="flex items-center gap-2 font-bold truncate text-white">
                        <span className="truncate text-xs sm:text-sm font-semibold">{track.label}</span>
                        
                        <span className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 uppercase transition-colors",
                          isSelected 
                            ? "bg-primary/30 text-white border border-primary/50" 
                            : "bg-white/5 text-platinum/50 border border-white/5 group-hover:text-cyan-300 group-hover:border-cyan-500/30"
                        )}>
                          {track.badge}
                        </span>

                        {isSelected && (
                          <Check className="w-4 h-4 text-primary shrink-0 ml-auto" />
                        )}
                      </div>
                      
                      <div className="text-[11px] text-platinum/50 truncate font-normal mt-0.5 group-hover:text-platinum/80 transition-colors">
                        {track.desc}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Quick Play Button & Offline Download Button */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {/* Quick Play/Pause on row */}
                    {!isSilence && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickPlayPause(e, track)}
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
                          isTrackPlaying
                            ? "bg-primary text-white border-primary shadow-sm hover:scale-105 active:scale-95"
                            : isSelected
                            ? "bg-white/10 hover:bg-primary text-white border-white/20 active:scale-95"
                            : "bg-white/5 group-hover:bg-primary/90 text-platinum/60 group-hover:text-white border-white/10 group-hover:border-primary/50"
                        )}
                        title={isTrackPlaying ? "Pause this track" : "Play this track"}
                      >
                        {isTrackPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    )}

                    {/* Offline Download Control */}
                    {!isSilence && (
                      <div onClick={(e) => e.stopPropagation()}>
                        {isDownloading ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-primary/20 border border-primary/30 text-[10px] text-primary font-bold">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="font-mono">{downloadPct}%</span>
                          </div>
                        ) : isDownloaded ? (
                          <div 
                            className="p-1.5 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 text-[10px] font-semibold"
                            title="Downloaded & available offline"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline font-mono text-[9px]">OFFLINE</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleDownload(e, track)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-primary/20 hover:border-primary/40 border border-white/5 text-platinum/50 hover:text-white transition-all cursor-pointer"
                            title={`Download for offline use (${track.sizeLabel})`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Master Audio Controller Footer */}
          <div className="p-3.5 border-t border-white/10 bg-[#08080E] space-y-2.5 shrink-0">
            {/* Timeline Scrub Bar */}
            {playerState.currentTrackId !== 'off' && (
              <div className="space-y-1">
                <div 
                  onClick={handleProgressBarClick}
                  className="w-full h-1.5 bg-white/10 hover:h-2 rounded-full overflow-hidden cursor-pointer relative transition-all group"
                  title="Click to jump loop playback position"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 via-primary to-magenta rounded-full relative transition-[width] duration-150"
                    style={{ width: `${progressRatio * 100}%` }}
                  >
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-platinum/40">
                  <span>{formatSeconds(playerState.currentTime)}</span>
                  <span className="text-[9px] tracking-wider text-platinum/30 uppercase">Seamless Neural Loop</span>
                  <span>{formatSeconds(playerState.duration || 45)}</span>
                </div>
              </div>
            )}

            {/* Master Transport Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* Master Play / Pause */}
                <button
                  type="button"
                  onClick={handleToggleMasterPlay}
                  className={cn(
                    "h-9 px-3.5 rounded-xl flex items-center gap-1.5 font-bold transition-all shadow-md cursor-pointer shrink-0 text-xs",
                    playerState.isPlaying
                      ? "bg-primary text-white shadow-primary/40 hover:scale-102 active:scale-98 border border-primary/50"
                      : playerState.currentTrackId === 'off'
                      ? "bg-white/10 hover:bg-primary text-platinum hover:text-white border border-white/10 active:scale-98"
                      : "bg-emerald-500 hover:bg-emerald-400 text-bg-dark border border-emerald-400/40 shadow-emerald-500/20 active:scale-98"
                  )}
                  title={playerState.isPlaying ? "Pause audio (Space)" : "Play selected audio (Space)"}
                >
                  {playerState.isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading</span>
                    </>
                  ) : playerState.isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                {/* Stop & Reset Button */}
                <button
                  type="button"
                  onClick={handleStop}
                  disabled={playerState.currentTrackId === 'off' && !playerState.isPlaying}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-platinum/60 hover:text-white transition-all border border-white/5 cursor-pointer shrink-0",
                    playerState.currentTrackId === 'off' && !playerState.isPlaying
                      ? "opacity-30 cursor-not-allowed bg-white/5"
                      : "bg-white/5 hover:bg-white/15 active:scale-95"
                  )}
                  title="Stop audio and reset loop"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>

                {/* Selected Track Label */}
                <div className="min-w-0 flex flex-col pl-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-platinum/40 truncate">
                    Currently Selected
                  </span>
                  <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[170px]">
                    {playerState.currentTrackId === 'off' ? 'Silence' : activeTrack.label}
                  </span>
                </div>
              </div>

              {/* Volume Presets Toggle */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowVolumePresets(!showVolumePresets)}
                  className={cn(
                    "p-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    showVolumePresets 
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" 
                      : "bg-white/5 hover:bg-white/10 text-platinum/60 hover:text-white border-white/5"
                  )}
                  title="Toggle volume presets"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-mono">Presets</span>
                </button>
              </div>
            </div>

            {/* Quick Volume Preset Buttons (0%, 25%, 50%, 75%, 100%) */}
            {showVolumePresets && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-1 flex items-center justify-between gap-1.5 border-t border-white/5"
              >
                {[
                  { label: '0%', val: 0 },
                  { label: '25%', val: 0.25 },
                  { label: '50%', val: 0.50 },
                  { label: '75%', val: 0.75 },
                  { label: '100%', val: 1.0 },
                ].map(preset => {
                  const isActive = !playerState.isMuted && Math.abs(playerState.volume - preset.val) < 0.05;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleVolumePreset(preset.val)}
                      className={cn(
                        "flex-1 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer border",
                        isActive
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white/5 hover:bg-white/10 text-platinum/60 hover:text-white border-white/5"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* Volume Control, Steppers & VU Meter */}
            <div className="pt-1 flex items-center gap-2">
              {/* Mute Button */}
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  focusSoundscapePlayer.toggleMute();
                }}
                className="p-1.5 rounded-xl hover:bg-white/10 text-platinum/60 hover:text-white transition-colors cursor-pointer shrink-0 border border-white/5"
                title={playerState.isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : playerState.volume < 0.5 ? (
                  <Volume1 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-primary" />
                )}
              </button>

              {/* Step Volume Down */}
              <button
                type="button"
                onClick={() => focusSoundscapePlayer.stepVolume(-0.05)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-platinum/50 hover:text-white transition-colors cursor-pointer border border-white/5"
                title="Decrease volume by 5%"
              >
                <Minus className="w-3 h-3" />
              </button>

              {/* Range Slider */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={playerState.isMuted ? 0 : playerState.volume}
                  onChange={(e) => focusSoundscapePlayer.setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary-hover transition-all"
                  title={`Volume: ${currentVolPct}%`}
                />
              </div>

              {/* Step Volume Up */}
              <button
                type="button"
                onClick={() => focusSoundscapePlayer.stepVolume(0.05)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-platinum/50 hover:text-white transition-colors cursor-pointer border border-white/5"
                title="Increase volume by 5%"
              >
                <Plus className="w-3 h-3" />
              </button>

              {/* LED VU Meter & Readout */}
              <div className="flex items-center gap-1.5 shrink-0 pl-1">
                <div className="flex items-center gap-0.5">
                  {[0.2, 0.4, 0.7, 0.9].map((thresh, i) => {
                    const lit = !playerState.isMuted && playerState.volume >= thresh;
                    return (
                      <span 
                        key={i} 
                        className={cn(
                          "w-1 h-3 rounded-full transition-colors",
                          lit 
                            ? i === 3 ? "bg-magenta shadow-[0_0_6px_rgba(240,66,165,0.8)]" : "bg-primary shadow-[0_0_6px_rgba(177,74,224,0.8)]"
                            : "bg-white/10"
                        )} 
                      />
                    );
                  })}
                </div>

                <span className="text-[11px] font-mono font-bold text-white w-8 text-right">
                  {currentVolPct}%
                </span>
              </div>
            </div>

            {/* Keyboard Shortcuts Hint Bar */}
            <div className="pt-1 flex items-center justify-between text-[9px] text-platinum/40 font-mono border-t border-white/5">
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-white/10 text-platinum/70">Space</span> Play/Pause
              </span>
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-white/10 text-platinum/70">M</span> Mute
              </span>
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-white/10 text-platinum/70">↑/↓</span> Volume
              </span>
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-white/10 text-platinum/70">1-6</span> Track
              </span>
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-white/10 text-platinum/70">Esc</span> Close
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
