import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Minimize2,
  Maximize2,
  VolumeX,
  Sparkles,
  Zap,
  CheckCircle2,
  Coffee,
  ShieldAlert,
  Music,
  Check,
  ChevronDown,
  FileText,
  Headphones
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Habit, FocusSessionRecord, UserProfile } from '../../types';
import { playSound } from '../../lib/audio';
import { readScopedJSON, writeScopedJSON } from '../../lib/storageSync';
import {
  focusSoundscapePlayer,
  SOUNDSCAPE_TRACKS,
  SoundscapePlayerState
} from '../../lib/soundscapeService';
import { FocusSoundscapePanel } from './FocusSoundscapePanel';
import { FocusWaveformVisualizer } from './FocusWaveformVisualizer';
import { getHabitXP, inferHabitDifficulty } from '../../lib/progressionEngine';

interface FocusSessionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  preselectedHabitId?: string;
  onUpdateHabitProgress?: (id: string, newValue: number, meta?: { source?: string }) => void;
  onAddXP?: (amount: number, meta?: { key?: string; reason?: string; source?: 'focus'; entityId?: string }) => void;
  userProfile?: UserProfile;
  onSessionSaved?: (record: FocusSessionRecord) => void;
}

interface PersistedFocusTimerState {
  sessionMode: 'focus' | 'break';
  selectedHabitId: string;
  targetMinutes: number;
  remainingSeconds: number;
  elapsedFocusSeconds: number;
  isRunning: boolean;
  lastTickAtMs: number;
  distractionCount: number;
}

const PRESETS = [
  { label: 'Sprint', minutes: 15, tag: 'Quick Win', xpBonus: 10 },
  { label: 'Pomodoro', minutes: 25, tag: 'Standard', xpBonus: 20 },
  { label: 'Deep Focus', minutes: 45, tag: 'High Flow', xpBonus: 35 },
  { label: 'Flow State', minutes: 60, tag: 'Peak Zone', xpBonus: 50 },
  { label: 'Mastery', minutes: 90, tag: 'Ultra Deep', xpBonus: 80 },
];

const BREAK_PRESETS = [
  { label: 'Quick Breath', minutes: 5 },
  { label: 'Recharge', minutes: 10 },
  { label: 'Long Break', minutes: 15 },
];

const DEEP_WORK_QUOTES = [
  "Clarity about what matters provides clarity about what does not.",
  "Deep work is the ability to focus without distraction on a cognitively demanding task.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Where attention goes, neural firing flows, and neural connection grows.",
  "Discipline is choosing between what you want now and what you want most.",
  "The secret to extraordinary focus is ruthless elimination of the trivial.",
  "Flow is an optimal state of consciousness where we feel and perform our best."
];

export const FocusSessionOverlay: React.FC<FocusSessionOverlayProps> = ({
  isOpen,
  onClose,
  habits,
  preselectedHabitId,
  onUpdateHabitProgress,
  onAddXP,
  onSessionSaved,
}) => {
  const [sessionMode, setSessionMode] = useState<'focus' | 'break'>('focus');

  const getDefaultHabitId = useCallback(() => {
    if (preselectedHabitId) return preselectedHabitId;
    const timingHabit = habits.find(h => h.type === 'timing' && !h.isArchived && !h.isPaused);
    if (timingHabit) return timingHabit.id;
    const firstActive = habits.find(h => !h.isArchived && !h.isPaused);
    return firstActive ? firstActive.id : '';
  }, [habits, preselectedHabitId]);

  const [selectedHabitId, setSelectedHabitId] = useState<string>(getDefaultHabitId);
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedFocusSeconds, setElapsedFocusSeconds] = useState<number>(0);

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundPlayerState, setSoundPlayerState] = useState<SoundscapePlayerState>(() =>
    focusSoundscapePlayer.getState()
  );
  const [showSoundMenu, setShowSoundMenu] = useState<boolean>(false);
  const [showHabitMenu, setShowHabitMenu] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [distractionCount, setDistractionCount] = useState<number>(0);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);

  const [sessionFinished, setSessionFinished] = useState<boolean>(false);
  const [finishedSummary, setFinishedSummary] = useState<{
    habitName: string;
    habitEmoji: string;
    totalMinutesFocused: number;
    xpEarned: number;
    wasTargetReached: boolean;
  } | null>(null);
  const [reflectionNote, setReflectionNote] = useState<string>('');

  const lastTickAtRef = useRef<number>(Date.now());
  const autoCompletedRef = useRef<boolean>(false);
  const hydratedRef = useRef<boolean>(false);

  const targetHabit = useMemo(() => habits.find(h => h.id === selectedHabitId), [habits, selectedHabitId]);

  // Restore active persisted timer once on mount if any
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const persisted = readScopedJSON<PersistedFocusTimerState | null>('active_focus_timer', null);
    if (persisted && persisted.targetMinutes > 0) {
      setSessionMode(persisted.sessionMode);
      if (persisted.selectedHabitId) setSelectedHabitId(persisted.selectedHabitId);
      setTargetMinutes(persisted.targetMinutes);
      setDistractionCount(persisted.distractionCount || 0);

      if (persisted.isRunning && persisted.lastTickAtMs) {
        const deltaSecs = Math.max(0, Math.floor((Date.now() - persisted.lastTickAtMs) / 1000));
        const newRemaining = Math.max(0, persisted.remainingSeconds - deltaSecs);
        const addedFocus = persisted.sessionMode === 'focus' ? Math.min(deltaSecs, persisted.remainingSeconds) : 0;
        setRemainingSeconds(newRemaining);
        setElapsedFocusSeconds(persisted.elapsedFocusSeconds + addedFocus);
        setIsRunning(newRemaining > 0);
        lastTickAtRef.current = Date.now();
      } else {
        setRemainingSeconds(persisted.remainingSeconds);
        setElapsedFocusSeconds(persisted.elapsedFocusSeconds);
        setIsRunning(false);
      }
    }
  }, []);

  // Sync selected habit cleanly when preselectedHabitId changes and timer isn't actively running
  useEffect(() => {
    if (!isOpen) return;
    if (preselectedHabitId && !isRunning) {
      setSelectedHabitId(preselectedHabitId);
    }
  }, [isOpen, preselectedHabitId, isRunning]);

  // Persist active timer snapshot whenever state changes
  useEffect(() => {
    if (!isOpen && !isRunning && elapsedFocusSeconds === 0) {
      writeScopedJSON('active_focus_timer', null);
      return;
    }
    const payload: PersistedFocusTimerState = {
      sessionMode,
      selectedHabitId,
      targetMinutes,
      remainingSeconds,
      elapsedFocusSeconds,
      isRunning,
      lastTickAtMs: Date.now(),
      distractionCount
    };
    writeScopedJSON('active_focus_timer', payload);
  }, [isOpen, sessionMode, selectedHabitId, targetMinutes, remainingSeconds, elapsedFocusSeconds, isRunning, distractionCount]);

  // Quote rotation every 25 seconds
  useEffect(() => {
    if (!isOpen) return;
    const quoteInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % DEEP_WORK_QUOTES.length);
    }, 25000);
    return () => clearInterval(quoteInterval);
  }, [isOpen]);

  // Subscribe to central sound player
  useEffect(() => {
    const unsub = focusSoundscapePlayer.subscribe(setSoundPlayerState);
    return unsub;
  }, []);

  const handleCompleteSession = useCallback((naturalFinish: boolean = false) => {
    setIsRunning(false);
    focusSoundscapePlayer.stop();
    playSound('bell');

    const totalSecondsFocused = naturalFinish
      ? Math.max(targetMinutes * 60, elapsedFocusSeconds)
      : Math.max(30, elapsedFocusSeconds);
    const focusedMinutes = Number((totalSecondsFocused / 60).toFixed(1));

    let xpEarned = 0;
    const sessionId = `focus_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (sessionMode === 'focus') {
      const basePreset = PRESETS.find(p => p.minutes === targetMinutes);
      const basePresetXP = basePreset ? basePreset.xpBonus : Math.max(5, Math.round(focusedMinutes * 0.8));
      const habitDiff = targetHabit?.difficulty || (targetHabit ? inferHabitDifficulty(targetHabit) : 'Medium');
      const diffMultiplier =
        habitDiff === 'Very Hard' ? 1.5 : habitDiff === 'Hard' ? 1.3 : habitDiff === 'Medium' ? 1.0 : 0.8;

      const completionScale = naturalFinish ? 1 : Math.min(1, Math.max(0.25, focusedMinutes / Math.max(1, targetMinutes)));
      xpEarned = Math.max(5, Math.round(basePresetXP * diffMultiplier * completionScale));

      if (targetHabit && onUpdateHabitProgress) {
        if (targetHabit.type === 'timing') {
          const currentMins = targetHabit.currentValue || 0;
          const updatedMins = Number((currentMins + focusedMinutes).toFixed(1));
          onUpdateHabitProgress(targetHabit.id, updatedMins, { source: 'focus_session' });
        } else if (targetHabit.type === 'quantitative') {
          const currentVal = targetHabit.currentValue || 0;
          onUpdateHabitProgress(targetHabit.id, currentVal + 1, { source: 'focus_session' });
        } else if (targetHabit.type === 'binary') {
          if (focusedMinutes >= 10 || naturalFinish) {
            onUpdateHabitProgress(targetHabit.id, 1, { source: 'focus_session' });
          }
        }
      }

      if (onAddXP && xpEarned > 0) {
        onAddXP(xpEarned, {
          key: `focus_${sessionId}`,
          reason: `Focus session: ${targetHabit?.name || 'Deep Work'}`,
          source: 'focus',
          entityId: targetHabit?.id || sessionId
        });
      }

      const sessionRecord: FocusSessionRecord = {
        id: sessionId,
        habitId: targetHabit?.id,
        habitName: targetHabit?.name || 'Deep Work Session',
        habitEmoji: targetHabit?.emoji || '🎯',
        durationMinutes: targetMinutes,
        actualSecondsCompleted: totalSecondsFocused,
        completedAt: new Date().toISOString(),
        xpEarned,
        mode: sessionMode,
        distractionCount,
        reflectionNote: reflectionNote.trim() || undefined
      };

      const existing = readScopedJSON<FocusSessionRecord[]>('focus_sessions', []);
      writeScopedJSON('focus_sessions', [sessionRecord, ...existing].slice(0, 100));

      if (onSessionSaved) {
        onSessionSaved(sessionRecord);
      }
    }

    writeScopedJSON('active_focus_timer', null);

    setFinishedSummary({
      habitName: targetHabit?.name || 'Freeform Deep Work',
      habitEmoji: targetHabit?.emoji || '⚡',
      totalMinutesFocused: focusedMinutes,
      xpEarned,
      wasTargetReached: naturalFinish || focusedMinutes >= targetMinutes
    });

    setSessionFinished(true);
  }, [
    targetMinutes,
    elapsedFocusSeconds,
    sessionMode,
    targetHabit,
    onUpdateHabitProgress,
    onAddXP,
    distractionCount,
    reflectionNote,
    onSessionSaved
  ]);

  // Wall-clock accurate timer loop (immune to tab throttling & stale closures)
  useEffect(() => {
    if (!isRunning) {
      autoCompletedRef.current = false;
      return;
    }

    lastTickAtRef.current = Date.now();

    const interval = setInterval(() => {
      const nowMs = Date.now();
      const deltaSecs = Math.floor((nowMs - lastTickAtRef.current) / 1000);
      if (deltaSecs <= 0) return;

      lastTickAtRef.current += deltaSecs * 1000;

      setRemainingSeconds(prev => Math.max(0, prev - deltaSecs));
      if (sessionMode === 'focus') {
        setElapsedFocusSeconds(prev => prev + deltaSecs);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, sessionMode]);

  // Trigger natural session completion strictly once when countdown hits 0
  useEffect(() => {
    if (isRunning && remainingSeconds <= 0 && !autoCompletedRef.current) {
      autoCompletedRef.current = true;
      handleCompleteSession(true);
    }
  }, [isRunning, remainingSeconds, handleCompleteSession]);

  const handleToggleTimer = () => {
    if (isRunning) {
      playSound('pause');
      setIsRunning(false);
    } else {
      playSound('start');
      lastTickAtRef.current = Date.now();
      autoCompletedRef.current = false;
      setIsRunning(true);
      if (soundPlayerState.currentTrackId !== 'off' && !soundPlayerState.isPlaying) {
        focusSoundscapePlayer.play();
      }
    }
  };

  const handleAdjustSeconds = (deltaSeconds: number) => {
    setRemainingSeconds(prev => Math.max(10, prev + deltaSeconds));
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    autoCompletedRef.current = false;
    playSound('click');
    setRemainingSeconds(targetMinutes * 60);
    setElapsedFocusSeconds(0);
    setDistractionCount(0);
    writeScopedJSON('active_focus_timer', null);
  };

  const handleSwitchMode = (mode: 'focus' | 'break') => {
    setIsRunning(false);
    autoCompletedRef.current = false;
    setSessionMode(mode);
    const defaultMins = mode === 'focus' ? 25 : 5;
    setTargetMinutes(defaultMins);
    setRemainingSeconds(defaultMins * 60);
    setElapsedFocusSeconds(0);
    playSound('click');

    if (mode === 'break' && soundPlayerState.isPlaying) {
      focusSoundscapePlayer.pause();
    }
  };

  const confirmAndExit = () => {
    setIsRunning(false);
    setShowExitConfirm(false);
    setIsMinimized(false);
    setElapsedFocusSeconds(0);
    setRemainingSeconds(targetMinutes * 60);
    focusSoundscapePlayer.stop();
    writeScopedJSON('active_focus_timer', null);
    onClose();
  };

  const handleExitOverlay = () => {
    if (isRunning) {
      setShowExitConfirm(true);
    } else {
      confirmAndExit();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!isOpen) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalTargetSecs = Math.max(1, targetMinutes * 60);
  const progressRatio = Math.max(0, Math.min(1, 1 - remainingSeconds / totalTargetSecs));
  const strokeRadius = 140;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const exitConfirmDialog = showExitConfirm && (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/15 max-w-sm w-full space-y-5 shadow-2xl bg-[#14141E]">
        <div className="space-y-2">
          <h3 className="text-lg font-display font-bold text-white">End Active Focus Session?</h3>
          <p className="text-xs sm:text-sm text-platinum/65 leading-relaxed">
            Your timer is currently running. Stop and discard this sprint, or minimize it to keep counting down while browsing EnerGoals.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => {
              setShowExitConfirm(false);
              setIsMinimized(true);
            }}
            className="btn-secondary flex-1 py-2.5 text-xs font-bold"
          >
            Minimize
          </button>
          <button
            type="button"
            onClick={confirmAndExit}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Stop & Exit
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowExitConfirm(false)}
          className="w-full text-center text-xs text-platinum/40 hover:text-white transition-colors cursor-pointer"
        >
          Keep Focusing
        </button>
      </div>
    </div>
  );

  // Minimized Floating Pill Widget (visible across all routes when minimized)
  if (isMinimized) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 right-3 sm:right-6 z-50 glass-panel border border-primary/40 p-2.5 sm:p-3 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center gap-2.5 sm:gap-3 bg-bg-dark/95 backdrop-blur-xl"
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base",
            sessionMode === 'focus' ? "bg-primary/20 text-primary border border-primary/30" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
          )}>
            {targetHabit?.emoji || (sessionMode === 'focus' ? '⚡' : '☕')}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white max-w-[120px] truncate">
                {targetHabit?.name || (sessionMode === 'focus' ? 'Deep Work' : 'Break')}
              </span>
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-bold text-platinum tracking-wider">
                {formatTime(remainingSeconds)}
              </span>
              {soundPlayerState.currentTrackId !== 'off' && (
                <div className="w-14 h-3 opacity-70">
                  <FocusWaveformVisualizer
                    variant="ambient"
                    showTrackLabel={false}
                    className="w-full h-full py-0 px-0"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-1">
            {soundPlayerState.currentTrackId !== 'off' && (
              <button
                onClick={() => {
                  playSound('click');
                  focusSoundscapePlayer.togglePlayPause();
                }}
                className={cn(
                  "p-2.5 rounded-xl border transition-all cursor-pointer",
                  soundPlayerState.isPlaying
                    ? "bg-primary/20 text-primary border-primary/40 shadow-[0_0_12px_rgba(177,74,224,0.4)]"
                    : "bg-white/5 text-platinum/50 hover:text-white border-white/5"
                )}
                title={soundPlayerState.isPlaying ? "Pause Soundscape" : "Resume Soundscape"}
              >
                {soundPlayerState.isPlaying ? (
                  <Headphones className="w-4 h-4 animate-pulse" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              onClick={handleToggleTimer}
              className={cn(
                "p-2.5 rounded-xl text-white font-bold transition-transform active:scale-90 cursor-pointer",
                isRunning ? "bg-warning text-bg-dark" : "bg-primary hover:bg-primary-deep"
              )}
              title={isRunning ? "Pause" : "Start"}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={() => setIsMinimized(false)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-platinum transition-colors border border-white/5 cursor-pointer"
              title="Expand Full Focus Overlay"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleExitOverlay}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-platinum/40 hover:text-red-400 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
        {exitConfirmDialog}
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0B0B0E]/95 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto pt-[env(safe-area-inset-top,0px)] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      id="focus-session-overlay"
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP BAR */}
      <div className="relative z-20 w-full max-w-5xl mx-auto p-3.5 sm:p-6 flex items-center justify-between gap-3 sm:gap-4">
        <div className="relative">
          <button
            onClick={() => setShowHabitMenu(!showHabitMenu)}
            disabled={isRunning}
            className={cn(
              "px-3.5 py-2 rounded-xl glass-panel border flex items-center gap-2.5 transition-all text-xs font-bold",
              isRunning ? "opacity-75 cursor-default border-white/10" : "hover:border-primary/40 cursor-pointer border-white/10 bg-white/5 text-white"
            )}
          >
            <span className="text-base">{targetHabit?.emoji || '🎯'}</span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-platinum/40">Tracking Habit</span>
              <span className="text-xs font-bold text-white max-w-[140px] sm:max-w-[200px] truncate">
                {targetHabit?.name || 'Freeform Deep Work'}
              </span>
            </div>
            {!isRunning && <ChevronDown className="w-3.5 h-3.5 text-platinum/40" />}
          </button>

          <AnimatePresence>
            {showHabitMenu && !isRunning && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 w-72 glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl bg-bg-dark z-50 max-h-80 overflow-y-auto"
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-platinum/40">
                  Select Habit for Deep Work
                </div>
                <button
                  onClick={() => {
                    setSelectedHabitId('');
                    setShowHabitMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all text-xs cursor-pointer",
                    !selectedHabitId ? "bg-primary/20 text-white font-bold" : "hover:bg-white/5 text-platinum/70"
                  )}
                >
                  <span>⚡</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">Freeform Deep Work</div>
                    <div className="text-[10px] text-platinum/40">Non-habit focus sprint</div>
                  </div>
                </button>

                {habits.filter(h => !h.isArchived && !h.isPaused).map(h => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setSelectedHabitId(h.id);
                      setShowHabitMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all text-xs cursor-pointer",
                      selectedHabitId === h.id ? "bg-primary/20 text-white font-bold" : "hover:bg-white/5 text-platinum/70"
                    )}
                  >
                    <span className="text-base">{h.emoji || '🎯'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-white">{h.name}</div>
                      <div className="text-[10px] text-platinum/40 flex items-center gap-1.5">
                        <span className="capitalize">{h.category}</span>
                        <span>•</span>
                        <span>{h.type}</span>
                      </div>
                    </div>
                    {selectedHabitId === h.id && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <button
            data-sound-trigger
            onClick={() => {
              playSound('click');
              setShowSoundMenu(!showSoundMenu);
            }}
            className={cn(
              "px-3 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none group",
              showSoundMenu
                ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(177,74,224,0.4)]"
                : soundPlayerState.currentTrackId !== 'off'
                ? soundPlayerState.isPlaying
                  ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(177,74,224,0.3)] hover:bg-primary/30"
                  : "bg-white/10 border-white/20 text-platinum hover:text-white"
                : "bg-white/5 border-white/5 text-platinum/60 hover:text-white hover:bg-white/10"
            )}
            title="Focus Soundscapes & Player"
          >
            <div className="flex items-center justify-center">
              {soundPlayerState.isPlaying ? (
                <span className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="w-0.5 h-3.5 bg-primary rounded-full animate-bounce" />
                  <span className="w-0.5 h-1.5 bg-primary rounded-full animate-pulse" />
                </span>
              ) : (
                <Music className="w-4 h-4 text-platinum/60 group-hover:text-primary transition-colors" />
              )}
            </div>

            <span className="hidden sm:inline font-semibold">
              {soundPlayerState.currentTrackId === 'off'
                ? 'Sound'
                : (SOUNDSCAPE_TRACKS.find(t => t.id === soundPlayerState.currentTrackId)?.label || 'Sound')}
            </span>

            {soundPlayerState.currentTrackId !== 'off' && (
              <span className={cn(
                "text-[9px] font-mono px-1.5 py-0.2 rounded font-bold transition-colors",
                soundPlayerState.isPlaying
                  ? "bg-primary/40 text-white border border-primary/40"
                  : "bg-white/10 text-platinum/60"
              )}>
                {soundPlayerState.isMuted ? 'MUTE' : `${Math.round(soundPlayerState.volume * 100)}%`}
              </span>
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-platinum/60 hover:text-white transition-all border border-white/5 cursor-pointer hidden md:flex"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-platinum/60 hover:text-white transition-all border border-white/5 cursor-pointer"
            title="Minimize to Floating Bar"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleExitOverlay}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-platinum/40 hover:text-red-400 transition-all border border-white/5 cursor-pointer"
            title="Exit Focus Session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER WORKSPACE */}
      <div className="relative z-20 w-full max-w-xl mx-auto px-4 py-4 flex flex-col items-center justify-center flex-1 space-y-6">
        <div className="p-1 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-1 shadow-inner">
          <button
            onClick={() => handleSwitchMode('focus')}
            className={cn(
              "px-5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
              sessionMode === 'focus'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "text-platinum/40 hover:text-platinum"
            )}
          >
            <Zap className="w-3.5 h-3.5" /> Deep Work
          </button>
          <button
            onClick={() => handleSwitchMode('break')}
            className={cn(
              "px-5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
              sessionMode === 'break'
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                : "text-platinum/40 hover:text-platinum"
            )}
          >
            <Coffee className="w-3.5 h-3.5" /> Break Time
          </button>
        </div>

        {/* Circular Dial */}
        <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] max-w-[85vw] max-h-[85vw] flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 320 320">
            <circle
              cx="160"
              cy="160"
              r={strokeRadius}
              stroke="currentColor"
              strokeWidth="10"
              className="text-white/5"
              fill="transparent"
            />
            <circle
              cx="160"
              cy="160"
              r={strokeRadius}
              stroke="url(#focusGradient)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-linear"
            />
            <defs>
              <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                {sessionMode === 'focus' ? (
                  <>
                    <stop offset="0%" stopColor="#B14AE0" />
                    <stop offset="100%" stopColor="#8A2BE2" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </>
                )}
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none">
            <div className={cn(
              "px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-2 border",
              isRunning
                ? (sessionMode === 'focus' ? "bg-primary/20 text-primary border-primary/40 animate-pulse" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 animate-pulse")
                : "bg-white/5 text-platinum/40 border-white/5"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", isRunning ? "bg-emerald-400" : "bg-platinum/40")} />
              {isRunning ? (sessionMode === 'focus' ? 'FLOWING' : 'RESTING') : 'READY'}
            </div>

            <div className="text-5xl sm:text-6xl font-mono font-black text-white tracking-tighter tabular-nums">
              {formatTime(remainingSeconds)}
            </div>

            <div className="mt-2 text-xs font-semibold text-platinum/60 flex items-center gap-2">
              {targetHabit ? (
                <>
                  <span className="flex items-center gap-1 text-platinum/80">
                    <span>{targetHabit.emoji}</span>
                    <span className="max-w-[120px] truncate">{targetHabit.name}</span>
                  </span>
                  <span>•</span>
                  <span className="text-primary font-bold">
                    +{getHabitXP(targetHabit)} XP
                  </span>
                </>
              ) : (
                <span className="text-platinum/50">
                  {targetMinutes} min session • +{targetMinutes * 2} XP
                </span>
              )}
            </div>

            {sessionMode === 'focus' && (
              <button
                onClick={() => {
                  setDistractionCount(prev => prev + 1);
                  playSound('click');
                }}
                className="mt-3 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/10 text-platinum/40 hover:text-amber-300 border border-white/5 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Log a momentary distraction and refocus"
              >
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Distractions: {distractionCount}</span>
              </button>
            )}

            {soundPlayerState.currentTrackId !== 'off' && (
              <div className="mt-2 w-36 h-4 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                <FocusWaveformVisualizer
                  variant="ambient"
                  showTrackLabel={false}
                  className="w-full h-full py-0 px-0"
                />
              </div>
            )}
          </div>
        </div>

        {/* Preset Duration Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
          {(sessionMode === 'focus' ? PRESETS : BREAK_PRESETS).map((p) => (
            <button
              key={p.minutes}
              onClick={() => {
                setTargetMinutes(p.minutes);
                setRemainingSeconds(p.minutes * 60);
                setElapsedFocusSeconds(0);
                playSound('click');
              }}
              disabled={isRunning}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                targetMinutes === p.minutes
                  ? "bg-primary/20 border-primary text-white shadow-md shadow-primary/20"
                  : "bg-surface border-white/5 text-platinum/40 hover:text-platinum hover:border-white/10",
                isRunning && targetMinutes !== p.minutes && "opacity-40 pointer-events-none"
              )}
            >
              {p.minutes}m {sessionMode === 'focus' && (p as any).label && `• ${(p as any).label}`}
            </button>
          ))}
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleResetTimer}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-platinum/60 hover:text-white transition-all border border-white/5 cursor-pointer active:scale-95"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleToggleTimer}
            className={cn(
              "px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all transform active:scale-95 cursor-pointer shadow-xl",
              isRunning
                ? "bg-warning text-bg-dark hover:bg-warning/90 shadow-warning/20"
                : (sessionMode === 'focus'
                    ? "bg-primary hover:bg-primary-deep text-white shadow-primary/30"
                    : "bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/30")
            )}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Start Focus
              </>
            )}
          </button>

          <button
            onClick={() => handleCompleteSession(false)}
            disabled={elapsedFocusSeconds < 15}
            className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all border border-emerald-500/30 cursor-pointer disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            title={elapsedFocusSeconds < 15 ? "Focus for at least 15 seconds to log progress" : "Finish & Save Deep Work Progress"}
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleAdjustSeconds(-60)}
            disabled={remainingSeconds <= 60}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-platinum/50 hover:text-platinum text-[10px] font-bold border border-white/5 transition-colors cursor-pointer disabled:opacity-30"
          >
            -1m
          </button>
          <button
            onClick={() => handleAdjustSeconds(60)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-platinum/50 hover:text-platinum text-[10px] font-bold border border-white/5 transition-colors cursor-pointer"
          >
            +1m
          </button>
          <button
            onClick={() => handleAdjustSeconds(300)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-platinum/50 hover:text-platinum text-[10px] font-bold border border-white/5 transition-colors cursor-pointer"
          >
            +5m
          </button>
        </div>

        <div className="w-full max-w-sm pt-1">
          <FocusWaveformVisualizer
            variant="compact"
            showTrackLabel={true}
          />
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div className="relative z-20 w-full max-w-xl mx-auto p-4 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={quoteIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5 }}
            className="text-xs text-platinum/40 italic font-medium max-w-md mx-auto"
          >
            "{DEEP_WORK_QUOTES[quoteIndex]}"
          </motion.p>
        </AnimatePresence>
      </div>

      {/* COMPLETION & CELEBRATION MODAL OVERLAY */}
      <AnimatePresence>
        {sessionFinished && finishedSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-dark/95 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-primary/30 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-4xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                {finishedSummary.habitEmoji || '🎉'}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-widest mb-2 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> Session Completed!
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Deep Work Logged
                </h3>
                <p className="text-sm text-platinum/60">
                  You stayed on task for <span className="font-bold text-white">{finishedSummary.totalMinutesFocused} minutes</span> on <span className="text-primary font-bold">{finishedSummary.habitName}</span>.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="p-2">
                  <div className="text-[10px] font-bold text-platinum/40 uppercase">Time</div>
                  <div className="text-base font-bold text-white">{finishedSummary.totalMinutesFocused}m</div>
                </div>
                <div className="p-2 border-x border-white/5">
                  <div className="text-[10px] font-bold text-platinum/40 uppercase">XP Gained</div>
                  <div className="text-base font-bold text-primary">+{finishedSummary.xpEarned}</div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] font-bold text-platinum/40 uppercase">Distractions</div>
                  <div className="text-base font-bold text-amber-400">{distractionCount}</div>
                </div>
              </div>

              <div className="text-left space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-platinum/40 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Deep Work Note (Optional)
                </label>
                <input
                  type="text"
                  value={reflectionNote}
                  onChange={(e) => setReflectionNote(e.target.value)}
                  placeholder="What breakthrough did you achieve?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white placeholder:text-platinum/30 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setSessionFinished(false);
                    setReflectionNote('');
                    handleSwitchMode('break');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-all border border-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Coffee className="w-4 h-4" /> Take Break
                </button>
                <button
                  onClick={() => {
                    setSessionFinished(false);
                    setReflectionNote('');
                    setElapsedFocusSeconds(0);
                    setRemainingSeconds(targetMinutes * 60);
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-deep text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FocusSoundscapePanel
        isOpen={showSoundMenu}
        onClose={() => setShowSoundMenu(false)}
        sessionMode={sessionMode}
        remainingSeconds={remainingSeconds}
      />

      {exitConfirmDialog}
    </motion.div>
  );
};
