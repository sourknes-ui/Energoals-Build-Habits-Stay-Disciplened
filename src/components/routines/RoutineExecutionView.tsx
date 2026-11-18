import React, { useState, useEffect } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw, CheckCircle, CheckCircle2, Circle } from 'lucide-react';
import { Routine, Habit } from '../../types';
import { readScopedJSON, writeScopedJSON, removeScopedKey } from '../../lib/storageSync';
import { cn } from '../../lib/utils';
import { playSound } from '../../lib/audio';

interface RoutineExecutionViewProps {
  routine: Routine;
  habits?: Habit[];
  onToggleLinkedHabit?: (habitId: string) => void;
  onBack: () => void;
  onComplete: (stats?: { elapsedSeconds: number; stepsCompleted: number }) => void;
}

interface PersistedRoutineTimer {
  elapsed: number;
  status: 'running' | 'paused' | 'stopped';
  lastTickAt: number;
  completedSteps: string[];
}

export const RoutineExecutionView: React.FC<RoutineExecutionViewProps> = ({
  routine,
  habits = [],
  onToggleLinkedHabit,
  onBack,
  onComplete
}) => {
  const storageKey = `routine_${routine.id}_timer`;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerStatus, setTimerStatus] = useState<'running' | 'paused' | 'stopped'>('running');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    const saved = readScopedJSON<PersistedRoutineTimer | null>(storageKey, null);
    if (saved) {
      let restoredElapsed = saved.elapsed || 0;
      if (saved.status === 'running' && saved.lastTickAt) {
        const deltaSec = Math.max(0, Math.floor((Date.now() - saved.lastTickAt) / 1000));
        restoredElapsed += deltaSec;
      }
      setElapsedSeconds(restoredElapsed);
      setTimerStatus(saved.status || 'paused');
      setCompletedSteps(Array.isArray(saved.completedSteps) ? saved.completedSteps : []);
    } else {
      setElapsedSeconds(0);
      setTimerStatus('running');
      setCompletedSteps([]);
    }
  }, [routine.id, storageKey]);

  useEffect(() => {
    if (timerStatus !== 'running') {
      writeScopedJSON(storageKey, {
        elapsed: elapsedSeconds,
        status: timerStatus,
        lastTickAt: Date.now(),
        completedSteps
      });
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        writeScopedJSON(storageKey, {
          elapsed: next,
          status: 'running',
          lastTickAt: Date.now(),
          completedSteps
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStatus, storageKey, completedSteps, elapsedSeconds]);

  const formatTime = (seconds: number) => {
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const toggleTimer = () => {
    if (timerStatus === 'running') {
      setTimerStatus('paused');
    } else {
      setTimerStatus('running');
    }
  };

  const resetTimer = () => {
    setElapsedSeconds(0);
    setTimerStatus('stopped');
    setCompletedSteps([]);
    removeScopedKey(storageKey);
  };

  const toggleStep = (stepName: string) => {
    const stepKey = stepName.trim().toLowerCase();
    const isCurrentlyChecked = completedSteps.includes(stepName);
    const nextSteps = isCurrentlyChecked
      ? completedSteps.filter((s) => s !== stepName)
      : [...completedSteps, stepName];

    setCompletedSteps(nextSteps);
    playSound('click');

    // Sync with linked habit of the same name if applicable
    const matchedHabit = habits.find(
      (h) => !h.isArchived && h.name.trim().toLowerCase() === stepKey
    );
    if (matchedHabit && onToggleLinkedHabit) {
      if (!isCurrentlyChecked && !matchedHabit.completedToday) {
        onToggleLinkedHabit(matchedHabit.id);
      } else if (isCurrentlyChecked && matchedHabit.completedToday) {
        onToggleLinkedHabit(matchedHabit.id);
      }
    }
  };

  const handleFinish = () => {
    removeScopedKey(storageKey);
    onComplete({
      elapsedSeconds,
      stepsCompleted: completedSteps.length
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 bg-bg-dark/80 backdrop-blur-md z-20 border-b border-white/5 p-4 flex items-center justify-between">
        <button type="button" onClick={onBack} className="p-2 hover:bg-white/5 rounded-full cursor-pointer">
          <ArrowLeft className="w-6 h-6 text-platinum" />
        </button>
        <div className="text-3xl font-mono font-bold text-white tracking-widest">{formatTime(elapsedSeconds)}</div>
        <div className="flex gap-2">
          <button type="button" onClick={toggleTimer} className="p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer">
            {timerStatus === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button type="button" onClick={resetTimer} className="p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll-container p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">{routine.name}</h1>
            <p className="text-platinum/60 mt-1">{routine.description}</p>
          </div>
          {routine.habits.length > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 text-xs font-bold text-primary">
              {completedSteps.length} / {routine.habits.length} Steps Done
            </div>
          )}
        </div>

        <div className="space-y-3">
          {routine.habits.map((habitStep, i) => {
            const matchedHabit = habits.find(
              (h) => !h.isArchived && h.name.trim().toLowerCase() === habitStep.trim().toLowerCase()
            );
            const checked = completedSteps.includes(habitStep) || Boolean(matchedHabit?.completedToday);

            return (
              <button
                type="button"
                key={`${habitStep}_${i}`}
                onClick={() => toggleStep(habitStep)}
                className={cn(
                  'w-full glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border transition-all text-left cursor-pointer',
                  checked
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-white/5 hover:border-primary/30'
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0',
                      checked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className={cn('text-lg font-medium truncate', checked ? 'text-emerald-200 line-through' : 'text-white')}>
                      {habitStep}
                    </div>
                    {matchedHabit && (
                      <div className="text-[11px] text-primary font-semibold">
                        Synced with Daily Habit (+XP on check)
                      </div>
                    )}
                  </div>
                </div>
                {checked ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-platinum/30 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <footer className="sticky bottom-0 p-6 border-t border-white/5 bg-bg-dark">
        <button
          type="button"
          onClick={handleFinish}
          className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-bold tracking-wide"
        >
          <CheckCircle className="w-5 h-5" /> Complete Routine (+20 XP)
        </button>
      </footer>
    </div>
  );
};
