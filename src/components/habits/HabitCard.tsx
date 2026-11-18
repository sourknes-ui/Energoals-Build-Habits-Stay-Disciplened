import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Clock, 
  Flame, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Archive, 
  Sparkles, 
  Check, 
  Target,
  Zap,
  TrendingUp,
  Pin,
  PinOff
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Habit } from '../../types';
import { calculateProgressPercent, getHabit24HourCycleStatus } from '../../lib/habitUtils';
import { HabitCheckbox } from './HabitCheckbox';
import { DeleteHabitConfirmModal } from './DeleteHabitConfirmModal';
import { 
  getHabitXP, 
  inferHabitDifficulty, 
  DIFFICULTY_COLORS, 
  getRandomMotivationalQuote 
} from '../../lib/progressionEngine';

interface HabitCardProps {
  habit: Habit;
  onUpdateProgress: (id: string, newValue: number) => void;
  onToggle: (id: string, e?: React.MouseEvent) => void;
  onEdit?: (habit: Habit, e?: React.MouseEvent) => void;
  onDelete?: (id: string, e?: React.MouseEvent) => void;
  onPause?: (id: string, e?: React.MouseEvent) => void;
  onArchive?: (id: string, e?: React.MouseEvent) => void;
  onStartFocus?: (habit: Habit) => void;
  onTogglePin?: (id: string, e?: React.MouseEvent) => void;
  isPinned?: boolean;
  layoutMode?: 'card' | 'list';
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onUpdateProgress,
  onToggle,
  onEdit,
  onDelete,
  onPause,
  onArchive,
  onStartFocus,
  onTogglePin,
  isPinned = false,
  layoutMode = 'card'
}) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(() => Math.round((habit.currentValue || 0) * 60));
  const [showMenu, setShowMenu] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const [popKey, setPopKey] = useState(0);
  const [celebrationQuote, setCelebrationQuote] = useState('');
  const [showLocalDeleteModal, setShowLocalDeleteModal] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const prevCompletedRef = useRef<boolean>(habit.completedToday);

  const onUpdateProgressRef = useRef(onUpdateProgress);
  onUpdateProgressRef.current = onUpdateProgress;

  const habitIdRef = useRef(habit.id);
  habitIdRef.current = habit.id;

  const targetVal = Math.max(1, habit.targetValue || (habit.type === 'timing' ? 15 : habit.type === 'quantitative' ? 10 : 1));
  const currentVal = Math.max(0, habit.currentValue || 0);
  const isCompleted = habit.completedToday || (habit.type !== 'binary' && currentVal >= targetVal);
  const unit = habit.unit || (habit.type === 'timing' ? 'min' : habit.type === 'quantitative' ? 'count' : '');
  const progressPercent = calculateProgressPercent(habit);

  const difficulty = habit.difficulty || inferHabitDifficulty(habit);
  const habitXP = getHabitXP(habit);
  const diffStyle = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.Medium;

  // Live 24-hour cycle refresh ticker
  const [tickerTime, setTickerTime] = useState<number>(Date.now());
  useEffect(() => {
    if (!isCompleted) return;
    const interval = setInterval(() => {
      setTickerTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const cycleStatus = getHabit24HourCycleStatus(habit, new Date(tickerTime));

  // Trigger subtle pop & celebration animation on transition from incomplete -> complete
  useEffect(() => {
    if (!prevCompletedRef.current && isCompleted) {
      setCelebrationQuote(getRandomMotivationalQuote());
      setShowCelebration(true);
      setIsPopping(true);
      setPopKey(prev => prev + 1);

      const popTimer = setTimeout(() => {
        setIsPopping(false);
      }, 650);

      const celebTimer = setTimeout(() => {
        setShowCelebration(false);
      }, 4000);

      return () => {
        clearTimeout(popTimer);
        clearTimeout(celebTimer);
      };
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);

  // Synchronize local timer seconds when habit currentValue updates externally while timer is NOT active
  useEffect(() => {
    if (!isTimerRunning) {
      setTimerSeconds(Math.round((habit.currentValue || 0) * 60));
    }
  }, [habit.currentValue, isTimerRunning]);

  // Clean timer interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Live timer runner
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prevSec => {
          const newSec = prevSec + 1;
          const targetSec = targetVal * 60;

          // Check if habit just reached target time
          if (prevSec < targetSec && newSec >= targetSec) {
            const minutesDone = Number((newSec / 60).toFixed(1));
            onUpdateProgressRef.current(habitIdRef.current, minutesDone);
            lastSyncTimeRef.current = Date.now();
          } 
          // Periodic background sync every 10 seconds so progress is preserved
          else if (Date.now() - lastSyncTimeRef.current >= 10000) {
            const minutesDone = Number((newSec / 60).toFixed(1));
            onUpdateProgressRef.current(habitIdRef.current, minutesDone);
            lastSyncTimeRef.current = Date.now();
          }

          return newSec;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, targetVal]);

  // Handle outside click & escape key for dropdown menu
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && 
        !menuRef.current.contains(target) &&
        buttonRef.current && 
        !buttonRef.current.contains(target)
      ) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Auto-reposition: open upward if less than 220px below
      setOpenUpward(spaceBelow < 220 && rect.top > 220);
    }
    setShowMenu(prev => !prev);
  };

  const handleStartPauseTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTimerRunning) {
      setIsTimerRunning(false);
      const minutesDone = Number((timerSeconds / 60).toFixed(1));
      onUpdateProgress(habit.id, minutesDone);
    } else {
      setIsTimerRunning(true);
      lastSyncTimeRef.current = Date.now();
    }
  };

  const handleResetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTimerRunning(false);
    setTimerSeconds(0);
    onUpdateProgress(habit.id, 0);
  };

  const handleAddMinutes = (mins: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSeconds = Math.max(0, timerSeconds + mins * 60);
    setTimerSeconds(newSeconds);
    const newMins = Number((newSeconds / 60).toFixed(1));
    onUpdateProgress(habit.id, newMins);
  };

  const handleCountChange = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = Math.max(0, currentVal + delta);
    onUpdateProgress(habit.id, nextVal);
  };

  const formatMMSS = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={isPopping ? { 
        opacity: 1, 
        y: [0, -3.5, 1, -0.5, 0],
        scale: [1, 1.026, 0.988, 1.008, 1],
      } : { 
        opacity: 1, 
        y: showCelebration ? -2 : 0,
        scale: 1
      }}
      transition={isPopping ? { 
        duration: 0.55, 
        ease: [0.22, 1, 0.36, 1] 
      } : { 
        duration: 0.35, 
        ease: "easeOut" 
      }}
      exit={{ opacity: 0, y: -15 }}
      className={cn(
        "glass-panel p-5 md:p-6 rounded-2xl border transition-all duration-300 group relative",
        showMenu ? "z-50 overflow-visible" : "z-0 overflow-hidden",
        isCompleted 
          ? "border-emerald-500/40 bg-emerald-950/15 shadow-[0_0_25px_rgba(16,185,129,0.18)]" 
          : "border-white/5 hover:border-white/10",
        habit.isPaused && "opacity-60 grayscale"
      )}
    >
      {/* Subtle Expanding Pop Aura Ring on Completion */}
      <AnimatePresence>
        {isPopping && (
          <motion.div
            key={`pop-halo-${popKey}`}
            initial={{ opacity: 0.85, scale: 0.98 }}
            animate={{ opacity: 0, scale: 1.024 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/60 bg-emerald-500/10 pointer-events-none z-20 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
          />
        )}
      </AnimatePresence>

      {/* Floating XP Reward Burst Pop Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: [10, -10, -20, -32], 
              scale: [0.5, 1.25, 1.05, 0.92] 
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              duration: 1.6, 
              times: [0, 0.2, 0.7, 1], 
              ease: "easeOut" 
            }}
            className="absolute top-4 right-14 z-30 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(16,185,129,0.6)]"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white animate-spin" />
            <span>+{habitXP} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Row */}
      <div className={cn(
        "flex items-start justify-between gap-3 relative transition-all",
        showMenu ? "z-40" : "z-10"
      )}>
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Quick Checkbox Micro-Interaction */}
          <div className="shrink-0">
            <HabitCheckbox
              id={`habit-checkbox-${habit.id}`}
              variant="checkbox"
              checked={isCompleted}
              onToggle={(e) => onToggle(habit.id, e)}
              size="md"
            />
          </div>

          {/* Main Icon / Emoji with Completion spring pop */}
          <motion.div 
            animate={isPopping ? { 
              scale: [1, 1.3, 0.92, 1.08, 1],
              rotate: [0, -8, 8, -2, 0]
            } : { 
              scale: 1, 
              rotate: 0 
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-all shrink-0",
              isCompleted 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                : "bg-white/5 text-platinum/60 border border-white/5"
            )}
          >
            {habit.emoji || '✨'}
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "text-lg font-bold truncate transition-all",
                isCompleted ? "text-emerald-300" : "text-white"
              )}>
                {habit.name}
              </h3>
              
              {/* Difficulty & XP Badge */}
              <span className={cn(
                "px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1",
                diffStyle.bg, diffStyle.text, diffStyle.border
              )}>
                <Zap className="w-2.5 h-2.5" />
                {difficulty} • +{habitXP} XP
              </span>

              {isCompleted && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <motion.span 
                    key={`done-badge-${habit.id}`}
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: [0.2, 1.25, 0.92, 1], opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shrink-0 flex items-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" /> Done
                  </motion.span>
                  {cycleStatus.timeRemainingFormatted && (
                    <span 
                      className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold shrink-0 flex items-center gap-1"
                      title="24-Hour Cycle: This habit automatically resets 24 hours after completion so you can complete it again. All XP and history are permanently kept."
                    >
                      <Clock className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Refreshes in {cycleStatus.timeRemainingFormatted}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-platinum/40">
                {habit.category}
              </span>
              <span className="text-platinum/20">•</span>
              <span className="text-[10px] font-bold text-platinum/40 capitalize">
                {habit.frequency}
              </span>
              {habit.timeOfDay && habit.timeOfDay !== 'Anytime' && (
                <>
                  <span className="text-platinum/20">•</span>
                  <span className="text-[10px] font-bold text-platinum/40">
                    {habit.timeOfDay}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right Streak & Action Menu */}
        <div className="flex items-center gap-2">
          {(isPinned || habit.isPinned) && (
            <div 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-bold shrink-0"
              title="Pinned to Smart Widgets Top 3"
            >
              <Pin className="w-3 h-3 fill-primary" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-mono">Top 3</span>
            </div>
          )}

          {habit.streak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs font-bold shrink-0">
              <Flame className="w-3.5 h-3.5 fill-warning" />
              <span>{habit.streak}d</span>
            </div>
          )}

          {/* Three-Dot Action Menu Container */}
          <div className="relative z-50" ref={menuContainerRef}>
            <button 
              ref={buttonRef}
              type="button"
              aria-label={`Options for ${habit.name}`}
              aria-expanded={showMenu}
              aria-haspopup="true"
              onClick={handleToggleMenu}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50",
                showMenu 
                  ? "bg-white/15 text-white shadow-sm" 
                  : "hover:bg-white/5 text-platinum/40 hover:text-platinum"
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  ref={menuRef}
                  role="menu"
                  aria-label="Habit actions"
                  initial={{ opacity: 0, scale: 0.95, y: openUpward ? 6 : -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: openUpward ? 6 : -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={cn(
                    "absolute right-0 w-48 bg-[#161622] border border-white/10 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] p-1.5 z-50 backdrop-blur-xl pointer-events-auto select-none",
                    openUpward 
                      ? "bottom-full mb-1.5 origin-bottom-right" 
                      : "top-full mt-1.5 origin-top-right"
                  )}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  {/* Item 1: Focus Session */}
                  <button 
                    type="button"
                    role="menuitem"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(false);
                      if (onStartFocus) {
                        onStartFocus(habit);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-platinum/90 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center gap-2.5 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-primary/50 select-none"
                  >
                    <Zap className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
                    <span className="flex-1">Focus Session</span>
                  </button>

                  {/* Item 2: Edit Habit */}
                  <button 
                    type="button"
                    role="menuitem"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(false);
                      if (onEdit) {
                        onEdit(habit, e);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-platinum/90 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center gap-2.5 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-primary/50 select-none"
                  >
                    <Edit2 className="w-4 h-4 text-platinum/60 group-hover:text-primary shrink-0 transition-colors" />
                    <span className="flex-1">Edit Habit</span>
                  </button>

                  {/* Item 3: Pin to Smart Widgets Top 3 */}
                  {onTogglePin && (
                    <button 
                      type="button"
                      role="menuitem"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMenu(false);
                        onTogglePin(habit.id, e);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-platinum/90 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center gap-2.5 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-primary/50 select-none"
                    >
                      {(isPinned || habit.isPinned) ? (
                        <>
                          <PinOff className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
                          <span className="flex-1">Unpin from Top 3</span>
                        </>
                      ) : (
                        <>
                          <Pin className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
                          <span className="flex-1">Pin to Smart Widgets</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Item 4: Mark Complete / Mark Incomplete */}
                  <button 
                    type="button"
                    role="menuitem"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(false);
                      onToggle(habit.id, e);
                    }}
                    className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-platinum/90 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center gap-2.5 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-primary/50 select-none"
                  >
                    {isCompleted ? (
                      <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0 transition-transform group-hover:-rotate-45" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 transition-transform group-hover:scale-110" />
                    )}
                    <span className="flex-1">
                      {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="my-1 border-t border-white/5" />

                  {/* Item 4: Delete */}
                  <button 
                    type="button"
                    role="menuitem"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(false);
                      if (onDelete) {
                        onDelete(habit.id, e);
                      } else {
                        setShowLocalDeleteModal(true);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/15 active:bg-red-500/25 border border-transparent hover:border-red-500/25 flex items-center gap-2.5 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-red-500/50 select-none"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="flex-1 font-semibold">Delete</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Dynamic Celebration & Motivation Banner */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 pt-2.5 pb-1 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> GOOD JOB!
              </span>
              <span className="text-xs text-platinum/70 italic truncate">
                {celebrationQuote || "Consistency is building your future."}
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {cycleStatus.timeRemainingFormatted && (
                <span className="text-[10px] text-emerald-300/80 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Refreshes in {cycleStatus.timeRemainingFormatted}
                </span>
              )}
              <span className="text-[11px] font-extrabold text-emerald-400">
                +{habitXP} XP
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interactive Controls by Habit Type */}
      <div className="mt-4 pt-3 border-t border-white/5 relative z-0 space-y-3">
        
        {/* TYPE 1: YES / NO (Binary) */}
        {habit.type === 'binary' && (
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-platinum/50 flex items-center gap-1.5">
              <span className="text-platinum/40">Reward:</span>
              <span className="font-bold text-primary">+{habitXP} XP</span>
            </div>
            <HabitCheckbox
              id={`habit-btn-${habit.id}`}
              variant="button"
              checked={isCompleted}
              onToggle={(e) => onToggle(habit.id, e)}
              label={isCompleted ? "Completed" : "Mark Complete"}
            />
          </div>
        )}

        {/* TYPE 2: COUNT (Quantitative) */}
        {habit.type === 'quantitative' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-display font-bold text-white">
                  {currentVal}
                </span>
                <span className="text-xs text-platinum/40 font-bold">
                  / {targetVal} {unit}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentVal <= 0}
                  onClick={(e) => handleCountChange(-1, e)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-platinum/60 hover:text-white transition-all border border-white/5 cursor-pointer"
                  title="Decrease by 1"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleCountChange(1, e)}
                  className="w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/30 flex items-center justify-center text-primary hover:text-white transition-all border border-primary/30 font-bold text-sm cursor-pointer"
                  title="Add 1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleCountChange(5, e)}
                  className="px-2.5 h-8 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary text-[10px] font-bold transition-all border border-white/5 text-platinum/60 cursor-pointer"
                  title="Add 5"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    isCompleted 
                      ? "bg-gradient-to-r from-emerald-400 to-teal-400" 
                      : "bg-gradient-to-r from-primary to-primary-deep"
                  )}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-platinum/40 font-bold">
                <span>{progressPercent}% completed</span>
                <span className="text-primary font-bold">+{habitXP} XP</span>
              </div>
            </div>
          </div>
        )}

        {/* TYPE 3: TIMER (Timing) */}
        {habit.type === 'timing' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-2xl font-mono font-bold tracking-tight",
                  isTimerRunning ? "text-primary animate-pulse" : "text-white"
                )}>
                  {formatMMSS(timerSeconds)}
                </span>
                <span className="text-xs text-platinum/40 font-bold">
                  / {targetVal} {unit}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onStartFocus && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartFocus(habit);
                    }}
                    className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary hover:text-white transition-all border border-primary/30 cursor-pointer"
                    title="Launch Fullscreen Deep Work Focus Session"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleStartPauseTimer}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer",
                    isTimerRunning
                      ? "bg-warning text-bg-dark font-black shadow-warning/20"
                      : isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white"
                        : "bg-primary text-white hover:bg-primary-deep shadow-primary/20"
                  )}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> {timerSeconds > 0 ? 'Resume' : 'Start'}
                    </>
                  )}
                </button>

                {timerSeconds > 0 && (
                  <button
                    onClick={handleResetTimer}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-platinum/40 hover:text-platinum transition-colors border border-white/5 cursor-pointer"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Time Add Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => handleAddMinutes(1, e)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-platinum/60 hover:text-platinum transition-colors cursor-pointer"
                >
                  +1m
                </button>
                <button
                  onClick={(e) => handleAddMinutes(5, e)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-platinum/60 hover:text-platinum transition-colors cursor-pointer"
                >
                  +5m
                </button>
                <button
                  onClick={(e) => handleAddMinutes(15, e)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-platinum/60 hover:text-platinum transition-colors cursor-pointer"
                >
                  +15m
                </button>
              </div>

              <span className="text-[10px] text-platinum/40 font-bold">
                Reward: <span className="text-primary font-bold">+{habitXP} XP</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  isCompleted 
                    ? "bg-gradient-to-r from-emerald-400 to-teal-400" 
                    : "bg-gradient-to-r from-primary to-primary-deep"
                )}
              />
            </div>
          </div>
        )}

      </div>

      {/* Local fallback confirmation modal if parent did not handle */}
      <AnimatePresence>
        {showLocalDeleteModal && (
          <DeleteHabitConfirmModal
            isOpen={showLocalDeleteModal}
            habit={habit}
            onClose={() => setShowLocalDeleteModal(false)}
            onConfirm={() => {
              if (onDelete) {
                onDelete(habit.id);
              }
              setShowLocalDeleteModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
