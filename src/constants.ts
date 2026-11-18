import { AppSettings, UserProfile } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    push: {
      all: true,
      workouts: true,
      hydration: true,
      sleep: true,
      weighIn: true,
      challenges: true,
      calendar: true,
      missedActivity: true,
      motivation: true,
      weeklySummary: true,
      achievements: true,
    },
    email: {
      productUpdates: true,
      weeklyProgress: true,
      challenges: true,
      billing: true,
      security: true,
    },
    sound: true,
    vibration: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
  },
  calendar: {
    defaultView: 'month',
    weekStartsOn: 1,
    showCompleted: true,
    showReminders: true,
    showDeadlines: true,
    highlightImportant: true,
    timeFormat: '24h',
  },
  appearance: {
    theme: 'dark',
    accentColor: '#B14AE0',
    animations: true,
  },
  units: {
    weight: 'kg',
    height: 'cm',
    distance: 'km',
    water: 'l',
  },
  privacy: {
    profileVisibility: 'private',
    shareData: false,
    personalizedAds: false,
  },
  fitness: {
    workoutDaysPerWeek: 5,
    preferredWorkoutTime: '07:00',
    stepGoal: 10000,
    waterGoal: 2.5,
    sleepGoal: 8,
    trainingTypes: {
      Strength: true,
      Cardio: true,
      Flexibility: true,
      HIIT: true,
    },
  },
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  email: 'user@example.com',
  momentumScore: 0,
  totalStreaks: 0,
  currentLevel: 1,
  currentXP: 0,
  totalLifetimeXP: 0,
  xpToNextLevel: 100,
  levelProgress: 0,
  fitnessLevel: 'beginner',
  mainGoal: 'General Fitness',
};
