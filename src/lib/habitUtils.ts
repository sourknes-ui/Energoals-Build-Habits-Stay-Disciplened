import { Habit, HabitCategory, HabitType, Goal, Routine, Achievement } from '../types';
import { evaluateAllBadges } from './badgeEngine';
import { getHabitXP } from './progressionEngine';

export const EMOJI_MAP: Record<string, string> = {
  'water': '💧',
  'hydrate': '💧',
  'drink': '💧',
  'workout': '🏋️',
  'gym': '💪',
  'lift': '💪',
  'training': '🏋️',
  'run': '🏃',
  'jogging': '🏃',
  'cardio': '🏃',
  'sleep': '😴',
  'bedtime': '😴',
  'rest': '😴',
  'meditate': '🧘',
  'mindfulness': '🧘',
  'breathing': '🧘',
  'read': '📚',
  'book': '📚',
  'study': '📚',
  'stretch': '🤸',
  'yoga': '🧘',
  'mobility': '🤸',
  'healthy food': '🥗',
  'nutrition': '🥗',
  'salad': '🥗',
  'eat': '🥗',
  'walk': '🚶',
  'steps': '🚶',
  'vitamins': '💊',
  'supplements': '💊',
  'journal': '✍️',
  'reflection': '✍️',
  'write': '✍️',
  'no sugar': '🚫',
  'morning': '🌅',
  'routine': '🌅',
  'fruit': '🍎',
  'apple': '🍎',
  'code': '💻',
  'programming': '💻',
  'focus': '⚡',
  'deep work': '🎯',
  'budget': '💰',
  'finance': '📈',
  'clean': '✨',
};

export const CATEGORY_EMOJI_MAP: Record<HabitCategory, string[]> = {
  'Fitness': ['🏋️', '🏃', '💪', '🚶', '🤸', '🚴', '🏊'],
  'Productivity': ['⚡', '📅', '💻', '📝', '🎯', '🚀', '🧠'],
  'Mindfulness': ['🧘', '✨', '🍃', '🌊', '🕯️', '🧠', '🙏'],
  'Learning': ['📚', '🎓', '🧠', '💡', '📖', '✍️', '🎨'],
  'Health': ['🥗', '💧', '😴', '💊', '🍎', '🦷', '🧼'],
  'Finance': ['💰', '📈', '🏦', '💳', '📊', '💸', '🪙'],
  'Custom': ['⭐', '🔥', '✨', '🌈', '🍀', '💎', '🎈'],
};

export const suggestEmoji = (name: string): string | null => {
  if (!name) return null;
  const lowerName = name.toLowerCase().trim();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lowerName.includes(key)) return emoji;
  }
  return null;
};

/**
 * Returns canonical local date string YYYY-MM-DD
 */
export const getTodayKey = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns local date string for N days ago in YYYY-MM-DD
 */
export const getDateKeyDaysAgo = (daysAgo: number, baseDate: Date = new Date()): string => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - daysAgo);
  return getTodayKey(d);
};

/**
 * Check if a habit is due on a given day based on frequency, schedule, and creation date
 */
export const isHabitDueOnDate = (
  habit: Habit,
  date: Date = new Date(),
  options: { ignoreCurrentStatus?: boolean; ignoreCreatedAt?: boolean } = {}
): boolean => {
  if (!options.ignoreCurrentStatus && (habit.isPaused || habit.isArchived)) return false;

  if (!options.ignoreCreatedAt && habit.createdAt) {
    const createdDate = new Date(habit.createdAt);
    if (!isNaN(createdDate.getTime()) && getTodayKey(date) < getTodayKey(createdDate)) {
      return false;
    }
  }

  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDayName = dayNames[dayOfWeek];

  switch (habit.frequency) {
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      if (!habit.schedule || habit.schedule.length === 0) return true;
      return habit.schedule.includes(currentDayName);
    case 'weekly': {
      if (habit.schedule && habit.schedule.length > 0) {
        return habit.schedule.includes(currentDayName);
      }
      const createdDay = habit.createdAt ? new Date(habit.createdAt).getDay() : 0;
      return dayOfWeek === (isNaN(createdDay) ? 0 : createdDay);
    }
    case 'daily':
    default:
      return true;
  }
};

/**
 * Helper: resolves whether a recorded value counts as completed for a given habit
 */
export const isHabitValueCompleted = (habit: Habit, val: boolean | number | undefined): boolean => {
  if (val === undefined) return false;
  if (typeof val === 'boolean') return val === true;
  const target = Math.max(1, habit.targetValue || (habit.type === 'timing' ? 15 : habit.type === 'quantitative' ? 10 : 1));
  return Number(val) >= target;
};

/**
 * Deterministically computes current active streak from habit history
 */
export const calculateHabitStreak = (habit: Habit, currentDate: Date = new Date()): number => {
  if (!habit.history && !habit.completedToday) return 0;

  const history = habit.history || {};
  const todayKey = getTodayKey(currentDate);
  const createdDateKey = habit.createdAt && !isNaN(new Date(habit.createdAt).getTime())
    ? getTodayKey(new Date(habit.createdAt))
    : undefined;

  let streak = 0;

  // Check today's completion
  const isCompletedToday = habit.completedToday || isHabitValueCompleted(habit, history[todayKey]);
  if (isCompletedToday) {
    streak += 1;
  }

  // Walk backwards day by day from yesterday
  let checkDayOffset = 1;
  const maxLookbackDays = 365;

  while (checkDayOffset <= maxLookbackDays) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - checkDayOffset);
    const dateKey = getTodayKey(d);
    const dayValue = history[dateKey];

    // Stop cleanly before habit existed unless explicit backfilled history is present
    if (createdDateKey && dateKey < createdDateKey && dayValue === undefined) {
      break;
    }

    const wasDue = isHabitDueOnDate(habit, d, { ignoreCurrentStatus: true, ignoreCreatedAt: true });

    if (!wasDue) {
      checkDayOffset++;
      continue;
    }

    if (isHabitValueCompleted(habit, dayValue)) {
      streak += 1;
      checkDayOffset++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Computes longest historical streak achieved for a habit
 */
export const calculateLongestStreak = (habit: Habit, currentDate: Date = new Date()): number => {
  const currentStreak = calculateHabitStreak(habit, currentDate);
  const existingLongest = habit.longestStreak || 0;
  const historyKeys = Object.keys(habit.history || {}).sort();
  if (historyKeys.length === 0) {
    return Math.max(existingLongest, currentStreak);
  }

  const startDate = new Date(`${historyKeys[0]}T12:00:00`);
  const endDate = new Date(currentDate);
  endDate.setHours(12, 0, 0, 0);

  let best = Math.max(existingLongest, currentStreak);
  let run = 0;
  const cursor = new Date(startDate);
  let safety = 0;

  while (cursor <= endDate && safety < 730) {
    safety++;
    const key = getTodayKey(cursor);
    const wasDue = isHabitDueOnDate(habit, cursor, { ignoreCurrentStatus: true, ignoreCreatedAt: true });
    const done = isHabitValueCompleted(habit, habit.history?.[key]);
    if (done) {
      run++;
      if (run > best) best = run;
    } else if (wasDue) {
      run = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return best;
};

/**
 * Calculates progress percentage (0 - 100)
 */
export const calculateProgressPercent = (habit: Habit): number => {
  const target = Math.max(1, habit.targetValue || (habit.type === 'timing' ? 15 : habit.type === 'quantitative' ? 10 : 1));
  const current = Math.max(0, habit.currentValue || 0);

  if (habit.type === 'binary') {
    return habit.completedToday ? 100 : 0;
  }

  return Math.min(100, Math.round((current / target) * 100));
};

/**
 * Canonical Habit XP reference delegating to difficulty-based progressionEngine
 */
export const calculateHabitXP = (
  type: HabitType,
  targetValue: number,
  unit?: string,
  streak: number = 0
): { baseTargetXP: number; multiplier: number; totalTargetXP: number } => {
  const baseTargetXP = getHabitXP({ type, targetValue, unit });
  let multiplier = 1.0;
  if (streak >= 30) multiplier = 2.0;
  else if (streak >= 14) multiplier = 1.5;
  else if (streak >= 7) multiplier = 1.2;

  return {
    baseTargetXP,
    multiplier,
    totalTargetXP: Math.round(baseTargetXP * multiplier)
  };
};

/**
 * Cascade-clean orphaned references when a habit is deleted
 */
export const cascadeDeleteHabit = (
  deletedHabitId: string,
  deletedHabitName: string,
  goals: Goal[],
  routines: Routine[]
): { updatedGoals: Goal[]; updatedRoutines: Routine[] } => {
  const updatedGoals = goals.map(goal => {
    if (!goal.linkedHabits) return goal;
    const filtered = goal.linkedHabits.filter(h => h !== deletedHabitId && h !== deletedHabitName);
    return { ...goal, linkedHabits: filtered };
  });

  const updatedRoutines = routines.map(routine => {
    if (!routine.habits) return routine;
    const filtered = routine.habits.filter(h => h !== deletedHabitId && h !== deletedHabitName);
    return { ...routine, habits: filtered };
  });

  return { updatedGoals, updatedRoutines };
};

/**
 * 24-Hour Cycle Duration Constant (86,400,000 milliseconds)
 */
export const HABIT_CYCLE_MS = 24 * 60 * 60 * 1000;

export interface Habit24HourCycleStatus {
  isCompleted: boolean;
  canReset: boolean;
  timeRemainingMs: number;
  timeRemainingFormatted: string;
  nextResetAt?: string;
  lastCompletedAt?: string;
  cycleStartedAt?: string;
}

/**
 * Returns ISO timestamp for next local calendar midnight (00:00:00 tomorrow)
 */
export const getNextCalendarDayResetISO = (now: Date = new Date()): string => {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.toISOString();
};

/**
 * Computes exact cycle status and countdown until next daily reset (local midnight)
 */
export const getHabit24HourCycleStatus = (habit: Habit, now: Date = new Date()): Habit24HourCycleStatus => {
  const targetVal = Math.max(1, habit.targetValue || (habit.type === 'timing' ? 15 : habit.type === 'quantitative' ? 10 : 1));
  const currentVal = Math.max(0, habit.currentValue || 0);
  const isCompleted = Boolean(habit.completedToday || (habit.type !== 'binary' && currentVal >= targetVal));

  if (!isCompleted) {
    return {
      isCompleted: false,
      canReset: false,
      timeRemainingMs: 0,
      timeRemainingFormatted: '',
      cycleStartedAt: habit.cycleStartedAt,
      nextResetAt: undefined,
      lastCompletedAt: habit.lastCompletedAt
    };
  }

  const todayKey = getTodayKey(now);
  let completedDateKey: string | null = null;
  if (habit.lastCompletedAt) {
    const parsed = new Date(habit.lastCompletedAt);
    if (!isNaN(parsed.getTime())) {
      completedDateKey = getTodayKey(parsed);
    }
  } else if (habit.cycleStartedAt) {
    const parsed = new Date(habit.cycleStartedAt);
    if (!isNaN(parsed.getTime())) {
      completedDateKey = getTodayKey(parsed);
    }
  }

  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);

  const explicitResetMs = habit.nextResetAt ? new Date(habit.nextResetAt).getTime() : NaN;
  const resetTargetMs = !isNaN(explicitResetMs)
    ? Math.min(explicitResetMs, nextMidnight.getTime())
    : nextMidnight.getTime();

  const newDayStarted = Boolean(completedDateKey && completedDateKey !== todayKey);
  const diffMs = newDayStarted ? 0 : resetTargetMs - now.getTime();

  if (diffMs <= 0) {
    return {
      isCompleted: true,
      canReset: true,
      timeRemainingMs: 0,
      timeRemainingFormatted: '0m',
      nextResetAt: new Date(resetTargetMs).toISOString(),
      lastCompletedAt: habit.lastCompletedAt,
      cycleStartedAt: habit.cycleStartedAt
    };
  }

  const totalMinutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const formatted = hours > 0
    ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`)
    : `${minutes}m`;

  return {
    isCompleted: true,
    canReset: false,
    timeRemainingMs: diffMs,
    timeRemainingFormatted: formatted,
    nextResetAt: new Date(resetTargetMs).toISOString(),
    lastCompletedAt: habit.lastCompletedAt,
    cycleStartedAt: habit.cycleStartedAt
  };
};

/**
 * Checks all habits and automatically resets habits when a new local calendar day starts or reset window expires.
 * - Resets daily progress without deducting previously earned XP.
 * - Preserves completed history for the prior date.
 * - Recalculates streak accurately.
 */
export const checkAndReset24HourHabits = (
  habits: Habit[],
  now: Date = new Date()
): { updatedHabits: Habit[]; resetCount: number; resetHabitIds: string[] } => {
  let resetCount = 0;
  const resetHabitIds: string[] = [];
  const todayKey = getTodayKey(now);

  const updatedHabits = habits.map(habit => {
    if (habit.isPaused || habit.isArchived) return habit;

    const status = getHabit24HourCycleStatus(habit, now);
    const hasPartialProgressFromPreviousDay =
      !status.isCompleted &&
      (habit.currentValue || 0) > 0 &&
      habit.cycleStartedAt &&
      getTodayKey(new Date(habit.cycleStartedAt)) !== todayKey;

    if ((status.isCompleted && status.canReset) || hasPartialProgressFromPreviousDay) {
      resetCount++;
      resetHabitIds.push(habit.id);

      const history = { ...(habit.history || {}) };
      const completionDate = habit.lastCompletedAt
        ? new Date(habit.lastCompletedAt)
        : habit.cycleStartedAt
        ? new Date(habit.cycleStartedAt)
        : new Date(now.getTime() - HABIT_CYCLE_MS);
      const completionDateKey = getTodayKey(isNaN(completionDate.getTime()) ? now : completionDate);

      const targetVal = habit.targetValue || (habit.type === 'timing' ? 15 : habit.type === 'quantitative' ? 10 : 1);
      if (status.isCompleted && history[completionDateKey] === undefined) {
        history[completionDateKey] = habit.type === 'binary' ? true : (habit.currentValue || targetVal);
      } else if (hasPartialProgressFromPreviousDay && history[completionDateKey] === undefined) {
        history[completionDateKey] = habit.currentValue;
      }

      const refreshedHabit: Habit = {
        ...habit,
        completedToday: false,
        currentValue: 0,
        lastCompletedAt: undefined,
        nextResetAt: undefined,
        lastResetAt: now.toISOString(),
        cycleStartedAt: now.toISOString(),
        cycleId: `cycle_${now.getTime()}_${Math.random().toString(36).substring(2, 8)}`,
        history
      };

      const updatedStreak = calculateHabitStreak(refreshedHabit, now);
      const longestStreak = calculateLongestStreak({ ...refreshedHabit, streak: updatedStreak }, now);

      return {
        ...refreshedHabit,
        streak: updatedStreak,
        longestStreak
      };
    }

    return habit;
  });

  return { updatedHabits, resetCount, resetHabitIds };
};

/**
 * Sync habit state on day/cycle rollover respecting local calendar days
 */
export const syncHabitForDate = (habit: Habit, dateKey: string = getTodayKey(), now: Date = new Date()): Habit => {
  const history = habit.history || {};
  const target = Math.max(1, habit.targetValue || (habit.type === 'timing' ? 15 : habit.type === 'quantitative' ? 10 : 1));

  const cycleStatus = getHabit24HourCycleStatus(habit, now);

  if (cycleStatus.isCompleted && cycleStatus.canReset) {
    const completionDate = habit.lastCompletedAt ? new Date(habit.lastCompletedAt) : new Date(now.getTime() - HABIT_CYCLE_MS);
    const completionDateKey = getTodayKey(isNaN(completionDate.getTime()) ? now : completionDate);
    const updatedHistory = { ...history };
    if (updatedHistory[completionDateKey] === undefined) {
      updatedHistory[completionDateKey] = habit.type === 'binary' ? true : (habit.currentValue || target);
    }

    const refreshedHabit: Habit = {
      ...habit,
      completedToday: false,
      currentValue: 0,
      lastCompletedAt: undefined,
      nextResetAt: undefined,
      lastResetAt: now.toISOString(),
      cycleStartedAt: now.toISOString(),
      cycleId: `cycle_${now.getTime()}_${Math.random().toString(36).substring(2, 8)}`,
      history: updatedHistory
    };

    const streak = calculateHabitStreak(refreshedHabit, now);
    return {
      ...refreshedHabit,
      streak,
      longestStreak: calculateLongestStreak({ ...refreshedHabit, streak }, now)
    };
  }

  if (habit.completedToday && !cycleStatus.canReset) {
    const streak = calculateHabitStreak(habit, now);
    return {
      ...habit,
      streak,
      longestStreak: calculateLongestStreak({ ...habit, streak }, now)
    };
  }

  const recordedToday = history[dateKey];
  let currentValue = habit.currentValue || 0;
  let completedToday = habit.completedToday || false;

  if (recordedToday !== undefined) {
    if (typeof recordedToday === 'boolean') {
      completedToday = recordedToday;
      currentValue = recordedToday ? target : 0;
    } else {
      currentValue = Number(recordedToday);
      completedToday = currentValue >= target;
    }
  } else if (habit.cycleStartedAt && getTodayKey(new Date(habit.cycleStartedAt)) !== dateKey) {
    currentValue = 0;
    completedToday = false;
  }

  const habitWithCurrent: Habit = {
    ...habit,
    currentValue,
    completedToday,
    history
  };

  const streak = calculateHabitStreak(habitWithCurrent, now);

  return {
    ...habitWithCurrent,
    streak,
    longestStreak: calculateLongestStreak({ ...habitWithCurrent, streak }, now)
  };
};

/**
 * Evaluates achievement unlocks based on comprehensive live app context
 */
export const evaluateAchievements = (
  currentAchievements: Achievement[],
  context: {
    habits: Habit[];
    goals?: Goal[];
    routines?: Routine[];
    journalCount?: number;
    totalStreaks?: number;
    currentLevel?: number;
    userProfile?: any;
    challenges?: any[];
    journalEntries?: any[];
    totalFocusMinutes?: number;
    completedRoutineSessions?: number;
  }
): { updatedAchievements: Achievement[]; newlyUnlocked: Achievement[] } => {
  const userProfile = context.userProfile || {
    name: 'User',
    email: '',
    momentumScore: 0,
    totalStreaks: context.totalStreaks || 0,
    currentLevel: context.currentLevel || 1,
    currentXP: 0,
    totalLifetimeXP: (context.currentLevel || 1) * 500,
    xpToNextLevel: 100,
    levelProgress: 0,
    fitnessLevel: 'beginner',
    mainGoal: 'General Fitness',
  };

  const updatedAchievements = evaluateAllBadges(
    context.habits,
    userProfile,
    context.routines || [],
    context.challenges || [],
    context.journalEntries || [],
    currentAchievements,
    context.completedRoutineSessions || 0,
    context.totalFocusMinutes || 0
  );

  const prevUnlockedSet = new Set(currentAchievements.filter(a => a.unlocked).map(a => a.id));
  const newlyUnlocked = updatedAchievements.filter(a => a.unlocked && !prevUnlockedSet.has(a.id));

  return { updatedAchievements, newlyUnlocked };
};
