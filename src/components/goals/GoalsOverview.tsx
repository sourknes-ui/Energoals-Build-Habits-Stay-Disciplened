import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Target,
  Plus,
  ChevronRight,
  Calendar,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Archive,
  RotateCcw,
  Link2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Goal, HabitCategory, Habit, XPTransaction } from '../../types';
import { CreateGoalModal } from './CreateGoalModal';
import { ConfirmModal, ToastType } from '../ui/Feedback';

const categoryColors: Record<HabitCategory, string> = {
  Fitness: '#5FD4A7',
  Productivity: '#B14AE0',
  Mindfulness: '#D9B6FF',
  Learning: '#F5B971',
  Health: '#3B82F6',
  Finance: '#C8C6D1',
  Custom: '#FFFFFF'
};

interface GoalsOverviewProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  habits?: Habit[];
  addXP?: (
    amount: number,
    meta?: {
      key?: string;
      reason?: string;
      source?: XPTransaction['source'];
      entityId?: string;
    }
  ) => boolean;
  showToast?: (message: string, type?: ToastType) => void;
}

export const GoalsOverview: React.FC<GoalsOverviewProps> = ({
  goals,
  setGoals,
  habits = [],
  addXP,
  showToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'completed' | 'archived'>('all');

  const isGoalOverdue = (g: Goal) => {
    if (g.status === 'archived' || g.status === 'completed' || g.progress >= 100) return false;
    if (!g.targetDate) return false;
    const t = new Date(g.targetDate);
    if (isNaN(t.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return t < today;
  };

  const filteredGoals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return goals.filter((g) => {
      const matchesSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (statusFilter === 'archived') return g.status === 'archived';
      if (g.status === 'archived') return false;
      if (statusFilter === 'completed') return g.progress >= 100 || g.status === 'completed';
      if (statusFilter === 'overdue') return isGoalOverdue(g);
      if (statusFilter === 'active') return g.progress < 100 && g.status !== 'completed';
      return true;
    });
  }, [goals, searchQuery, statusFilter]);

  const handleSaveGoal = (goal: Goal) => {
    if (editingGoal) {
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
      if (goal.progress >= 100 && editingGoal.progress < 100) {
        const awarded = addXP?.(40, {
          key: `goal_complete_${goal.id}`,
          reason: `Goal Achieved: ${goal.title}`,
          source: 'goal',
          entityId: goal.id
        });
        showToast?.(
          awarded ? `Goal completed: ${goal.title} (+40 XP)` : `Updated "${goal.title}"`,
          'success'
        );
      } else {
        showToast?.(`Updated "${goal.title}"`, 'success');
      }
    } else {
      setGoals((prev) => [goal, ...prev]);
      const awarded = addXP?.(15, {
        key: `goal_create_${goal.id}`,
        reason: `Created Goal: ${goal.title}`,
        source: 'goal',
        entityId: goal.id
      });
      showToast?.(
        awarded ? `Created goal "${goal.title}" (+15 XP)` : `Created goal "${goal.title}"`,
        'success'
      );
    }
    setEditingGoal(null);
  };

  const handleToggleComplete = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    const markingDone = goal.progress < 100;
    const nextProgress = markingDone ? 100 : 0;
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? {
              ...g,
              progress: nextProgress,
              status: markingDone ? 'completed' : 'active',
              completedAt: markingDone ? new Date().toISOString() : undefined
            }
          : g
      )
    );
    if (markingDone) {
      const awarded = addXP?.(40, {
        key: `goal_complete_${goal.id}`,
        reason: `Goal Achieved: ${goal.title}`,
        source: 'goal',
        entityId: goal.id
      });
      showToast?.(
        awarded ? `Goal completed: ${goal.title} (+40 XP)` : `Goal marked complete`,
        'success'
      );
    } else {
      showToast?.(`Reopened "${goal.title}"`, 'info');
    }
  };

  const handleToggleArchive = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    const archiving = goal.status !== 'archived';
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, status: archiving ? 'archived' : g.progress >= 100 ? 'completed' : 'active' }
          : g
      )
    );
    showToast?.(archiving ? `Archived "${goal.title}"` : `Restored "${goal.title}"`, 'info');
  };

  const handleConfirmDelete = () => {
    if (!goalToDelete) return;
    setGoals((prev) => prev.filter((g) => g.id !== goalToDelete.id));
    showToast?.(`Deleted "${goalToDelete.title}"`, 'info');
    setGoalToDelete(null);
  };

  const handleEditGoal = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <CreateGoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
        habits={habits}
      />

      <ConfirmModal
        isOpen={!!goalToDelete}
        title="Delete Goal?"
        description={`Are you sure you want to delete "${goalToDelete?.title || ''}"? This cannot be undone.`}
        confirmLabel="Delete Goal"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setGoalToDelete(null)}
      />

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-1 sm:mb-2">Your Goals</h1>
          <p className="text-platinum/60 font-medium text-xs sm:text-sm">
            Transform your habits into long-term achievements.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" /> Create Goal
        </button>
      </header>

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex p-1 bg-white/5 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['all', 'active', 'overdue', 'completed', 'archived'] as const).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 cursor-pointer',
                statusFilter === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-platinum/40 hover:text-platinum'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="w-full bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal) => {
          const color = categoryColors[goal.category] || '#FFFFFF';
          const overdue = isGoalOverdue(goal);
          const completed = goal.progress >= 100 || goal.status === 'completed';

          return (
            <motion.div
              key={goal.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'glass-panel p-5 sm:p-8 rounded-2xl border transition-all group cursor-pointer relative flex flex-col justify-between',
                completed
                  ? 'border-emerald-500/30 bg-emerald-500/[0.03]'
                  : overdue
                  ? 'border-warning/30'
                  : 'border-white/5 hover:border-primary/20'
              )}
              onClick={(e) => handleEditGoal(goal, e)}
            >
              <div>
                <div className="flex items-start justify-between gap-4 sm:gap-6 mb-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {goal.priority && (
                        <span
                          className={cn(
                            'text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border',
                            goal.priority === 'high'
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : goal.priority === 'medium'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-white/5 text-platinum/50 border-white/10'
                          )}
                        >
                          {goal.priority}
                        </span>
                      )}
                      {overdue && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
                          Overdue
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors truncate">
                      {goal.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-platinum/60 leading-relaxed line-clamp-2">{goal.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-platinum/40 bg-white/5 px-2.5 py-0.5 rounded-full">
                      {goal.category}
                    </span>
                  </div>
                </div>

                {goal.linkedHabits && goal.linkedHabits.length > 0 && (
                  <div className="mb-4 flex items-center gap-1.5 text-[11px] text-primary font-semibold">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Auto-synced with {goal.linkedHabits.length} habit{goal.linkedHabits.length > 1 ? 's' : ''}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-platinum/40 font-medium">Progress</span>
                    <span className={cn('font-bold', completed ? 'text-emerald-400' : 'text-white')}>
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, goal.progress)}%` }}
                      className="h-full"
                      style={{ backgroundColor: completed ? '#10B981' : color }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-platinum/40">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Target:{' '}
                    {goal.targetDate && !isNaN(new Date(goal.targetDate).getTime())
                      ? new Date(goal.targetDate).toLocaleDateString()
                      : 'No date set'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleToggleComplete(goal, e)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors cursor-pointer',
                      completed
                        ? 'text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25'
                        : 'text-platinum/40 hover:text-emerald-400 hover:bg-white/10'
                    )}
                    title={completed ? 'Reopen Goal' : 'Mark Completed (+40 XP)'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleToggleArchive(goal, e)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-platinum/40 hover:text-white transition-colors cursor-pointer"
                    title={goal.status === 'archived' ? 'Restore Goal' : 'Archive Goal'}
                  >
                    {goal.status === 'archived' ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleEditGoal(goal, e)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-platinum/40 hover:text-primary transition-colors cursor-pointer"
                    title="Edit goal"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGoalToDelete(goal);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-platinum/40 hover:text-error transition-colors cursor-pointer"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-platinum/20 group-hover:text-primary group-hover:translate-x-1 transition-all ml-1" />
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Empty State / Add New */}
        <button
          type="button"
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          className="border-2 border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all group min-h-[300px] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all">
            <Plus className="w-6 h-6 text-platinum/40 group-hover:text-primary" />
          </div>
          <span className="text-platinum/40 font-bold group-hover:text-primary">Add New Goal</span>
        </button>
      </div>
    </div>
  );
};
