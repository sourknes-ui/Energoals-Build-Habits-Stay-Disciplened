import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Calendar,
  ChevronRight,
  Activity,
  Brain,
  Zap,
  Coffee,
  Book,
  DollarSign,
  Check,
  Flag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { HabitCategory, Goal, Habit } from '../../types';
import { getTodayKey } from '../../lib/habitUtils';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Goal) => void;
  editingGoal?: Goal | null;
  habits?: Habit[];
}

const categories: { id: HabitCategory; icon: any; color: string }[] = [
  { id: 'Fitness', icon: Activity, color: '#5FD4A7' },
  { id: 'Productivity', icon: Zap, color: '#B14AE0' },
  { id: 'Mindfulness', icon: Brain, color: '#D9B6FF' },
  { id: 'Learning', icon: Book, color: '#F5B971' },
  { id: 'Health', icon: Coffee, color: '#3B82F6' },
  { id: 'Finance', icon: DollarSign, color: '#C8C6D1' }
];

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGoal,
  habits = []
}) => {
  const [step, setStep] = useState(1);
  const [goalData, setGoalData] = useState<Partial<Goal>>({
    title: '',
    description: '',
    category: 'Productivity',
    priority: 'medium',
    progress: 0,
    targetDate: getTodayKey(),
    linkedHabits: []
  });

  useEffect(() => {
    if (editingGoal) {
      setGoalData({
        ...editingGoal,
        priority: editingGoal.priority || 'medium',
        linkedHabits: editingGoal.linkedHabits || []
      });
      setStep(1);
    } else {
      setGoalData({
        title: '',
        description: '',
        category: 'Productivity',
        priority: 'medium',
        progress: 0,
        targetDate: getTodayKey(),
        linkedHabits: []
      });
      setStep(1);
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const activeHabits = habits.filter((h) => !h.isArchived);

  const toggleLinkedHabit = (habitId: string) => {
    const current = goalData.linkedHabits || [];
    if (current.includes(habitId)) {
      setGoalData({ ...goalData, linkedHabits: current.filter((id) => id !== habitId) });
    } else {
      setGoalData({ ...goalData, linkedHabits: [...current, habitId] });
    }
  };

  const handleSave = () => {
    const progress = Math.max(0, Math.min(100, goalData.progress || 0));
    const finalGoal: Goal = {
      id: editingGoal?.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: (goalData.title || '').trim() || 'Untitled Goal',
      description: (goalData.description || '').trim(),
      category: goalData.category || 'Productivity',
      priority: goalData.priority || 'medium',
      status: progress >= 100 ? 'completed' : editingGoal?.status === 'archived' ? 'archived' : 'active',
      completedAt: progress >= 100 ? editingGoal?.completedAt || new Date().toISOString() : undefined,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      progress,
      targetDate: goalData.targetDate || getTodayKey(),
      linkedHabits: goalData.linkedHabits || []
    };
    onSave(finalGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_100px_-20px_rgba(177,74,224,0.3)] flex flex-col max-h-[85vh] my-auto z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
          <div>
            <h2 className="text-2xl font-display font-bold text-white">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <p className="text-sm text-platinum/40">Step {step} of 2: Define your achievement</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-platinum/40" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master Deep Work"
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-primary/50 transition-all text-white"
                  value={goalData.title}
                  onChange={(e) => setGoalData({ ...goalData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Description</label>
                <textarea
                  placeholder="What do you want to achieve?"
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all min-h-[100px] text-white"
                  value={goalData.description}
                  onChange={(e) => setGoalData({ ...goalData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Category</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setGoalData({ ...goalData, category: cat.id })}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border transition-all',
                        goalData.category === cat.id
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface border-white/5 text-platinum/60 hover:border-white/20'
                      )}
                    >
                      <cat.icon className="w-5 h-5" />
                      <span className="font-bold text-sm">{cat.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Target Date</label>
                  <div className="flex items-center gap-3 bg-surface border border-white/10 rounded-xl p-3.5">
                    <Calendar className="w-5 h-5 text-primary shrink-0" />
                    <input
                      type="date"
                      className="bg-transparent text-white focus:outline-none flex-1 text-sm"
                      value={goalData.targetDate}
                      onChange={(e) => setGoalData({ ...goalData, targetDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-platinum/40 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-primary" /> Priority
                  </label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setGoalData({ ...goalData, priority: p })}
                        className={cn(
                          'flex-1 py-3.5 rounded-xl text-xs font-bold capitalize border transition-all',
                          goalData.priority === p
                            ? 'bg-primary/15 border-primary text-primary'
                            : 'bg-surface border-white/10 text-platinum/50 hover:text-white'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">
                  Current Progress ({goalData.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
                  value={goalData.progress}
                  onChange={(e) => setGoalData({ ...goalData, progress: parseInt(e.target.value, 10) })}
                />
              </div>

              {/* Linked Habits Sync */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">
                    Link Habits (Auto-Sync Progress)
                  </label>
                  <span className="text-[11px] text-platinum/40">
                    {(goalData.linkedHabits || []).length} linked
                  </span>
                </div>
                {activeHabits.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                    {activeHabits.map((habit) => {
                      const isLinked =
                        (goalData.linkedHabits || []).includes(habit.id) ||
                        (goalData.linkedHabits || []).includes(habit.name);
                      return (
                        <button
                          type="button"
                          key={habit.id}
                          onClick={() => toggleLinkedHabit(habit.id)}
                          className={cn(
                            'p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer',
                            isLinked
                              ? 'bg-primary/15 border-primary/40 text-white'
                              : 'bg-surface border-white/5 text-platinum/60 hover:border-white/15'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">{habit.emoji || '✨'}</span>
                            <span className="text-xs font-bold truncate">{habit.name}</span>
                          </div>
                          {isLinked && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-platinum/40 italic p-3 rounded-xl bg-white/5 border border-white/5">
                    Create habits first to link them directly to this goal.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between shrink-0 bg-white/5">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className={cn('btn-secondary py-2', step === 1 && 'opacity-0 pointer-events-none')}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => (step < 2 ? setStep((s) => s + 1) : handleSave())}
            disabled={step === 1 && !(goalData.title || '').trim()}
            className={cn(
              'btn-primary py-2 px-8',
              step === 1 && !(goalData.title || '').trim() && 'opacity-50 cursor-not-allowed'
            )}
          >
            {step === 2 ? (editingGoal ? 'Update Goal' : 'Create Goal') : 'Continue'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
