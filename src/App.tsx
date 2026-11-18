// Created by Badr El'mkhymry
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  deleteUser,
  User as FirebaseUser
} from 'firebase/auth';
import { LogOut, ArrowLeft } from 'lucide-react';
import { playSound, setAudioPreferences } from './lib/audio';
import { auth } from './lib/firebase';
import {
  setActiveStorageScope,
  readScopedJSON,
  writeScopedJSON,
  clearScopedStorage,
  loadUserBundleFromFirestore,
  syncUserDocMetadataToFirestore,
  syncCollectionToFirestore,
  deleteUserFirestoreData,
  triggerBrowserDownload
} from './lib/storageSync';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { MobileHeader } from './components/layout/MobileHeader';
import { Dashboard } from './components/dashboard/Dashboard';
import { LandingPage } from './components/LandingPage';
import { GoalsOverview } from './components/goals/GoalsOverview';
import { RoutinesOverview } from './components/routines/RoutinesOverview';
import { RoutineExecutionView } from './components/routines/RoutineExecutionView';
import { Confetti } from './components/Confetti';
import { DailyCheckInModal } from './components/daily-check-in/DailyCheckInModal';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { JournalOverview } from './components/journal/JournalOverview';
import { ChallengesOverview } from './components/challenges/ChallengesOverview';
import { RewardsOverview } from './components/rewards/RewardsOverview';
import { CalendarSection } from './components/calendar/CalendarSection';
import { AICoach } from './components/coach/AICoach';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { SettingsOverview } from './components/settings/SettingsOverview';
import { AppHub } from './components/hub/AppHub';
import { HabitsOverview } from './components/habits/HabitsOverview';
import { WelcomeScreen } from './components/WelcomeScreen';
import { XPNotification } from './components/XPNotification';
import { LevelUpModal } from './components/progression/LevelUpModal';
import { FocusSessionOverlay } from './components/focus/FocusSessionOverlay';
import { ToastContainer, ToastMessage, ToastType } from './components/ui/Feedback';
import { cn } from './lib/utils';
import {
  Habit,
  Goal,
  Routine,
  JournalEntry,
  Challenge,
  Achievement,
  UserProfile,
  AppSettings,
  FocusSessionRecord,
  RoutineCompletionRecord,
  XPTransaction,
  AmendmentEvent
} from './types';
import { CalendarEntry } from './types/calendar';
import { DEFAULT_SETTINGS, DEFAULT_PROFILE } from './constants';
import {
  calculateHabitStreak,
  calculateLongestStreak,
  cascadeDeleteHabit,
  syncHabitForDate,
  getTodayKey,
  checkAndReset24HourHabits,
  getNextCalendarDayResetISO
} from './lib/habitUtils';
import {
  calculateLevelProgression,
  processHabitCompletionTransaction,
  loadXPTransactions,
  hasXPTransaction,
  appendXPTransaction,
  loadCompletionRecords
} from './lib/progressionEngine';
import { evaluateAllBadges, getInitialAchievements } from './lib/badgeEngine';
import { evaluateChallengeProgress } from './lib/challengeUtils';

const createInitialChallenges = (): Challenge[] => [
  {
    id: '1',
    createdByUserId: 'system',
    title: '30 Days of Discipline',
    description: 'Complete all your daily habits for 30 consecutive days.',
    goalType: 'streak',
    goalTarget: 30,
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    visibility: 'public',
    participantCount: 1240,
    color: '#B14AE0',
    isJoined: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    createdByUserId: 'system',
    title: 'Hydration Hero',
    description: 'Drink 2L of water every day for a week.',
    goalType: 'count',
    goalTarget: 7,
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    visibility: 'public',
    participantCount: 850,
    color: '#3B82F6',
    isJoined: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    createdByUserId: 'system',
    title: 'Morning Mastery',
    description: 'Wake up before 6 AM and complete your morning routine.',
    goalType: 'streak',
    goalTarget: 21,
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    visibility: 'public',
    participantCount: 420,
    color: '#F5B971',
    isJoined: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_ACHIEVEMENTS: Achievement[] = getInitialAchievements();

const normalizeHabitsList = (rawHabits: Habit[]): Habit[] => {
  if (!Array.isArray(rawHabits)) return [];
  const legacyMockIds = new Set(['habit_1', 'habit_2', 'habit_3', 'habit_4']);
  const todayKey = getTodayKey();
  const now = new Date();
  const valid = rawHabits.filter((h: any) => h && h.id && !legacyMockIds.has(h.id));
  const synced = valid.map((h: any) =>
    syncHabitForDate(
      {
        ...h,
        type: h.type || 'binary',
        targetValue: h.targetValue || (h.type === 'quantitative' ? 10 : h.type === 'timing' ? 15 : 1),
        currentValue: typeof h.currentValue === 'number' ? h.currentValue : h.completedToday ? (h.targetValue || 1) : 0,
        unit: h.unit || (h.type === 'quantitative' ? 'count' : h.type === 'timing' ? 'min' : ''),
        history: h.history || {},
        events: Array.isArray(h.events) ? h.events : [],
        cycleStartedAt: h.cycleStartedAt || now.toISOString(),
        cycleId: h.cycleId || `cycle_${now.getTime()}_${Math.random().toString(36).substring(2, 8)}`
      },
      todayKey,
      now
    )
  );
  return checkAndReset24HourHabits(synced, now).updatedHabits;
};

const syncProfileLevelFields = (profile: UserProfile): UserProfile => {
  const totalXP = Math.max(0, profile.totalLifetimeXP || 0);
  const info = calculateLevelProgression(totalXP);
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    totalLifetimeXP: totalXP,
    currentXP: info.currentTierXP,
    currentLevel: info.level,
    xpToNextLevel: info.xpToNextLevel,
    levelProgress: info.progressFraction
  };
};

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ oldLevel: number; newLevel: number } | null>(null);
  const [xpNotifications, setXpNotifications] = useState<{ id: string; xp: number }[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeTab, setActiveTab] = useState('hub');
  const [tabHistory, setTabHistory] = useState<string[]>(['hub']);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState<string | undefined>();
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  // Global Focus Session Overlay State (persists across tabs)
  const [isFocusSessionOpen, setIsFocusSessionOpen] = useState(false);
  const [focusHabitId, setFocusHabitId] = useState<string | undefined>(undefined);

  // Firebase Auth & Sync State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const cloudHydratedRef = useRef<boolean>(false);
  const syncErrorShownRef = useRef<boolean>(false);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Primary Scoped States
  const [habits, setHabits] = useState<Habit[]>(() =>
    normalizeHabitsList(readScopedJSON<Habit[]>('habits', []))
  );
  const [goals, setGoals] = useState<Goal[]>(() => readScopedJSON<Goal[]>('goals', []));
  const [routines, setRoutines] = useState<Routine[]>(() => readScopedJSON<Routine[]>('routines', []));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    readScopedJSON<JournalEntry[]>('journal', [])
  );
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>(() =>
    readScopedJSON<CalendarEntry[]>('calendar', [])
  );
  const [challenges, setChallenges] = useState<Challenge[]>(() =>
    readScopedJSON<Challenge[]>('challenges', createInitialChallenges())
  );
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    readScopedJSON<Achievement[]>('achievements', INITIAL_ACHIEVEMENTS)
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    syncProfileLevelFields(readScopedJSON<UserProfile>('profile', DEFAULT_PROFILE))
  );
  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readScopedJSON<AppSettings>('settings', DEFAULT_SETTINGS)
  }));
  const [pinnedHabitIds, setPinnedHabitIds] = useState<string[]>(() =>
    readScopedJSON<string[]>('pinned_habits', [])
  );
  const [focusSessions, setFocusSessions] = useState<FocusSessionRecord[]>(() =>
    readScopedJSON<FocusSessionRecord[]>('focus_sessions', [])
  );
  const [routineHistory, setRoutineHistory] = useState<RoutineCompletionRecord[]>(() =>
    readScopedJSON<RoutineCompletionRecord[]>('routine_history', [])
  );
  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>(() => loadXPTransactions());

  // Firebase Auth & Cloud Hydration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      const scope = setActiveStorageScope(user?.uid);
      cloudHydratedRef.current = false;

      // Load local scoped cache first
      const localHabits = normalizeHabitsList(readScopedJSON<Habit[]>('habits', [], scope));
      const localGoals = readScopedJSON<Goal[]>('goals', [], scope);
      const localRoutines = readScopedJSON<Routine[]>('routines', [], scope);
      const localJournal = readScopedJSON<JournalEntry[]>('journal', [], scope);
      const localCalendar = readScopedJSON<CalendarEntry[]>('calendar', [], scope);
      const localChallenges = readScopedJSON<Challenge[]>('challenges', createInitialChallenges(), scope);
      const localAchievements = readScopedJSON<Achievement[]>('achievements', INITIAL_ACHIEVEMENTS, scope);
      const localProfile = syncProfileLevelFields(readScopedJSON<UserProfile>('profile', DEFAULT_PROFILE, scope));
      const localSettings = { ...DEFAULT_SETTINGS, ...readScopedJSON<AppSettings>('settings', DEFAULT_SETTINGS, scope) };
      const localPinned = readScopedJSON<string[]>('pinned_habits', [], scope);
      const localFocus = readScopedJSON<FocusSessionRecord[]>('focus_sessions', [], scope);
      const localRoutineHist = readScopedJSON<RoutineCompletionRecord[]>('routine_history', [], scope);
      const localXpTxs = readScopedJSON<XPTransaction[]>('xp_transactions', [], scope);

      setHabits(localHabits);
      setGoals(localGoals);
      setRoutines(localRoutines);
      setJournalEntries(localJournal);
      setCalendarEntries(localCalendar);
      setChallenges(localChallenges);
      setAchievements(localAchievements);
      setUserProfile({
        ...localProfile,
        name: user?.displayName && localProfile.name === DEFAULT_PROFILE.name ? user.displayName : localProfile.name,
        email: user?.email || localProfile.email,
        avatar: localProfile.avatar || user?.photoURL || undefined
      });
      setSettings(localSettings);
      setPinnedHabitIds(localPinned);
      setFocusSessions(localFocus);
      setRoutineHistory(localRoutineHist);
      setXpTransactions(localXpTxs);

      if (user) {
        setIsCloudSyncing(true);
        const cloud = await loadUserBundleFromFirestore(user.uid);
        if (cloud) {
          if (cloud.habits.length > 0) setHabits(normalizeHabitsList(cloud.habits));
          if (cloud.goals.length > 0) setGoals(cloud.goals);
          if (cloud.routines.length > 0) setRoutines(cloud.routines);
          if (cloud.journalEntries.length > 0) setJournalEntries(cloud.journalEntries);
          if (cloud.focusSessions.length > 0) setFocusSessions(cloud.focusSessions);
          if (cloud.calendarEntries && cloud.calendarEntries.length > 0) setCalendarEntries(cloud.calendarEntries);
          if (cloud.routineHistory && cloud.routineHistory.length > 0) setRoutineHistory(cloud.routineHistory);
          if (cloud.xpTransactions && cloud.xpTransactions.length > 0) setXpTransactions(cloud.xpTransactions);
          if (cloud.pinnedHabitIds && cloud.pinnedHabitIds.length > 0) setPinnedHabitIds(cloud.pinnedHabitIds);
          if (cloud.achievements && cloud.achievements.length > 0) setAchievements(cloud.achievements);
          if (cloud.settings) setSettings((prev) => ({ ...prev, ...cloud.settings }));
          if (cloud.profile) {
            setUserProfile(syncProfileLevelFields(cloud.profile));
          }
        }
        setIsCloudSyncing(false);
      }
      cloudHydratedRef.current = true;
    });

    return () => unsubscribe();
  }, []);

  // Continuous Automatic Calendar-Day / 24h Cycle Heartbeat
  useEffect(() => {
    const evaluateResets = () => {
      setHabits((prevHabits) => {
        const { updatedHabits, resetCount } = checkAndReset24HourHabits(prevHabits);
        return resetCount > 0 ? updatedHabits : prevHabits;
      });
    };

    evaluateResets();
    const interval = setInterval(evaluateResets, 5000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') evaluateResets();
    };
    const handleFocus = () => evaluateResets();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Daily Check-in prompt
  useEffect(() => {
    const today = new Date().toDateString();
    if (isStarted && userProfile.lastCheckInDate !== today) {
      setIsCheckInModalOpen(true);
    }
  }, [isStarted, userProfile.lastCheckInDate]);

  // Keep pinnedHabitIds clean and aligned with active habits
  useEffect(() => {
    const activeSet = new Set(habits.filter((h) => !h.isArchived && !h.isPaused).map((h) => h.id));
    setPinnedHabitIds((prev) => {
      const cleaned = prev.filter((id) => activeSet.has(id)).slice(0, 3);
      return JSON.stringify(cleaned) === JSON.stringify(prev) ? prev : cleaned;
    });
  }, [habits]);

  // Unified XP Awarding System (Idempotent when key is provided)
  const awardXP = useCallback(
    (
      amount: number,
      meta?: {
        key?: string;
        reason?: string;
        source?: XPTransaction['source'];
        entityId?: string;
      }
    ): boolean => {
      if (!amount) return false;
      const currentList = loadXPTransactions();
      if (meta?.key && hasXPTransaction(meta.key, currentList)) {
        return false;
      }

      const updatedTxs = appendXPTransaction(
        {
          key: meta?.key || `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          amount,
          reason: meta?.reason || 'Performance Reward',
          source: meta?.source || 'other',
          entityId: meta?.entityId,
          date: getTodayKey()
        },
        currentList
      );
      setXpTransactions(updatedTxs);

      setXpNotifications((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, xp: amount }
      ]);

      setUserProfile((prev) => {
        const prevTotal = prev.totalLifetimeXP || 0;
        const newTotal = Math.max(0, prevTotal + amount);
        const prevLevelInfo = calculateLevelProgression(prevTotal);
        const newLevelInfo = calculateLevelProgression(newTotal);

        if (newLevelInfo.level > prevLevelInfo.level) {
          setLevelUpData({ oldLevel: prevLevelInfo.level, newLevel: newLevelInfo.level });
          setShowConfetti(true);
          playSound('accomplishment');
          setTimeout(() => setShowConfetti(false), 3200);
        }

        return {
          ...prev,
          totalLifetimeXP: newTotal,
          currentXP: newLevelInfo.currentTierXP,
          currentLevel: newLevelInfo.level,
          xpToNextLevel: newLevelInfo.xpToNextLevel,
          levelProgress: newLevelInfo.progressFraction
        };
      });

      return true;
    },
    []
  );

  // Sync Goals that have linkedHabits whenever habits change
  const syncLinkedGoalsWithHabits = useCallback(
    (nextHabits: Habit[]) => {
      setGoals((prevGoals) => {
        let changed = false;
        const nextGoals = prevGoals.map((goal) => {
          if (!goal.linkedHabits || goal.linkedHabits.length === 0 || goal.status === 'archived') {
            return goal;
          }
          const matched = nextHabits.filter(
            (h) => !h.isArchived && (goal.linkedHabits.includes(h.id) || goal.linkedHabits.includes(h.name))
          );
          if (matched.length === 0) return goal;

          const totalRatio = matched.reduce((sum, h) => {
            const target = Math.max(1, h.targetValue || (h.type === 'timing' ? 15 : h.type === 'quantitative' ? 10 : 1));
            const ratio = h.completedToday ? 1 : Math.min(1, Math.max(0, (h.currentValue || 0) / target));
            return sum + ratio;
          }, 0);

          const computedProgress = Math.round((totalRatio / matched.length) * 100);
          if (computedProgress === goal.progress) return goal;

          changed = true;
          const reached100 = computedProgress >= 100 && goal.progress < 100;
          if (reached100) {
            setTimeout(() => {
              const awarded = awardXP(40, {
                key: `goal_complete_${goal.id}`,
                reason: `Goal Achieved: ${goal.title}`,
                source: 'goal',
                entityId: goal.id
              });
              if (awarded) {
                showToast(`Goal achieved: ${goal.title} (+40 XP)`, 'success');
              }
            }, 0);
          }

          return {
            ...goal,
            progress: computedProgress,
            status: computedProgress >= 100 ? ('completed' as const) : ('active' as const),
            completedAt: computedProgress >= 100 ? goal.completedAt || new Date().toISOString() : undefined
          };
        });
        return changed ? nextGoals : prevGoals;
      });
    },
    [awardXP, showToast]
  );

  // Scroll shadow effect
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowTopShadow(scrollTop > 0);
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 10);
  };

  const handleTabChange = useCallback(
    (newTab: string, category?: string) => {
      playSound('click');
      if (newTab === activeTab && !category) return;
      setTabHistory((prev) => [...prev.slice(-19), newTab]);
      setActiveTab(newTab);
      if (category) setSettingsCategory(category);
      else setSettingsCategory(undefined);
    },
    [activeTab]
  );

  const handleBack = () => {
    if (tabHistory.length <= 1) {
      handleTabChange('hub');
      return;
    }
    const newHistory = [...tabHistory];
    newHistory.pop();
    const prevTab = newHistory[newHistory.length - 1];
    setTabHistory(newHistory);
    setActiveTab(prevTab);
  };

  // Listen for navigation events
  useEffect(() => {
    const handleNavToSettings = (e: any) => handleTabChange('settings', e.detail?.category);
    window.addEventListener('nav-to-settings', handleNavToSettings);
    return () => window.removeEventListener('nav-to-settings', handleNavToSettings);
  }, [handleTabChange]);

  // Theme, Audio & Motion Appearance Persistence
  useEffect(() => {
    writeScopedJSON('settings', settings);
    setAudioPreferences({
      sound: settings.notifications.sound,
      vibration: settings.notifications.vibration
    });

    const root = window.document.documentElement;
    const isDark =
      settings.appearance.theme === 'dark' ||
      (settings.appearance.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    root.classList.toggle('reduce-motion', !settings.appearance.animations);

    const accent = settings.appearance.accentColor || '#B14AE0';
    root.style.setProperty('--primary', accent);
    root.style.setProperty('--primary-deep', accent + 'cc');

    const hex = accent.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const isLightAccent = (r * 299 + g * 587 + b * 114) / 1000 > 155;
      root.style.setProperty('--on-primary', isLightAccent ? '#000000' : '#FFFFFF');
    }
  }, [settings]);

  // Persist scoped data and update profile discipline metrics
  useEffect(() => {
    writeScopedJSON('habits', habits);
    const totalStreaks = habits.reduce((acc, h) => acc + (h.streak || 0), 0);
    const activeHabits = habits.filter((h) => !h.isArchived && !h.isPaused);
    const momentumScore =
      activeHabits.length > 0
        ? Math.round((activeHabits.filter((h) => h.completedToday).length / activeHabits.length) * 100)
        : 0;

    setUserProfile((prev) => {
      if (prev.totalStreaks === totalStreaks && prev.momentumScore === momentumScore) return prev;
      return { ...prev, totalStreaks, momentumScore };
    });
  }, [habits]);

  useEffect(() => {
    writeScopedJSON('goals', goals);
  }, [goals]);

  useEffect(() => {
    writeScopedJSON('routines', routines);
  }, [routines]);

  useEffect(() => {
    writeScopedJSON('journal', journalEntries);
  }, [journalEntries]);

  useEffect(() => {
    writeScopedJSON('calendar', calendarEntries);
  }, [calendarEntries]);

  useEffect(() => {
    writeScopedJSON('challenges', challenges);
  }, [challenges]);

  useEffect(() => {
    writeScopedJSON('pinned_habits', pinnedHabitIds);
  }, [pinnedHabitIds]);

  useEffect(() => {
    writeScopedJSON('focus_sessions', focusSessions);
  }, [focusSessions]);

  useEffect(() => {
    writeScopedJSON('routine_history', routineHistory);
  }, [routineHistory]);

  useEffect(() => {
    writeScopedJSON('profile', userProfile);
  }, [userProfile]);

  // Compute real live telemetry for badges & analytics
  const totalFocusMinutes = useMemo(() => {
    return focusSessions
      .filter((s) => s.mode === 'focus')
      .reduce((sum, s) => sum + Math.round((s.actualSecondsCompleted || s.durationMinutes * 60) / 60), 0);
  }, [focusSessions]);

  const completedChallengesCount = useMemo(() => {
    return challenges.filter((c) => evaluateChallengeProgress(c, habits, focusSessions).isCompleted).length;
  }, [challenges, habits, focusSessions]);

  // Award Challenge completion XP once when any joined challenge reaches 100%
  useEffect(() => {
    challenges.forEach((c) => {
      if (!c.isJoined) return;
      const progress = evaluateChallengeProgress(c, habits, focusSessions);
      if (progress.isCompleted) {
        const awarded = awardXP(35, {
          key: `challenge_complete_${c.id}`,
          reason: `Completed Challenge: ${c.title}`,
          source: 'challenge',
          entityId: c.id
        });
        if (awarded) {
          showToast(`Challenge completed: ${c.title} (+35 XP)`, 'success');
          playSound('accomplishment');
        }
      }
    });
  }, [challenges, habits, focusSessions, awardXP, showToast]);

  // Single Unified Badge Evaluation System
  const currentBadges = useMemo(() => {
    return evaluateAllBadges(
      habits,
      userProfile,
      routines,
      challenges,
      journalEntries,
      achievements,
      routineHistory.length,
      totalFocusMinutes,
      completedChallengesCount
    );
  }, [
    habits,
    userProfile,
    routines,
    challenges,
    journalEntries,
    achievements,
    routineHistory.length,
    totalFocusMinutes,
    completedChallengesCount
  ]);

  useEffect(() => {
    writeScopedJSON('achievements', currentBadges);
    const prevUnlocked = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id));
    const newlyUnlocked = currentBadges.filter((b) => b.unlocked && !prevUnlocked.has(b.id));

    if (newlyUnlocked.length > 0) {
      setAchievements(currentBadges);
      newlyUnlocked.forEach((badge) => {
        const awarded = awardXP(100, {
          key: `achievement_${badge.id}`,
          reason: `Unlocked Badge: ${badge.title}`,
          source: 'achievement',
          entityId: badge.id
        });
        if (awarded) {
          showToast(`Milestone Unlocked: ${badge.title} (+100 XP)`, 'success');
          playSound('accomplishment');
        }
      });
    }
  }, [currentBadges, achievements, awardXP, showToast]);

  // Debounced Firestore Cloud Sync for authenticated users
  useEffect(() => {
    if (!firebaseUser || !cloudHydratedRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const uid = firebaseUser.uid;
        const okResults = await Promise.all([
          syncUserDocMetadataToFirestore(uid, {
            profile: userProfile,
            settings,
            achievements,
            pinnedHabitIds,
            calendarEntries,
            routineHistory,
            xpTransactions
          }),
          syncCollectionToFirestore(uid, 'habits', habits),
          syncCollectionToFirestore(uid, 'goals', goals),
          syncCollectionToFirestore(uid, 'routines', routines),
          syncCollectionToFirestore(uid, 'journal', journalEntries),
          syncCollectionToFirestore(uid, 'focus_sessions', focusSessions),
          syncCollectionToFirestore(uid, 'completion_records', Object.values(loadCompletionRecords()))
        ]);

        if (okResults.some((ok) => !ok) && !syncErrorShownRef.current) {
          syncErrorShownRef.current = true;
          showToast('Cloud sync is temporarily unavailable; your data remains saved locally.', 'error');
        }
      } catch {
        // Handled cleanly inside storageSync
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    firebaseUser,
    userProfile,
    settings,
    achievements,
    pinnedHabitIds,
    calendarEntries,
    routineHistory,
    xpTransactions,
    habits,
    goals,
    routines,
    journalEntries,
    focusSessions,
    showToast
  ]);

  // Idempotent Habit Progress & Events Engine
  const handleHabitProgress = useCallback(
    (id: string, newValue: number, meta?: { source?: string }) => {
      const todayKey = getTodayKey();
      const currentHabit = habits.find((h) => h.id === id);
      if (!currentHabit) return;

      const targetVal = Math.max(
        1,
        currentHabit.targetValue ||
          (currentHabit.type === 'timing' ? 15 : currentHabit.type === 'quantitative' ? 10 : 1)
      );
      const sanitizedNewVal = Math.max(0, newValue);
      const willBeCompleted = sanitizedNewVal >= targetVal;
      const now = new Date();

      const transaction = processHabitCompletionTransaction(
        currentHabit,
        willBeCompleted,
        sanitizedNewVal,
        todayKey,
        userProfile.totalLifetimeXP || 0
      );

      let nextHabitsSnapshot: Habit[] = [];
      setHabits((prevHabits) => {
        nextHabitsSnapshot = prevHabits.map((h) => {
          if (h.id !== id) return h;
          const updatedHistory = { ...(h.history || {}), [todayKey]: sanitizedNewVal };

          let lastCompletedAt = h.lastCompletedAt;
          let nextResetAt = h.nextResetAt;
          const cycleId =
            h.cycleId || `cycle_${now.getTime()}_${Math.random().toString(36).substring(2, 8)}`;
          const cycleStartedAt = h.cycleStartedAt || now.toISOString();

          if (willBeCompleted && !h.completedToday) {
            lastCompletedAt = now.toISOString();
            nextResetAt = getNextCalendarDayResetISO(now);
          } else if (!willBeCompleted && h.completedToday) {
            lastCompletedAt = undefined;
            nextResetAt = undefined;
          }

          const newEvent: AmendmentEvent = {
            id: `evt_${now.getTime()}_${Math.random().toString(36).substring(2, 6)}`,
            habitId: h.id,
            type:
              h.type === 'binary'
                ? 'check'
                : h.type === 'timing'
                ? meta?.source === 'focus_session'
                  ? 'timing_session'
                  : 'timing_add'
                : 'count',
            value: h.type === 'binary' ? willBeCompleted : sanitizedNewVal,
            timestamp: now.toISOString(),
            notes: meta?.source,
            version: '2.0'
          };

          const mergedHabit: Habit = {
            ...h,
            currentValue: sanitizedNewVal,
            completedToday: willBeCompleted,
            history: updatedHistory,
            events: [...(h.events || []).slice(-199), newEvent],
            lastCompletedAt,
            nextResetAt,
            cycleId,
            cycleStartedAt
          };

          const newStreak = calculateHabitStreak(mergedHabit, now);
          const longestStreak = calculateLongestStreak({ ...mergedHabit, streak: newStreak }, now);

          return {
            ...mergedHabit,
            streak: newStreak,
            longestStreak
          };
        });
        return nextHabitsSnapshot;
      });

      // Defer goal sync until after state commit using computed snapshot
      setTimeout(() => {
        if (nextHabitsSnapshot.length > 0) {
          syncLinkedGoalsWithHabits(nextHabitsSnapshot);
        }
      }, 0);

      setXpTransactions(loadXPTransactions());

      if (transaction.xpDelta !== 0) {
        setXpNotifications((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, xp: transaction.xpDelta }
        ]);
      }

      if (transaction.isLevelUp) {
        setLevelUpData({
          oldLevel: transaction.oldLevel,
          newLevel: transaction.newLevel
        });
        setShowConfetti(true);
        playSound('accomplishment');
        setTimeout(() => setShowConfetti(false), 3200);
      } else if (transaction.xpDelta > 0) {
        playSound('accomplishment');
      }

      const newLevelInfo = calculateLevelProgression(transaction.newTotalXP);
      setUserProfile((prev) => ({
        ...prev,
        totalLifetimeXP: transaction.newTotalXP,
        currentXP: newLevelInfo.currentTierXP,
        currentLevel: newLevelInfo.level,
        xpToNextLevel: newLevelInfo.xpToNextLevel,
        levelProgress: newLevelInfo.progressFraction
      }));
    },
    [habits, userProfile.totalLifetimeXP, syncLinkedGoalsWithHabits]
  );

  const handleHabitToggle = useCallback(
    (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;
      const targetVal =
        habit.targetValue || (habit.type === 'timing' ? 15 : habit.type === 'quantitative' ? 10 : 1);
      const isCompleting = !habit.completedToday;
      const nextValue = isCompleting ? targetVal : 0;
      handleHabitProgress(id, nextValue, { source: 'manual_toggle' });
    },
    [habits, handleHabitProgress]
  );

  // Cascade Delete Habit across habits, pins, goals, routines
  const handleDeleteHabit = useCallback(
    (id: string) => {
      const habitToDelete = habits.find((h) => h.id === id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setPinnedHabitIds((prev) => prev.filter((pid) => pid !== id));

      if (habitToDelete) {
        setGoals((currentGoals) => {
          const { updatedGoals } = cascadeDeleteHabit(
            habitToDelete.id,
            habitToDelete.name,
            currentGoals,
            routines
          );
          return updatedGoals;
        });
        setRoutines((currentRoutines) => {
          const { updatedRoutines } = cascadeDeleteHabit(
            habitToDelete.id,
            habitToDelete.name,
            goals,
            currentRoutines
          );
          return updatedRoutines;
        });
        showToast(`Deleted "${habitToDelete.name}"`, 'info');
      }
    },
    [habits, goals, routines, showToast]
  );

  // Save / Edit Habit with Target & Difficulty XP Reconciliation
  const handleSaveHabit = useCallback(
    (habitData: any) => {
      const now = new Date();
      const todayKey = getTodayKey(now);

      if (habitData.id && habits.some((h) => h.id === habitData.id)) {
        const prevHabit = habits.find((h) => h.id === habitData.id)!;
        const merged: Habit = { ...prevHabit, ...habitData };
        const newTarget = Math.max(
          1,
          merged.targetValue || (merged.type === 'timing' ? 15 : merged.type === 'quantitative' ? 10 : 1)
        );

        const nextCompletedToday =
          merged.type === 'binary'
            ? Boolean(merged.completedToday)
            : (merged.currentValue || 0) >= newTarget;

        const reconciledHabit: Habit = {
          ...merged,
          targetValue: newTarget,
          completedToday: nextCompletedToday,
          lastCompletedAt: nextCompletedToday ? merged.lastCompletedAt || now.toISOString() : undefined,
          nextResetAt: nextCompletedToday
            ? merged.nextResetAt || getNextCalendarDayResetISO(now)
            : undefined
        };

        const tx = processHabitCompletionTransaction(
          reconciledHabit,
          nextCompletedToday,
          reconciledHabit.currentValue || 0,
          todayKey,
          userProfile.totalLifetimeXP || 0
        );

        if (tx.xpDelta !== 0) {
          setXpTransactions(loadXPTransactions());
          const newLevelInfo = calculateLevelProgression(tx.newTotalXP);
          setUserProfile((prev) => ({
            ...prev,
            totalLifetimeXP: tx.newTotalXP,
            currentXP: newLevelInfo.currentTierXP,
            currentLevel: newLevelInfo.level,
            xpToNextLevel: newLevelInfo.xpToNextLevel,
            levelProgress: newLevelInfo.progressFraction
          }));
          setXpNotifications((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, xp: tx.xpDelta }
          ]);
        }

        const updatedStreak = calculateHabitStreak(reconciledHabit, now);
        const longestStreak = calculateLongestStreak({ ...reconciledHabit, streak: updatedStreak }, now);

        setHabits((prev) =>
          prev.map((h) =>
            h.id === reconciledHabit.id
              ? { ...reconciledHabit, streak: updatedStreak, longestStreak }
              : h
          )
        );
        showToast(`Updated "${reconciledHabit.name}"`, 'success');
      } else {
        const newHabit: Habit = {
          id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          streak: 0,
          longestStreak: 0,
          completedToday: false,
          currentValue: 0,
          history: {},
          events: [],
          createdAt: now.toISOString(),
          cycleStartedAt: now.toISOString(),
          cycleId: `cycle_${now.getTime()}_${Math.random().toString(36).substring(2, 8)}`,
          ...habitData
        };
        setHabits((prev) => [newHabit, ...prev]);
        showToast(`Created habit "${newHabit.name}"`, 'success');
      }
    },
    [habits, userProfile.totalLifetimeXP, showToast]
  );

  // Centralized Smart Widgets Top-3 Pinning
  const handleTogglePinHabit = useCallback(
    (habitId: string) => {
      setPinnedHabitIds((prev) => {
        const exists = prev.includes(habitId);
        let nextPinned: string[];
        if (exists) {
          nextPinned = prev.filter((id) => id !== habitId);
          showToast('Unpinned from Smart Widgets', 'info');
        } else {
          if (prev.length >= 3) {
            nextPinned = [...prev.slice(0, 2), habitId];
          } else {
            nextPinned = [...prev, habitId];
          }
          showToast('Pinned to Smart Widgets', 'success');
        }

        setHabits((currentHabits) =>
          currentHabits.map((h) => ({
            ...h,
            isPinned: nextPinned.includes(h.id),
            pinnedPriority: nextPinned.indexOf(h.id) >= 0 ? nextPinned.indexOf(h.id) + 1 : undefined
          }))
        );
        return nextPinned;
      });
      playSound('click');
    },
    [showToast]
  );

  const handleSavePinnedHabits = useCallback((newIds: string[]) => {
    const clamped = newIds.slice(0, 3);
    setPinnedHabitIds(clamped);
    setHabits((prev) =>
      prev.map((h) => ({
        ...h,
        isPinned: clamped.includes(h.id),
        pinnedPriority: clamped.indexOf(h.id) >= 0 ? clamped.indexOf(h.id) + 1 : undefined
      }))
    );
  }, []);

  // Account & Data Lifecycle Handlers
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      showToast(`Signed in as ${result.user.displayName || result.user.email}`, 'success');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') return;
      showToast(
        'Google sign-in popup unavailable in this preview context. Your local workspace remains active.',
        'info'
      );
    }
  };

  const handleLogout = async () => {
    if (firebaseUser) {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
    }
    setIsStarted(false);
    handleTabChange('hub');
    setShowLogoutConfirm(false);
    showToast('Signed out cleanly', 'info');
  };

  const handleExportAllData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      appVersion: '2.4.0',
      userProfile,
      settings,
      habits,
      goals,
      routines,
      journalEntries,
      calendarEntries,
      challenges,
      achievements: currentBadges,
      focusSessions,
      routineHistory,
      xpTransactions
    };
    triggerBrowserDownload(
      `energoals-backup-${getTodayKey()}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
    showToast('Full EnerGoals data exported as JSON', 'success');
  };

  const handleEraseAllData = async () => {
    if (firebaseUser) {
      await deleteUserFirestoreData(firebaseUser.uid);
    }
    clearScopedStorage();
    setHabits([]);
    setGoals([]);
    setRoutines([]);
    setJournalEntries([]);
    setCalendarEntries([]);
    setChallenges(createInitialChallenges());
    setAchievements(INITIAL_ACHIEVEMENTS);
    setPinnedHabitIds([]);
    setFocusSessions([]);
    setRoutineHistory([]);
    setXpTransactions([]);
    setUserProfile(syncProfileLevelFields(DEFAULT_PROFILE));
    showToast('All fitness data and history erased.', 'info');
  };

  const handleDeleteAccount = async () => {
    if (firebaseUser) {
      await deleteUserFirestoreData(firebaseUser.uid);
      try {
        await deleteUser(firebaseUser);
      } catch {
        await signOut(auth).catch(() => {});
      }
    }
    clearScopedStorage();
    setHabits([]);
    setGoals([]);
    setRoutines([]);
    setJournalEntries([]);
    setCalendarEntries([]);
    setChallenges(createInitialChallenges());
    setAchievements(INITIAL_ACHIEVEMENTS);
    setPinnedHabitIds([]);
    setFocusSessions([]);
    setRoutineHistory([]);
    setXpTransactions([]);
    setUserProfile(syncProfileLevelFields(DEFAULT_PROFILE));
    setIsStarted(false);
    handleTabChange('hub');
    showToast('Account and workspace data deleted.', 'info');
  };

  if (!isStarted) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <LandingPage
          onStart={() => {
            setIsStarted(true);
            setShowWelcome(true);
          }}
          onNavigateToPricing={() => {
            setIsStarted(true);
            handleTabChange('settings', 'billing');
          }}
        />
      </>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen onContinue={() => setShowWelcome(false)} />;
  }

  return (
    <div className="flex min-h-screen bg-bg-dark text-platinum transition-colors duration-250">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Floating XP Notifications */}
      <AnimatePresence>
        {xpNotifications.map((notification) => (
          <XPNotification
            key={notification.id}
            xp={notification.xp}
            onComplete={() =>
              setXpNotifications((prev) => prev.filter((n) => n.id !== notification.id))
            }
          />
        ))}
      </AnimatePresence>

      {/* Level Up Celebration Screen */}
      <LevelUpModal
        isOpen={levelUpData !== null}
        onClose={() => setLevelUpData(null)}
        oldLevel={levelUpData?.oldLevel || 1}
        newLevel={levelUpData?.newLevel || 1}
        totalXP={userProfile.totalLifetimeXP || 0}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userProfile={userProfile}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onLogout={() => setShowLogoutConfirm(true)}
        className="hidden lg:flex"
      />

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-3xl border border-error/20 max-w-sm w-full text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
              <LogOut className="w-10 h-10 text-error" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">Secure Logout</h3>
              <p className="text-platinum/40">Are you sure you want to end your current session?</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutConfirm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="btn-primary bg-error hover:bg-error-dark border-error flex-1"
              >
                Log Out
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSave={(updated) => {
          setUserProfile(updated);
          showToast('Profile saved', 'success');
        }}
        setActiveTab={handleTabChange}
      />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <MobileHeader
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          userProfile={userProfile}
          onEditProfile={() => setIsProfileModalOpen(true)}
          onBack={handleBack}
          showBack={activeTab !== 'hub'}
        />

        <main
          className={cn(
            'flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8 transition-shadow duration-300',
            showTopShadow ? 'shadow-[inset_0_20px_20px_-20px_rgba(0,0,0,0.5)]' : '',
            showBottomShadow ? 'shadow-[inset_0_-20px_20px_-20px_rgba(0,0,0,0.5)]' : ''
          )}
          onScroll={handleScroll}
        >
          <div className="responsive-container">
            {activeTab !== 'hub' && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleBack}
                className="hidden lg:flex items-center gap-2 text-platinum/40 hover:text-primary transition-colors mb-6 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Go Back</span>
              </motion.button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {activeTab === 'hub' && (
                  <AppHub
                    setActiveTab={handleTabChange}
                    userProfile={userProfile}
                    habits={habits}
                    goals={goals}
                    challenges={challenges}
                    onLogout={() => setShowLogoutConfirm(true)}
                  />
                )}
                {activeTab === 'dashboard' && (
                  <Dashboard
                    habits={habits}
                    setHabits={setHabits}
                    toggleHabit={handleHabitToggle}
                    onUpdateHabitProgress={handleHabitProgress}
                    onSaveHabit={handleSaveHabit}
                    onDeleteHabit={handleDeleteHabit}
                    pinnedHabitIds={pinnedHabitIds}
                    onTogglePinHabit={handleTogglePinHabit}
                    onSavePinnedHabits={handleSavePinnedHabits}
                    onStartFocus={(h) => {
                      setFocusHabitId(h?.id);
                      setIsFocusSessionOpen(true);
                    }}
                    onAddXP={awardXP}
                    userProfile={userProfile}
                    setActiveTab={handleTabChange}
                  />
                )}
                {activeTab === 'goals' && (
                  <GoalsOverview
                    goals={goals}
                    setGoals={setGoals}
                    habits={habits}
                    addXP={awardXP}
                    showToast={showToast}
                  />
                )}
                {activeTab === 'routines' && !activeRoutine && (
                  <RoutinesOverview
                    routines={routines}
                    setRoutines={setRoutines}
                    habits={habits}
                    routineHistory={routineHistory}
                    onStartRoutine={setActiveRoutine}
                    showToast={showToast}
                  />
                )}
                {activeTab === 'routines' && activeRoutine && (
                  <RoutineExecutionView
                    routine={activeRoutine}
                    habits={habits}
                    onToggleLinkedHabit={(habitId) => handleHabitToggle(habitId)}
                    onBack={() => setActiveRoutine(null)}
                    onComplete={(stats) => {
                      const todayKey = getTodayKey();
                      const awarded = awardXP(20, {
                        key: `routine_${activeRoutine.id}_${todayKey}`,
                        reason: `Completed Routine: ${activeRoutine.name}`,
                        source: 'routine',
                        entityId: activeRoutine.id
                      });
                      const record: RoutineCompletionRecord = {
                        id: `rrec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        routineId: activeRoutine.id,
                        routineName: activeRoutine.name,
                        date: todayKey,
                        durationSeconds: stats?.elapsedSeconds || 0,
                        stepsCompleted: stats?.stepsCompleted ?? activeRoutine.habits.length,
                        totalSteps: activeRoutine.habits.length,
                        xpEarned: awarded ? 20 : 0,
                        completedAt: new Date().toISOString()
                      };
                      setRoutineHistory((prev) => [record, ...prev.slice(0, 199)]);
                      setActiveRoutine(null);
                      playSound('accomplishment');
                      setShowConfetti(true);
                      setTimeout(() => setShowConfetti(false), 2500);
                      showToast(
                        awarded
                          ? `Completed ${activeRoutine.name} (+20 XP)`
                          : `Completed ${activeRoutine.name} (Daily XP already earned today)`,
                        'success'
                      );
                    }}
                  />
                )}
                {activeTab === 'analytics' && (
                  <AnalyticsDashboard
                    habits={habits}
                    goals={goals}
                    routines={routines}
                    journalEntries={journalEntries}
                    focusSessions={focusSessions}
                    xpTransactions={xpTransactions}
                    showToast={showToast}
                  />
                )}
                {activeTab === 'journal' && (
                  <JournalOverview
                    entries={journalEntries}
                    setEntries={setJournalEntries}
                    addXP={awardXP}
                    showToast={showToast}
                  />
                )}
                {activeTab === 'coach' && (
                  <AICoach
                    habits={habits}
                    goals={goals}
                    routines={routines}
                    journalEntries={journalEntries}
                    focusSessions={focusSessions}
                    userProfile={userProfile}
                    onSaveHabit={handleSaveHabit}
                    setHabits={setHabits}
                    setGoals={setGoals}
                    setRoutines={setRoutines}
                    setJournalEntries={setJournalEntries}
                    challenges={challenges}
                    setActiveTab={handleTabChange}
                    showToast={showToast}
                  />
                )}
                {activeTab === 'challenges' && (
                  <ChallengesOverview
                    challenges={challenges}
                    setChallenges={setChallenges}
                    habits={habits}
                    focusSessions={focusSessions}
                    addXP={awardXP}
                    showToast={showToast}
                  />
                )}
                {activeTab === 'rewards' && (
                  <RewardsOverview achievements={currentBadges} userProfile={userProfile} />
                )}
                {activeTab === 'calendar' && (
                  <CalendarSection
                    entries={calendarEntries}
                    setEntries={setCalendarEntries}
                    habits={habits}
                    routines={routines}
                    goals={goals}
                    focusSessions={focusSessions}
                    calendarSettings={settings.calendar}
                    onToggleHabit={(id) => handleHabitToggle(id)}
                  />
                )}
                {activeTab === 'habits' && (
                  <HabitsOverview
                    habits={habits}
                    setHabits={setHabits}
                    toggleHabit={handleHabitToggle}
                    onUpdateHabitProgress={handleHabitProgress}
                    onDeleteHabit={handleDeleteHabit}
                    onSaveHabit={handleSaveHabit}
                    pinnedHabitIds={pinnedHabitIds}
                    onTogglePinHabit={handleTogglePinHabit}
                    onStartFocus={(h) => {
                      setFocusHabitId(h?.id);
                      setIsFocusSessionOpen(true);
                    }}
                    userProfile={userProfile}
                    onAddXP={awardXP}
                  />
                )}
                {activeTab === 'settings' && (
                  <SettingsOverview
                    settings={settings}
                    setSettings={setSettings}
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    initialCategory={settingsCategory}
                    firebaseUser={firebaseUser}
                    isCloudSyncing={isCloudSyncing}
                    onGoogleSignIn={handleGoogleSignIn}
                    onLogout={handleLogout}
                    onExportAllData={handleExportAllData}
                    onEraseAllData={handleEraseAllData}
                    onDeleteAccount={handleDeleteAccount}
                    showToast={showToast}
                  />
                )}

                {![
                  'hub',
                  'dashboard',
                  'goals',
                  'routines',
                  'analytics',
                  'journal',
                  'coach',
                  'challenges',
                  'rewards',
                  'calendar',
                  'settings',
                  'habits'
                ].includes(activeTab) && (
                  <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-primary/20" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-widest">
                        {activeTab} Section
                      </h2>
                      <p className="text-platinum/40 max-w-md">
                        Module ready. Select a section from the navigation to continue.
                      </p>
                    </div>
                    <button onClick={() => handleTabChange('dashboard')} className="btn-secondary">
                      Return to Dashboard
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global Persistent Focus Session Overlay */}
      <FocusSessionOverlay
        isOpen={isFocusSessionOpen}
        onClose={() => {
          setIsFocusSessionOpen(false);
          setFocusHabitId(undefined);
        }}
        habits={habits}
        preselectedHabitId={focusHabitId}
        onUpdateHabitProgress={handleHabitProgress}
        onAddXP={awardXP}
        userProfile={userProfile}
        onSessionSaved={(record) => {
          setFocusSessions((prev) => [record, ...prev.slice(0, 199)]);
          showToast(
            record.xpEarned > 0
              ? `Focus session completed (+${record.xpEarned} XP)`
              : 'Focus break completed',
            'success'
          );
        }}
      />

      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-64 w-[300px] h-[300px] bg-primary-deep/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
      <Confetti show={showConfetti} />
      <DailyCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => {
          setIsCheckInModalOpen(false);
          setUserProfile((prev) => ({ ...prev, lastCheckInDate: new Date().toDateString() }));
        }}
      />
    </div>
  );
}
