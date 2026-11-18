import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Pin, 
  PinOff, 
  Sparkles, 
  Search, 
  Check, 
  Zap, 
  Flame, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { Habit } from '../../types';
import { cn } from '../../lib/utils';
import { DIFFICULTY_COLORS, inferHabitDifficulty } from '../../lib/progressionEngine';

interface PinHabitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  pinnedHabitIds: string[];
  onSavePinnedHabits: (pinnedIds: string[]) => void;
}

export const PinHabitsModal: React.FC<PinHabitsModalProps> = ({
  isOpen,
  onClose,
  habits,
  pinnedHabitIds,
  onSavePinnedHabits
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(pinnedHabitIds);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep local state in sync when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(pinnedHabitIds.slice(0, 3));
      setSearchQuery('');
    }
  }, [isOpen, pinnedHabitIds]);

  const activeHabits = useMemo(() => {
    return habits.filter(h => !h.isArchived && !h.isPaused);
  }, [habits]);

  const filteredHabits = useMemo(() => {
    if (!searchQuery.trim()) return activeHabits;
    const q = searchQuery.toLowerCase();
    return activeHabits.filter(h => 
      h.name.toLowerCase().includes(q) || 
      h.category.toLowerCase().includes(q)
    );
  }, [activeHabits, searchQuery]);

  const togglePin = (habitId: string) => {
    if (selectedIds.includes(habitId)) {
      setSelectedIds(prev => prev.filter(id => id !== habitId));
    } else {
      if (selectedIds.length >= 3) {
        // Replace the last one or do nothing
        setSelectedIds(prev => [...prev.slice(0, 2), habitId]);
      } else {
        setSelectedIds(prev => [...prev, habitId]);
      }
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setSelectedIds(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    setSelectedIds(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const autoSelectTop3 = () => {
    // Smart algorithm: priority to Hard/Very Hard, then highest streak, then uncompleted
    const sorted = [...activeHabits].sort((a, b) => {
      const diffOrder: Record<string, number> = { 'Very Hard': 4, 'Hard': 3, 'Medium': 2, 'Easy': 1 };
      const diffA = diffOrder[a.difficulty || inferHabitDifficulty(a)] || 2;
      const diffB = diffOrder[b.difficulty || inferHabitDifficulty(b)] || 2;
      if (diffA !== diffB) return diffB - diffA;
      return (b.streak || 0) - (a.streak || 0);
    });

    const top3 = sorted.slice(0, 3).map(h => h.id);
    setSelectedIds(top3);
  };

  const handleSave = () => {
    onSavePinnedHabits(selectedIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl bg-[#14141E] border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Pin className="w-4 h-4 fill-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                Customize Smart Widgets
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-platinum/60">
              Pin up to 3 critical keystones for rapid 1-tap toggling on your dashboard.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-platinum/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Slots Preview */}
        <div className="p-4 sm:p-6 bg-white/[0.02] border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-platinum/60">
              Selected Keystones ({selectedIds.length}/3)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={autoSelectTop3}
                className="text-[11px] font-bold text-primary hover:text-primary-light flex items-center gap-1 cursor-pointer transition-colors"
                title="Automatically select your highest-impact habits"
              >
                <Sparkles className="w-3 h-3" /> Auto-Pick Top 3
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-[11px] font-bold text-platinum/40 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors ml-2"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[0, 1, 2].map((slotIdx) => {
              const habitId = selectedIds[slotIdx];
              const habit = habits.find(h => h.id === habitId);
              const slotColors = [
                { border: 'border-amber-400/30', badge: 'bg-amber-400/20 text-amber-300 border-amber-400/30', label: '#1 Priority' },
                { border: 'border-purple-400/30', badge: 'bg-purple-400/20 text-purple-300 border-purple-400/30', label: '#2 Priority' },
                { border: 'border-emerald-400/30', badge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30', label: '#3 Priority' }
              ];
              const colors = slotColors[slotIdx];

              if (!habit) {
                return (
                  <div 
                    key={`slot-empty-${slotIdx}`}
                    className="p-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-center min-h-[84px] py-4"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-platinum/30 mb-1">
                      {colors.label}
                    </span>
                    <span className="text-xs text-platinum/40">Empty Slot</span>
                  </div>
                );
              }

              return (
                <div 
                  key={`slot-filled-${habit.id}`}
                  className={cn(
                    "p-3 rounded-2xl border bg-white/5 flex flex-col justify-between relative group transition-all",
                    colors.border
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={cn("text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border", colors.badge)}>
                      {colors.label}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {slotIdx > 0 && (
                        <button 
                          onClick={() => moveUp(slotIdx)} 
                          className="p-1 rounded hover:bg-white/10 text-platinum/50 hover:text-white"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                      )}
                      {slotIdx < selectedIds.length - 1 && (
                        <button 
                          onClick={() => moveDown(slotIdx)} 
                          className="p-1 rounded hover:bg-white/10 text-platinum/50 hover:text-white"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      )}
                      <button 
                        onClick={() => togglePin(habit.id)} 
                        className="p-1 rounded hover:bg-red-500/20 text-platinum/40 hover:text-red-400 transition-colors ml-0.5"
                        title="Remove from Smart Widgets"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg shrink-0">{habit.emoji || '✨'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{habit.name}</div>
                      <div className="text-[10px] text-platinum/50 truncate capitalize">{habit.category}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Selection List */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-platinum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your habits to pin..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-platinum/30 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            {filteredHabits.length > 0 ? (
              filteredHabits.map((habit) => {
                const isSelected = selectedIds.includes(habit.id);
                const slotIndex = selectedIds.indexOf(habit.id);
                const difficulty = habit.difficulty || inferHabitDifficulty(habit);
                const diffStyle = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.Medium;

                return (
                  <div
                    key={habit.id}
                    onClick={() => togglePin(habit.id)}
                    className={cn(
                      "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none",
                      isSelected 
                        ? "bg-primary/10 border-primary/40 shadow-sm" 
                        : "bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.06]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors",
                        isSelected ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 border border-white/5"
                      )}>
                        {habit.emoji || '✨'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-xs sm:text-sm font-bold truncate", isSelected ? "text-primary-light" : "text-white")}>
                            {habit.name}
                          </span>
                          <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-bold uppercase", diffStyle.bg, diffStyle.text)}>
                            {difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-platinum/50">
                          <span>{habit.category}</span>
                          <span>•</span>
                          <span className="capitalize">{habit.type}</span>
                          {habit.streak > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-warning flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 fill-warning" /> {habit.streak}d
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isSelected ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary text-white text-[11px] font-bold shadow-md shadow-primary/20">
                          <Pin className="w-3 h-3 fill-white" />
                          <span>Slot #{slotIndex + 1}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary text-platinum/60 text-xs font-semibold border border-white/10 transition-colors"
                        >
                          Pin
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-platinum/40 text-xs sm:text-sm">
                No matching habits found.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-[#12121B] flex items-center justify-between gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="btn-secondary py-2 px-5 text-xs font-semibold"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="btn-primary py-2 px-6 text-xs font-bold flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Save Smart Widgets
          </button>
        </div>
      </motion.div>
    </div>
  );
};
