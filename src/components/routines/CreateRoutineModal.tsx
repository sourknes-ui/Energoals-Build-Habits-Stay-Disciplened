import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Routine, Habit } from '../../types';

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: Routine) => void;
  editingRoutine?: Routine | null;
  availableHabits?: Habit[];
}

export const CreateRoutineModal: React.FC<CreateRoutineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRoutine,
  availableHabits = []
}) => {
  const [name, setName] = useState(editingRoutine?.name || '');
  const [description, setDescription] = useState(editingRoutine?.description || '');
  const [time, setTime] = useState(editingRoutine?.time || '07:00 AM');
  const [duration, setDuration] = useState(editingRoutine?.duration || '30 min');
  const [color, setColor] = useState(editingRoutine?.color || '#B14AE0');
  const [habits, setHabits] = useState<string[]>(editingRoutine?.habits || []);
  const [newHabit, setNewHabit] = useState('');

  useEffect(() => {
    if (editingRoutine) {
      setName(editingRoutine.name || '');
      setDescription(editingRoutine.description || '');
      setTime(editingRoutine.time || '07:00 AM');
      setDuration(editingRoutine.duration || '30 min');
      setColor(editingRoutine.color || '#B14AE0');
      setHabits(editingRoutine.habits || []);
    } else {
      setName('');
      setDescription('');
      setTime('07:00 AM');
      setDuration('30 min');
      setColor('#B14AE0');
      setHabits([]);
    }
    setNewHabit('');
  }, [editingRoutine, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const routine: Routine = {
      id: editingRoutine?.id || `routine_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      description: description.trim(),
      time: time.trim() || '07:00 AM',
      duration: duration.trim() || '30 min',
      habits,
      color
    };

    onSave(routine);
    onClose();
  };

  const addHabit = (stepTitle?: string) => {
    const val = (stepTitle ?? newHabit).trim();
    if (val && !habits.includes(val)) {
      setHabits([...habits, val]);
      if (!stepTitle) setNewHabit('');
    }
  };

  const removeHabit = (habit: string) => {
    setHabits(habits.filter((h) => h !== habit));
  };

  const activeHabitNames = availableHabits.filter((h) => !h.isArchived).map((h) => h.name);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
          <h2 className="text-2xl font-display font-bold text-white">
            {editingRoutine ? 'Edit Routine' : 'Create Routine'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-platinum/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-platinum/40 ml-1">Routine Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Mastery"
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-platinum/40 ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the purpose of this routine?"
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-platinum/40 ml-1">Start Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="07:00 AM"
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-platinum/40 ml-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45 min"
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-platinum/40 ml-1">Habits & Steps in Routine</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHabit();
                  }
                }}
                placeholder="Add a custom step or habit..."
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
              <button
                onClick={() => addHabit()}
                type="button"
                className="px-4 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-all"
              >
                Add
              </button>
            </div>

            {activeHabitNames.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-platinum/40">Quick-add from your habits:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeHabitNames
                    .filter((hName) => !habits.includes(hName))
                    .slice(0, 8)
                    .map((hName) => (
                      <button
                        type="button"
                        key={hName}
                        onClick={() => addHabit(hName)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/30 text-[11px] text-platinum/70 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-primary" /> {hName}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {habits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {habits.map((h) => (
                  <div
                    key={h}
                    className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-bold text-platinum/80"
                  >
                    {h}
                    <button type="button" onClick={() => removeHabit(h)} className="hover:text-error transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-platinum/40 ml-1">Theme Color</label>
            <div className="flex gap-4">
              {['#B14AE0', '#5FD4A7', '#F5B971', '#3B82F6', '#EF4444'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-surface',
                    color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-4 bg-white/5 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className={cn('btn-primary flex-1', !name.trim() && 'opacity-50 cursor-not-allowed')}
          >
            {editingRoutine ? 'Update Routine' : 'Create Routine'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
