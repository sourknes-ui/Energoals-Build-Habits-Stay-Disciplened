import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pin, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Minus, 
  Clock, 
  Flame, 
  Zap, 
  SlidersHorizontal, 
  RotateCcw,
  Play,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Habit } from '../../types';
import { cn } from '../../lib/utils';
import { calculateProgressPercent, getHabit24HourCycleStatus } from '../../lib/habitUtils';
import { DIFFICULTY_COLORS, inferHabitDifficulty, getHabitXP } from '../../lib/progressionEngine';
import { playSound } from '../../lib/audio';
import { PinHabitsModal } from './PinHabitsModal';

interface SmartWidgetsAreaProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  toggleHabit: (id: string, e?: React.MouseEvent) => void;
  onUpdateHabitProgress?: (id: string, newValue: number) => void;
  pinnedHabitIds?: string[];
  onTogglePinHabit?: (id: string) => void;
  onSavePinnedHabits?: (ids: string[]) => void;
  onStartFocus?: (habit: Habit) => void;
  onOpenCreateHabit?: () => void;
}

export const SmartWidgetsArea: React.FC<SmartWidgetsAreaProps> = ({
  habits,
  setHabits,
  toggleHabit,
  onUpdateHabitProgress,
  pinnedHabitIds: propPinnedHabitIds,
  onTogglePinHabit,
  onSavePinnedHabits,
  onStartFocus,
}) => {
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [popCardId, setPopCardId] = useState<string | null>(null);

  // Active unarchived/unpaused habits
  const activeHabits = habits.filter(h => !h.isArchived && !h.isPaused);

  // Fallback local state only if centralized prop isn't passed
  const [fallbackPinnedIds, setFallbackPinnedIds] = useState<string[]>(() => {
    const explicitPinned = habits.filter(h => h.isPinned).map(h => h.id);
    if (explicitPinned.length > 0) return explicitPinned.slice(0, 3);
    const sorted = [...activeHabits].sort((a, b) => {
      const diffOrder: Record<string, number> = { 'Very Hard': 4, 'Hard': 3, 'Medium': 2, 'Easy': 1 };
      const diffA = diffOrder[a.difficulty || inferHabitDifficulty(a)] || 2;
      const diffB = diffOrder[b.difficulty || inferHabitDifficulty(b)] || 2;
      if (diffA !== diffB) return diffB - diffA;
      return (b.streak || 0) - (a.streak || 0);
    });
    return sorted.slice(0, 3).map(h => h.id);
  });

  const pinnedHabitIds = propPinnedHabitIds !== undefined ? propPinnedHabitIds.slice(0, 3) : fallbackPinnedIds;

  // Sync pinned list with centralized App state or fallback
  const savePinnedHabits = (newPinnedIds: string[]) => {
    const validIds = newPinnedIds.slice(0, 3);
    if (onSavePinnedHabits) {
      onSavePinnedHabits(validIds);
    } else {
      setFallbackPinnedIds(validIds);
      setHabits(prev => prev.map(h => ({
        ...h,
        isPinned: validIds.includes(h.id),
        pinnedPriority: validIds.indexOf(h.id) >= 0 ? validIds.indexOf(h.id) + 1 : undefined
      })));
    }
  };

  // Resolve habit items for the 3 slots
  const pinnedHabits = pinnedHabitIds
    .map(id => activeHabits.find(h => h.id === id))
    .filter(Boolean) as Habit[];

  const completedCount = pinnedHabits.filter(h => h.completedToday).length;
  const totalPinned = pinnedHabits.length;

  const handleQuickToggle = (habit: Habit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPopCardId(habit.id);
    setTimeout(() => setPopCardId(null), 600);

    toggleHabit(habit.id, e);
  };

  const handleStepProgress = (habit: Habit, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentVal = habit.currentValue || 0;
    const targetVal = habit.targetValue || (habit.type === 'timing' ? 15 : habit.type === 'quantitative' ? 10 : 1);
    const nextVal = Math.max(0, currentVal + delta);
    
    if (onUpdateHabitProgress) {
      onUpdateHabitProgress(habit.id, nextVal);
    } else {
      setHabits(prev => prev.map(h => h.id === habit.id ? { 
        ...h, 
        currentValue: nextVal, 
        completedToday: nextVal >= targetVal 
      } : h));
    }

    if (nextVal >= targetVal && !habit.completedToday) {
      playSound('accomplishment');
      setPopCardId(habit.id);
      setTimeout(() => setPopCardId(null), 600);
    } else {
      playSound('click');
    }
  };

  const unpinSlot = (habitId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onTogglePinHabit) {
      onTogglePinHabit(habitId);
    } else {
      const updated = pinnedHabitIds.filter(id => id !== habitId);
      savePinnedHabits(updated);
    }
  };

  // If there are zero active habits at all, render nothing
  if (activeHabits.length === 0) {
    return null;
  }

  const slotMetadata = [
    {
      slotNum: 1,
      name: '#1 Keystone',
      badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
      glowBorder: 'hover:border-amber-400/40 focus-within:border-amber-400/40',
      accentColor: '#F59E0B'
    },
    {
      slotNum: 2,
      name: '#2 Critical',
      badgeBg: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
      glowBorder: 'hover:border-purple-400/40 focus-within:border-purple-400/40',
      accentColor: '#A855F7'
    },
    {
      slotNum: 3,
      name: '#3 Focus',
      badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
      glowBorder: 'hover:border-emerald-400/40 focus-within:border-emerald-400/40',
      accentColor: '#10B981'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Smart Widgets Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4 fill-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              <span>Smart Widgets</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 tracking-wider">
                Daily Critical 3
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-platinum/60">
            Your top three keystone habits for today. One-tap quick toggling with zero friction.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {totalPinned > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-platinum/70">
              <span className="text-platinum/40">Progress:</span>
              <span className={cn(
                "font-bold font-mono",
                completedCount === totalPinned ? "text-emerald-400" : "text-white"
              )}>
                {completedCount}/{totalPinned} Done
              </span>
              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-500" 
                  style={{ width: `${totalPinned > 0 ? (completedCount / totalPinned) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCustomizeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-platinum/80 hover:text-white border border-white/10 hover:border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm touch-manipulation"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Customize Top 3</span>
          </button>
        </div>
      </div>

      {/* 3 Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {[0, 1, 2].map((slotIndex) => {
          const habitId = pinnedHabitIds[slotIndex];
          const habit = activeHabits.find(h => h.id === habitId);
          const slotMeta = slotMetadata[slotIndex];

          if (!habit) {
            return (
              <motion.div
                key={`empty-slot-${slotIndex}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: slotIndex * 0.08 }}
                onClick={() => setIsCustomizeModalOpen(true)}
                className="group relative p-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 bg-white/[0.02] hover:bg-primary/[0.03] transition-all flex flex-col justify-between items-center text-center cursor-pointer min-h-[190px]"
              >
                <div className="w-full flex items-center justify-between">
                  <span className={cn("text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border", slotMeta.badgeBg)}>
                    {slotMeta.name}
                  </span>
                  <span className="text-[10px] text-platinum/40">Unassigned</span>
                </div>

                <div className="my-auto flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-primary/20 group-hover:scale-110 flex items-center justify-center text-platinum/40 group-hover:text-primary transition-all">
                    <Pin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-primary-light transition-colors">
                      Pin Critical #{slotIndex + 1}
                    </div>
                    <div className="text-[11px] text-platinum/50 mt-0.5">
                      Select a priority habit to track here
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-primary group-hover:underline flex items-center gap-1">
                  <span>Choose Habit</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </motion.div>
            );
          }

          const targetVal = Math.max(1, habit.targetValue || (habit.type === 'timing' ? 15 : habit.type === 'quantitative' ? 10 : 1));
          const currentVal = Math.max(0, habit.currentValue || 0);
          const isCompleted = habit.completedToday || (habit.type !== 'binary' && currentVal >= targetVal);
          const progressPercent = calculateProgressPercent(habit);
          const difficulty = habit.difficulty || inferHabitDifficulty(habit);
          const diffStyle = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.Medium;
          const habitXP = getHabitXP(habit);
          const isPopping = popCardId === habit.id;
          const cycleStatus = isCompleted ? getHabit24HourCycleStatus(habit) : { timeRemainingFormatted: null };

          return (
            <motion.div
              key={`smart-widget-${habit.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: slotIndex * 0.08 }}
              className={cn(
                "relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between group overflow-hidden shadow-lg",
                isCompleted 
                  ? "bg-gradient-to-b from-[#142322] to-[#121920] border-emerald-500/40 shadow-emerald-950/20" 
                  : "bg-gradient-to-b from-[#181824] to-[#12121A] border-white/10 hover:border-white/20",
                slotMeta.glowBorder
              )}
            >
              {/* Pop halo animation */}
              <AnimatePresence>
                {isPopping && (
                  <motion.div
                    initial={{ opacity: 0.8, scale: 0.98 }}
                    animate={{ opacity: 0, scale: 1.03 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute -inset-1 rounded-2xl border-2 border-emerald-400 bg-emerald-500/15 pointer-events-none z-20"
                  />
                )}
              </AnimatePresence>

              {/* Top Slot & Status Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border", slotMeta.badgeBg)}>
                      {slotMeta.name}
                    </span>
                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", diffStyle.bg, diffStyle.text, diffStyle.border)}>
                      +{habitXP} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-[10px] font-bold">
                        <Flame className="w-3 h-3 fill-warning" />
                        <span>{habit.streak}d</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => unpinSlot(habit.id, e)}
                      title="Unpin from Smart Widgets"
                      className="p-1 rounded-lg text-platinum/30 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Pin className="w-3.5 h-3.5 fill-primary text-primary" />
                    </button>
                  </div>
                </div>

                {/* Habit Main Information */}
                <div className="flex items-start gap-3">
                  <motion.div 
                    animate={isPopping ? { scale: [1, 1.25, 0.95, 1.05, 1], rotate: [0, -6, 6, 0] } : { scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-colors",
                      isCompleted 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                        : "bg-white/5 border border-white/10"
                    )}
                  >
                    {habit.emoji || '✨'}
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <h3 className={cn(
                      "text-base font-bold truncate transition-colors",
                      isCompleted ? "text-emerald-300" : "text-white"
                    )}>
                      {habit.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-platinum/50 mt-0.5">
                      <span className="capitalize">{habit.category}</span>
                      <span>•</span>
                      <span className="capitalize">{habit.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Quick Toggle Controls */}
              <div className="mt-4 pt-3.5 border-t border-white/5">
                {/* 1. BINARY HABIT: Instant 1-tap full toggle */}
                {habit.type === 'binary' && (
                  <div>
                    <button
                      type="button"
                      onClick={(e) => handleQuickToggle(habit, e)}
                      className={cn(
                        "w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm touch-manipulation select-none active:scale-[0.98]",
                        isCompleted
                          ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10"
                          : "bg-primary hover:bg-primary-deep text-white border border-primary/60 shadow-primary/20"
                      )}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Completed Today</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-white/80 shrink-0" />
                          <span>Tap to Complete</span>
                        </>
                      )}
                    </button>

                    {isCompleted && cycleStatus.timeRemainingFormatted && (
                      <div className="text-[10px] text-emerald-400/80 font-medium text-center mt-2 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>Refreshes in {cycleStatus.timeRemainingFormatted}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. QUANTITATIVE HABIT: Stepper + Progress */}
                {habit.type === 'quantitative' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-platinum/60 font-semibold">Progress</span>
                      <span className="font-bold text-white font-mono">
                        {currentVal} / {targetVal} {habit.unit || 'units'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className={cn(
                          "h-full transition-all duration-300",
                          isCompleted ? "bg-emerald-400" : "bg-gradient-to-r from-primary to-accent-purple"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleStepProgress(habit, -1, e)}
                        disabled={currentVal <= 0}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-white border border-white/10 transition-colors"
                        title="Decrease by 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleStepProgress(habit, 1, e)}
                        className="flex-1 py-2 px-3 rounded-xl bg-primary/20 hover:bg-primary/30 active:bg-primary/40 text-primary hover:text-white font-bold text-xs border border-primary/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Increase by 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+1 {habit.unit || ''}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickToggle(habit, e)}
                        className={cn(
                          "p-2 rounded-xl border text-xs font-bold transition-all",
                          isCompleted 
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                            : "bg-white/5 hover:bg-emerald-500/20 text-platinum/60 hover:text-emerald-300 border-white/10"
                        )}
                        title={isCompleted ? "Reset progress" : "Mark completely done"}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isCompleted && cycleStatus.timeRemainingFormatted && (
                      <div className="text-[10px] text-emerald-400/80 font-medium text-center mt-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>Refreshes in {cycleStatus.timeRemainingFormatted}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. TIMING HABIT: Quick +Minutes or Launch Focus */}
                {habit.type === 'timing' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-platinum/60 font-semibold">Focus Time</span>
                      <span className="font-bold text-white font-mono">
                        {currentVal} / {targetVal} min
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className={cn(
                          "h-full transition-all duration-300",
                          isCompleted ? "bg-emerald-400" : "bg-gradient-to-r from-amber-400 to-primary"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleStepProgress(habit, 15, e)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Add 15 minutes to session"
                      >
                        <Plus className="w-3 h-3 text-primary" />
                        <span>+15 min</span>
                      </button>

                      {onStartFocus ? (
                        <button
                          type="button"
                          onClick={() => onStartFocus(habit)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-primary hover:bg-primary-deep text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          title="Launch Deep Focus Session"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>Timer</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleQuickToggle(habit, e)}
                          className={cn(
                            "p-2 rounded-xl border text-xs font-bold transition-all",
                            isCompleted 
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                              : "bg-white/5 hover:bg-emerald-500/20 text-platinum/60 hover:text-emerald-300 border-white/10"
                          )}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isCompleted && cycleStatus.timeRemainingFormatted && (
                      <div className="text-[10px] text-emerald-400/80 font-medium text-center mt-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>Refreshes in {cycleStatus.timeRemainingFormatted}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Customize Modal */}
      <PinHabitsModal 
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        habits={habits}
        pinnedHabitIds={pinnedHabitIds}
        onSavePinnedHabits={savePinnedHabits}
      />
    </div>
  );
};
