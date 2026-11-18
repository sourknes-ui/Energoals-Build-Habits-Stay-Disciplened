export type HabitCategory = 
  | 'Fitness' 
  | 'Productivity' 
  | 'Mindfulness' 
  | 'Learning' 
  | 'Health' 
  | 'Finance' 
  | 'Custom';

export type HabitType = 'binary' | 'quantitative' | 'timing';

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';

export type HabitDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Very Hard';

export interface CompletionRecord {
  id: string; // ${habitId}_${dateKey}
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  xpAwarded: number;
  completionType: HabitType;
  completionValue: number;
  timestamp: string;
}

export interface FocusSessionRecord {
  id: string;
  habitId?: string;
  habitName: string;
  habitEmoji?: string;
  durationMinutes: number;
  actualSecondsCompleted: number;
  completedAt: string;
  xpEarned: number;
  mode: 'focus' | 'break';
  reflectionNote?: string;
  distractionCount: number;
}

export interface AmendmentEvent {
  id: string;
  habitId: string;
  type: 'check' | 'count' | 'timing_session' | 'timing_add';
  value: boolean | number;
  timestamp: string;
  notes?: string;
  deviceId?: string;
  version: string;
}

export interface XPTransaction {
  id: string;
  key: string; // idempotency key e.g. habit_<id>_<cycle>, routine_<id>_<date>
  amount: number;
  reason: string;
  source: 'habit' | 'routine' | 'goal' | 'challenge' | 'journal' | 'focus' | 'achievement' | 'other';
  entityId?: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
}

export interface RoutineCompletionRecord {
  id: string;
  routineId: string;
  routineName: string;
  date: string; // YYYY-MM-DD
  durationSeconds: number;
  stepsCompleted: number;
  totalSteps: number;
  xpEarned: number;
  completedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  icon: string;
  category: HabitCategory;
  type: HabitType;
  difficulty?: HabitDifficulty;
  frequency: HabitFrequency;
  schedule?: string[];
  timeOfDay?: string;
  reminder?: boolean;
  reminderTime?: string;
  note?: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  streak: number;
  longestStreak?: number;
  completedToday: boolean;
  // History is now derived from amendment events, but we keep a simplified cache for UI performance
  history: Record<string, boolean | number>;
  events: AmendmentEvent[]; // The canonical source of truth for history
  color: string;
  isPaused?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  pinnedPriority?: number;
  createdAt: string;
  // 24-hour cycle and refresh tracking
  lastCompletedAt?: string;
  nextResetAt?: string;
  cycleStartedAt?: string;
  lastResetAt?: string;
  cycleId?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  targetDate: string;
  category: HabitCategory;
  linkedHabits: string[];
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'archived';
  completedAt?: string;
  createdAt?: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  time: string;
  duration: string;
  habits: string[];
  color: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  energy: number;
  tags: string[];
  color?: string;
  updatedAt?: string;
}

export type ChallengeGoalType = 'streak' | 'count' | 'minutes' | 'custom';
export type ChallengeVisibility = 'public' | 'private' | 'inviteOnly';

export interface Challenge {
  id: string;
  createdByUserId: string;
  title: string;
  description: string;
  goalType: ChallengeGoalType;
  goalTarget: number | null;
  startAt: string;
  endAt: string;
  visibility: ChallengeVisibility;
  joinCode?: string;
  shareSlug?: string;
  participantCount: number;
  color: string;
  isJoined?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeParticipant {
  challengeId: string;
  userId: string;
  role: 'creator' | 'admin' | 'member';
  joinedAt: string;
}

export type AchievementCategory = 
  | 'consistency' 
  | 'streaks' 
  | 'focus' 
  | 'routines' 
  | 'health' 
  | 'discipline' 
  | 'xp' 
  | 'challenges' 
  | 'time' 
  | 'resilience';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requirement: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  currentProgress: number;
  maxProgress: number;
  unit: string;
  progressFormatted?: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface ManualMeasurements {
  currentWeight?: number; // Store in kg (canonical)
  height?: number; // Store in cm (canonical)
  targetWeight?: number; // Store in kg (canonical)
  waist?: number; // Store in cm (canonical)
  chest?: number; // Store in cm (canonical)
  hips?: number; // Store in cm (canonical)
  bodyFat?: number; // Percentage
}

export interface UserProfile {
  name: string;
  username?: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  avatar?: string;
  vibe?: string;
  height?: number;
  weight?: number;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  mainGoal?: string;
  momentumScore: number;
  totalStreaks: number;
  lastCheckInDate?: string;
  passwordLastChangedDate?: string;
  // XP System
  currentLevel: number;
  currentXP: number;
  totalLifetimeXP: number;
  xpToNextLevel: number;
  levelProgress: number; // 0-1
  manualMeasurements?: ManualMeasurements;
}

export interface AppSettings {
  notifications: {
    push: {
      all: boolean;
      workouts: boolean;
      hydration: boolean;
      sleep: boolean;
      weighIn: boolean;
      challenges: boolean;
      calendar: boolean;
      missedActivity: boolean;
      motivation: boolean;
      weeklySummary: boolean;
      achievements: boolean;
    };
    email: {
      productUpdates: boolean;
      weeklyProgress: boolean;
      challenges: boolean;
      billing: boolean;
      security: boolean;
    };
    sound: boolean;
    vibration: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  calendar: {
    defaultView: 'month' | 'week' | 'day';
    weekStartsOn: 0 | 1; // 0: Sunday, 1: Monday
    showCompleted: boolean;
    showReminders: boolean;
    showDeadlines: boolean;
    highlightImportant: boolean;
    timeFormat: '12h' | '24h';
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    animations: boolean;
  };
  units: {
    weight: 'kg' | 'lb';
    height: 'cm' | 'ft';
    distance: 'km' | 'mi';
    water: 'l' | 'oz';
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    shareData: boolean;
    personalizedAds: boolean;
  };
  fitness: {
    workoutDaysPerWeek: number;
    preferredWorkoutTime: string;
    stepGoal: number;
    waterGoal: number;
    sleepGoal: number;
    trainingTypes?: Record<string, boolean>;
  };
}
