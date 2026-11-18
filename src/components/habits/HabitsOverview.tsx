import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Pause, 
  Play, 
  Archive, 
  Flame, 
  Bell, 
  Clock, 
  ChevronRight, 
  Zap, 
  Target,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Habit, HabitCategory, UserProfile } from '../../types';
import { CreateHabitModal } from './CreateHabitModal';
import { HabitCard } from './HabitCard';
import { DeleteHabitConfirmModal } from './DeleteHabitConfirmModal';
import { playSound } from '../../lib/audio';

interface HabitsOverviewProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  toggleHabit?: (id: string, e?: React.MouseEvent) => void;
  onUpdateHabitProgress?: (id: string, newValue: number, meta?: { source?: string }) => void;
  onDeleteHabit?: (id: string) => void;
  onSaveHabit?: (habit: any) => void;
  pinnedHabitIds?: string[];
  onTogglePinHabit?: (id: string) => void;
  onStartFocus?: (habit: Habit) => void;
  userProfile?: UserProfile;
  onAddXP?: (amount: number, meta?: any) => void;
}

export const HabitsOverview: React.FC<HabitsOverviewProps> = ({ 
  habits, 
  setHabits, 
  toggleHabit, 
  onUpdateHabitProgress,
  onDeleteHabit,
  onSaveHabit,
  pinnedHabitIds,
  onTogglePinHabit,
  onStartFocus
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<HabitCategory | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Completed' | 'Missed' | 'Paused' | 'Archived'>('Active');

  const handleSaveHabit = (habitData: any) => {
    if (onSaveHabit) {
      onSaveHabit(habitData);
    } else if (editingHabit) {
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...habitData } : h));
    } else {
      const now = new Date();
      const newHabit: Habit = {
        id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        streak: 0,
        completedToday: false,
        currentValue: 0,
        history: {},
        events: [],
        createdAt: now.toISOString(),
        cycleStartedAt: now.toISOString(),
        cycleId: `cycle_${now.getTime()}_${Math.random().toString(36).substring(2, 8)}`,
        ...habitData
      };
      setHabits(prev => [newHabit, ...prev]);
    }
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const handleToggleHabit = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (toggleHabit) {
      toggleHabit(id, e);
    } else {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, completedToday: !h.completedToday } : h));
    }
  };

  const requestDeleteHabit = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setHabitToDelete(habit);
    }
  };

  const confirmDeleteHabit = () => {
    if (!habitToDelete) return;
    const id = habitToDelete.id;
    if (onDeleteHabit) {
      onDeleteHabit(id);
    } else {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
    setHabitToDelete(null);
  };

  const handleLaunchFocus = (h: Habit) => {
    if (onStartFocus) {
      onStartFocus(h);
    }
  };

  const handleTogglePin = (habitId: string) => {
    if (onTogglePinHabit) {
      onTogglePinHabit(habitId);
      return;
    }
    playSound('click');
  };

  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
      const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || h.category === filterCategory;
      
      let matchesStatus = true;
      if (filterStatus === 'Active') matchesStatus = !h.isArchived && !h.isPaused;
      else if (filterStatus === 'Completed') matchesStatus = h.completedToday;
      else if (filterStatus === 'Missed') matchesStatus = !h.completedToday && !h.isArchived && !h.isPaused;
      else if (filterStatus === 'Paused') matchesStatus = !!h.isPaused;
      else if (filterStatus === 'Archived') matchesStatus = !!h.isArchived;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [habits, searchQuery, filterCategory, filterStatus]);

  const activeHabitsCount = habits.filter(h => !h.isArchived && !h.isPaused).length;
  const completedTodayCount = habits.filter(h => h.completedToday).length;
  const totalStreaksCount = habits.reduce((acc, h) => acc + (h.streak || 0), 0);

  const categories: (HabitCategory | 'All')[] = ['All', 'Fitness', 'Productivity', 'Mindfulness', 'Learning', 'Health', 'Finance', 'Custom'];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-1 sm:mb-2">Habits</h1>
          <p className="text-platinum/60 font-medium text-xs sm:text-sm">Build consistency and master your daily discipline.</p>
        </div>
        <button 
          onClick={() => {
            setEditingHabit(null);
            setIsModalOpen(true);
          }}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" /> New Habit
        </button>
      </header>

      {/* Quick Summary Metrics */}
      {habits.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-platinum/40 font-bold uppercase tracking-wider">Completed Today</div>
              <div className="text-xl font-display font-bold text-white">
                {completedTodayCount} / {activeHabitsCount}
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-platinum/40 font-bold uppercase tracking-wider">Total Streaks</div>
              <div className="text-xl font-display font-bold text-warning">
                {totalStreaksCount} Days
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/5 col-span-2 md:col-span-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success font-bold">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-platinum/40 font-bold uppercase tracking-wider">Completion Rate</div>
              <div className="text-xl font-display font-bold text-success">
                {activeHabitsCount > 0 ? Math.round((completedTodayCount / activeHabitsCount) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
          <input 
            type="text" 
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
          />
          {searchQuery && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-platinum/40">
              {filteredHabits.length} {filteredHabits.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>
        
        <div className="md:col-span-3">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="w-full bg-surface border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none text-sm font-medium"
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-surface text-white">{cat}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          <div className="flex p-1 bg-white/5 rounded-xl overflow-x-auto no-scrollbar">
            {(['Active', 'Completed', 'Paused', 'Archived'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "flex-1 py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all touch-manipulation cursor-pointer active:scale-95 text-center shrink-0 sm:shrink",
                  filterStatus === status ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-platinum/40 hover:text-platinum"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHabits.length > 0 ? (
          filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={(id, e) => handleToggleHabit(id, e)}
              onStartFocus={(h) => handleLaunchFocus(h)}
              onUpdateProgress={(id, val) => {
                if (onUpdateHabitProgress) {
                  onUpdateHabitProgress(id, val);
                } else {
                  setHabits(prev => prev.map(h => h.id === id ? { ...h, currentValue: val, completedToday: val >= (h.targetValue || 1) } : h));
                }
              }}
              onEdit={(h) => {
                setEditingHabit(h);
                setIsModalOpen(true);
              }}
              onDelete={(id, e) => requestDeleteHabit(id, e)}
              onTogglePin={handleTogglePin}
              isPinned={pinnedHabitIds ? pinnedHabitIds.includes(habit.id) : habit.isPinned}
            />
          ))
        ) : (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 text-center space-y-6 glass-panel rounded-2xl border border-white/5">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Zap className="w-10 h-10 text-primary opacity-40" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {searchQuery || filterCategory !== 'All' || filterStatus !== 'Active'
                  ? "No habits match your filters" 
                  : "No habits yet"}
              </h3>
              <p className="text-platinum/40 max-w-sm mx-auto text-sm">
                {searchQuery || filterCategory !== 'All' || filterStatus !== 'Active'
                  ? "Try different keywords or reset your filters." 
                  : "Create your first custom habit to start tracking your daily discipline."}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => {
                  setEditingHabit(null);
                  setIsModalOpen(true);
                }}
                className="btn-primary py-3 px-8 text-sm"
              >
                <Plus className="w-4 h-4" /> Create Your First Habit
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateHabitModal 
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingHabit(null);
            }}
            onSave={handleSaveHabit}
            onDelete={(id) => requestDeleteHabit(id)}
            editingHabit={editingHabit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {habitToDelete && (
          <DeleteHabitConfirmModal
            isOpen={!!habitToDelete}
            habit={habitToDelete}
            onClose={() => setHabitToDelete(null)}
            onConfirm={confirmDeleteHabit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
