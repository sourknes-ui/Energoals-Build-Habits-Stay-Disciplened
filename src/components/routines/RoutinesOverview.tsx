import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Repeat, Play, Clock, CheckCircle2, Plus, Edit2, Trash2, Award } from 'lucide-react';
import { Routine, Habit, RoutineCompletionRecord } from '../../types';
import { CreateRoutineModal } from './CreateRoutineModal';
import { ConfirmModal, ToastType } from '../ui/Feedback';

interface RoutinesOverviewProps {
  routines: Routine[];
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
  habits?: Habit[];
  routineHistory?: RoutineCompletionRecord[];
  onStartRoutine: (routine: Routine) => void;
  showToast?: (message: string, type?: ToastType) => void;
}

export const RoutinesOverview: React.FC<RoutinesOverviewProps> = ({
  routines,
  setRoutines,
  habits = [],
  routineHistory = [],
  onStartRoutine,
  showToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);

  const handleSaveRoutine = (routine: Routine) => {
    if (editingRoutine) {
      setRoutines((prev) => prev.map((r) => (r.id === editingRoutine.id ? routine : r)));
      showToast?.(`Updated "${routine.name}"`, 'success');
    } else {
      setRoutines((prev) => [...prev, routine]);
      showToast?.(`Created routine "${routine.name}"`, 'success');
    }
    setEditingRoutine(null);
  };

  const handleConfirmDelete = () => {
    if (!routineToDelete) return;
    setRoutines((prev) => prev.filter((r) => r.id !== routineToDelete.id));
    showToast?.(`Deleted "${routineToDelete.name}"`, 'info');
    setRoutineToDelete(null);
  };

  const handleEditRoutine = (routine: Routine, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRoutine(routine);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <ConfirmModal
        isOpen={!!routineToDelete}
        title="Delete Routine?"
        description={`Are you sure you want to delete "${routineToDelete?.name || ''}"?`}
        confirmLabel="Delete Routine"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setRoutineToDelete(null)}
      />

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-1 sm:mb-2">Routines</h1>
          <p className="text-platinum/60 font-medium text-xs sm:text-sm">Structured sequences for effortless consistency.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingRoutine(null);
            setIsModalOpen(true);
          }}
          className="btn-primary w-full sm:w-auto"
        >
          <Repeat className="w-5 h-5" /> Create Routine
        </button>
      </header>

      <div className="space-y-4 sm:space-y-6">
        {routines.length > 0 ? (
          routines.map((routine) => {
            const completions = routineHistory.filter((rec) => rec.routineId === routine.id);
            const lastCompleted = completions[0];

            return (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-4 sm:p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    <div
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                      style={{ backgroundColor: `${routine.color}20`, color: routine.color }}
                    >
                      <Repeat className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-8 w-full">
                      <div>
                        <div className="flex items-center gap-2 sm:gap-3 mb-1">
                          <h3 className="text-lg sm:text-2xl font-bold text-white">{routine.name}</h3>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleEditRoutine(routine, e)}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-platinum/40 hover:text-primary transition-colors cursor-pointer"
                              title="Edit routine"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoutineToDelete(routine);
                              }}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-platinum/40 hover:text-error transition-colors cursor-pointer"
                              title="Delete routine"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-platinum/60 text-xs sm:text-sm">{routine.description}</p>
                        {completions.length > 0 && (
                          <div className="mt-1.5 text-[11px] text-emerald-400/90 font-semibold flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              Completed {completions.length} {completions.length === 1 ? 'time' : 'times'}
                              {lastCompleted ? ` • Last: ${new Date(lastCompleted.completedAt).toLocaleDateString()}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-platinum/40">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {routine.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {routine.habits.length} Steps
                        </span>
                        <span className="text-primary">{routine.duration}</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold">
                          +20 XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {routine.habits.slice(0, 4).map((h: string, i: number) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-bg-dark bg-surface flex items-center justify-center text-[10px] font-bold"
                          title={h}
                        >
                          {h[0]}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartRoutine(routine)}
                      className="btn-primary py-2 px-6 group-hover:scale-105 transition-transform"
                    >
                      <Play className="w-4 h-4 fill-current" /> Start Routine
                    </button>
                  </div>
                </div>

                {/* Background Glow */}
                <div
                  className="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none"
                  style={{ backgroundColor: routine.color }}
                />
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 glass-panel rounded-2xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Repeat className="w-8 h-8 text-primary opacity-40" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1 tracking-tight">No routines created yet</h3>
              <p className="text-platinum/40 max-w-xs mx-auto text-sm">
                Build your first routine to automate your success and reduce decision fatigue.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingRoutine(null);
                setIsModalOpen(true);
              }}
              className="btn-secondary py-2 px-6 text-sm"
            >
              <Plus className="w-4 h-4" /> Create Your First Routine
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateRoutineModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingRoutine(null);
            }}
            onSave={handleSaveRoutine}
            editingRoutine={editingRoutine}
            availableHabits={habits}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
