import { Challenge, FocusSessionRecord, Habit } from '../types';
import { getTodayKey } from './habitUtils';

export interface ChallengeProgressResult {
  current: number;
  target: number;
  percent: number;
  isCompleted: boolean;
}

export const evaluateChallengeProgress = (
  challenge: Challenge,
  habits: Habit[],
  focusSessions: FocusSessionRecord[] = []
): ChallengeProgressResult => {
  const target = Math.max(1, challenge.goalTarget || 1);
  if (!challenge.isJoined) {
    return { current: 0, target, percent: 0, isCompleted: false };
  }

  const startDate = challenge.startAt ? new Date(challenge.startAt) : new Date();
  const endDate = challenge.endAt ? new Date(challenge.endAt) : new Date(Date.now() + 30 * 86400000);
  const startKey = !isNaN(startDate.getTime()) ? getTodayKey(startDate) : '0000-01-01';
  const endKey = !isNaN(endDate.getTime()) ? getTodayKey(endDate) : '9999-12-31';

  let current = 0;

  if (challenge.goalType === 'streak') {
    const activeDateKeys = new Set<string>();
    habits.forEach((h) => {
      if (h.completedToday) {
        const todayKey = getTodayKey();
        if (todayKey >= startKey && todayKey <= endKey) {
          activeDateKeys.add(todayKey);
        }
      }
      if (h.history) {
        Object.entries(h.history).forEach(([dKey, val]) => {
          if (dKey >= startKey && dKey <= endKey) {
            const targetVal = Math.max(1, h.targetValue || 1);
            if (val === true || (typeof val === 'number' && val >= targetVal)) {
              activeDateKeys.add(dKey);
            }
          }
        });
      }
    });

    const sortedDates = Array.from(activeDateKeys).sort();
    let maxConsec = 0;
    let curConsec = 0;
    let prev: Date | null = null;
    for (const dStr of sortedDates) {
      const cur = new Date(`${dStr}T12:00:00`);
      if (prev) {
        const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
        curConsec = diff === 1 ? curConsec + 1 : 1;
      } else {
        curConsec = 1;
      }
      prev = cur;
      if (curConsec > maxConsec) maxConsec = curConsec;
    }

    const bestHabitStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    current = Math.max(maxConsec, bestHabitStreak);
  } else if (challenge.goalType === 'minutes') {
    let mins = 0;
    focusSessions.forEach((s) => {
      if (s.mode === 'focus' && s.completedAt) {
        const key = getTodayKey(new Date(s.completedAt));
        if (key >= startKey && key <= endKey) {
          mins += Math.round((s.actualSecondsCompleted || s.durationMinutes * 60) / 60);
        }
      }
    });
    habits.forEach((h) => {
      if (h.type === 'timing' && h.events) {
        h.events.forEach((ev) => {
          if (ev.notes?.includes('focus_session')) return;
          const evKey = ev.timestamp ? getTodayKey(new Date(ev.timestamp)) : '';
          if (evKey >= startKey && evKey <= endKey && typeof ev.value === 'number' && ev.value > 0) {
            mins += ev.value;
          }
        });
      }
    });
    current = mins;
  } else {
    // 'count' or 'custom': count habit completions in the challenge window
    const todayKey = getTodayKey();
    habits.forEach((h) => {
      const targetVal = Math.max(1, h.targetValue || 1);
      const historyDates = new Set<string>();
      if (h.history) {
        Object.entries(h.history).forEach(([dKey, val]) => {
          if (dKey >= startKey && dKey <= endKey) {
            if (val === true || (typeof val === 'number' && val >= targetVal)) {
              historyDates.add(dKey);
            }
          }
        });
      }
      if (h.completedToday && todayKey >= startKey && todayKey <= endKey) {
        historyDates.add(todayKey);
      }
      current += historyDates.size;
    });
  }

  const percent = Math.min(100, Math.round((current / target) * 100));
  return {
    current: Math.min(target, current),
    target,
    percent,
    isCompleted: current >= target
  };
};
