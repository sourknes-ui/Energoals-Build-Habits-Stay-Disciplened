import { Habit, HabitDifficulty, CompletionRecord, XPTransaction } from '../types';
import { readScopedJSON, writeScopedJSON } from './storageSync';

export const DIFFICULTY_XP_MAP: Record<HabitDifficulty, number> = {
  'Easy': 10,
  'Medium': 20,
  'Hard': 35,
  'Very Hard': 50,
};

export const DIFFICULTY_COLORS: Record<HabitDifficulty, { bg: string; text: string; border: string; dot: string }> = {
  'Easy': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: '#10B981' },
  'Medium': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', dot: '#38BDF8' },
  'Hard': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: '#F59E0B' },
  'Very Hard': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: '#A855F7' },
};

export const MOTIVATIONAL_QUOTES: string[] = [
  "Small actions. Big results.",
  "Consistency is building your future.",
  "Another win. Keep going.",
  "Discipline turns intentions into results.",
  "Every rep counts. Great execution!",
  "Momentum builds one habit at a time.",
  "Focus creates mastery. Outstanding work.",
  "You showed up today. That is what counts.",
  "Daily steps lead to lifelong transformation.",
  "Streak protected. Keep the fire burning!"
];

export const getRandomMotivationalQuote = (): string => {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
};

/**
 * Infer habit difficulty if not explicitly set
 */
export const inferHabitDifficulty = (habit: Partial<Habit>): HabitDifficulty => {
  if (habit.difficulty) return habit.difficulty;

  const type = habit.type || 'binary';
  const target = habit.targetValue || 1;

  if (type === 'timing') {
    const isHours = habit.unit?.toLowerCase().includes('hour') || habit.unit?.toLowerCase() === 'h' || habit.unit?.toLowerCase() === 'hr';
    const minutes = isHours ? target * 60 : target;
    if (minutes <= 15) return 'Easy';
    if (minutes <= 30) return 'Medium';
    if (minutes <= 60) return 'Hard';
    return 'Very Hard';
  }

  if (type === 'quantitative') {
    if (target <= 5) return 'Easy';
    if (target <= 20) return 'Medium';
    if (target <= 50) return 'Hard';
    return 'Very Hard';
  }

  // Binary (Yes/No) habits default to Medium (20 XP) or Easy (10 XP) based on name keywords
  const name = (habit.name || '').toLowerCase();
  if (name.includes('water') || name.includes('vitamin') || name.includes('teeth') || name.includes('bed')) {
    return 'Easy';
  }
  if (name.includes('workout') || name.includes('run') || name.includes('study') || name.includes('cold') || name.includes('deep')) {
    return 'Hard';
  }
  return 'Medium';
};

/**
 * Get accurate XP award value for a habit
 */
export const getHabitXP = (habit: Partial<Habit>): number => {
  const difficulty = habit.difficulty || inferHabitDifficulty(habit);
  return DIFFICULTY_XP_MAP[difficulty] || 20;
};

export interface LevelDefinition {
  level: number;
  startXP: number;
  endXP: number;
  title: string;
  milestone: string;
  perks: string[];
  color: string;
  xpRangeFormatted: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  milestone: string;
  tierStartXP: number;
  tierEndXP: number;
  currentTierXP: number;
  xpNeededForTier: number;
  xpToNextLevel: number;
  progressFraction: number; // 0.0 to 1.0
  unlockedPerks: string[];
  themeColor: string;
  xpRangeFormatted: string;
}

export const formatXPRange = (start: number, end: number): string => {
  return `${start.toLocaleString()}–${end.toLocaleString()} XP`;
};

/**
 * Pre-configured Level Definitions for Levels 1 to 25.
 * Matches exact user requirements for Levels 1–10 and extends with continuous progression.
 */
export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  {
    level: 1,
    startXP: 0,
    endXP: 500,
    title: 'The Beginning',
    milestone: 'Start building consistency and laying the foundation.',
    perks: ['Daily Streak Tracking', 'Simple & Binary Habit Tracking', 'Base XP Rewards'],
    color: '#10B981',
    xpRangeFormatted: '0–500 XP'
  },
  {
    level: 2,
    startXP: 500,
    endXP: 1200,
    title: 'First Steps',
    milestone: 'Complete your first major consistency milestone.',
    perks: ['Quantitative Habit Tracking', '3-Day Streak Bonus', 'Streak Freeze Protection'],
    color: '#06B6D4',
    xpRangeFormatted: '500–1,200 XP'
  },
  {
    level: 3,
    startXP: 1200,
    endXP: 2200,
    title: 'Momentum',
    milestone: 'Build a reliable daily rhythm and steady discipline.',
    perks: ['Timed Habit Sessions', 'Deep Work Countdown Flow', 'Weekly Goals Synchronization'],
    color: '#3B82F6',
    xpRangeFormatted: '1,200–2,200 XP'
  },
  {
    level: 4,
    startXP: 2200,
    endXP: 3500,
    title: 'Committed',
    milestone: 'Prove that consistency is becoming a dependable habit.',
    perks: ['Custom Routine Stacking', 'Habit Difficulty Tiers (+35 XP)', '7-Day Streak Badges'],
    color: '#6366F1',
    xpRangeFormatted: '2,200–3,500 XP'
  },
  {
    level: 5,
    startXP: 3500,
    endXP: 5100,
    title: 'Disciplined',
    milestone: 'Maintain your habits with stronger resistance and clarity.',
    perks: ['Deep Analytics & Trends', 'Custom Ambient Soundscapes', 'Priority Habit Filters'],
    color: '#8B5CF6',
    xpRangeFormatted: '3,500–5,100 XP'
  },
  {
    level: 6,
    startXP: 5100,
    endXP: 7000,
    title: 'Focused',
    milestone: 'Stay committed even when external motivation fluctuates.',
    perks: ['Hard Habits Multiplier (+35 XP)', 'Anti-Procrastination Prompts', '14-Day Streak Trophy'],
    color: '#A855F7',
    xpRangeFormatted: '5,100–7,000 XP'
  },
  {
    level: 7,
    startXP: 7000,
    endXP: 9300,
    title: 'Unstoppable',
    milestone: 'Build serious momentum across all your life domains.',
    perks: ['Very Hard Habits (+50 XP)', 'Sprint Flow Focus Sessions', 'Community Challenge Host'],
    color: '#B14AE0',
    xpRangeFormatted: '7,000–9,300 XP'
  },
  {
    level: 8,
    startXP: 9300,
    endXP: 12000,
    title: 'Elite',
    milestone: 'Demonstrate a high standard of precision and endurance.',
    perks: ['Elite 30-Day Streak Shield', 'Momentum Velocity Analyzer', 'Prestige Profile Accent'],
    color: '#EC4899',
    xpRangeFormatted: '9,300–12,000 XP'
  },
  {
    level: 9,
    startXP: 12000,
    endXP: 15200,
    title: 'Mastery',
    milestone: 'Turn discipline into an automatic, joyful lifestyle.',
    perks: ['Apex Multiplier (1.25x)', 'Cross-Category Habit Synergy', 'Mastery Milestone Vault'],
    color: '#F43F5E',
    xpRangeFormatted: '12,000–15,200 XP'
  },
  {
    level: 10,
    startXP: 15200,
    endXP: 19000,
    title: 'Transformation',
    milestone: 'Reach a defining personal-growth transformation.',
    perks: ['Transformation Master Trophy', 'Lifetime Habit Immortality', 'Apex Leaderboard Crown'],
    color: '#F59E0B',
    xpRangeFormatted: '15,200–19,000 XP'
  },
  {
    level: 11,
    startXP: 19000,
    endXP: 23500,
    title: 'Peak Performance',
    milestone: 'Execute with relentless daily clarity and precision.',
    perks: ['Precision Habit Stacking', 'Apex Deep Work Analytics', 'Grand Milestone Insignia'],
    color: '#10B981',
    xpRangeFormatted: '19,000–23,500 XP'
  },
  {
    level: 12,
    startXP: 23500,
    endXP: 28700,
    title: 'Unyielding',
    milestone: 'Overcome high-friction days without breaking your daily rhythm.',
    perks: ['Unbreakable Streak Armor', 'Resilience Insight Reports', 'Titan Profile Badge'],
    color: '#06B6D4',
    xpRangeFormatted: '23,500–28,700 XP'
  },
  {
    level: 13,
    startXP: 28700,
    endXP: 34700,
    title: 'Architect',
    milestone: 'Build an entire daily lifestyle architecture centered around your core values.',
    perks: ['Architectural Routine Frameworks', 'Custom Habit Archetypes', 'Master Tier Challenges'],
    color: '#3B82F6',
    xpRangeFormatted: '28,700–34,700 XP'
  },
  {
    level: 14,
    startXP: 34700,
    endXP: 41500,
    title: 'Sovereign',
    milestone: 'Command complete self-mastery over your daily routines and focus.',
    perks: ['Sovereignty Time Allocation Engine', 'Apex Focus Modes', 'Gold Prestige Trim'],
    color: '#8B5CF6',
    xpRangeFormatted: '34,700–41,500 XP'
  },
  {
    level: 15,
    startXP: 41500,
    endXP: 49200,
    title: 'Zenith',
    milestone: 'Attain a pinnacle of seamless execution across all life dimensions.',
    perks: ['Zenith Multiplier (1.5x)', 'Holistic Life Score Card', 'Diamond Rank Insignia'],
    color: '#A855F7',
    xpRangeFormatted: '41,500–49,200 XP'
  },
  {
    level: 16,
    startXP: 49200,
    endXP: 57800,
    title: 'Titan',
    milestone: 'Solidify unbreakable mental endurance and habit permanence.',
    perks: ['Titan Longevity Protocols', 'Infinite Streak Vault', 'Apex Challenger Status'],
    color: '#B14AE0',
    xpRangeFormatted: '49,200–57,800 XP'
  },
  {
    level: 17,
    startXP: 57800,
    endXP: 67400,
    title: 'Apex Luminary',
    milestone: 'Live as an inspiring benchmark of personal growth and focus.',
    perks: ['Luminary Community Accents', 'AI Coach Master Tuning', 'Prestige Aura'],
    color: '#EC4899',
    xpRangeFormatted: '57,800–67,400 XP'
  },
  {
    level: 18,
    startXP: 67400,
    endXP: 78000,
    title: 'Grandmaster',
    milestone: 'Cultivate effortless automaticity in high-leverage daily habits.',
    perks: ['Effortless Flow Automation', 'Grandmaster Profile Theme', 'Lifetime Legacy Badges'],
    color: '#F43F5E',
    xpRangeFormatted: '67,400–78,000 XP'
  },
  {
    level: 19,
    startXP: 78000,
    endXP: 89700,
    title: 'Invincible',
    milestone: 'Hold unbroken discipline through prolonged periods of high demand.',
    perks: ['Invincible Streak Defense', 'Zero-Friction Habit Engine', 'Obsidian Crest'],
    color: '#F59E0B',
    xpRangeFormatted: '78,000–89,700 XP'
  },
  {
    level: 20,
    startXP: 89700,
    endXP: 102600,
    title: 'Transcendence',
    milestone: 'Redefine your potential through continuous, lifelong habit mastery.',
    perks: ['Transcendence Eternal Trophy', 'Master of All Domains', 'Ultimate Apex Multiplier'],
    color: '#EAB308',
    xpRangeFormatted: '89,700–102,600 XP'
  }
];

/**
 * Shared Level 21+ bounds calculator so getLevelDefinition & calculateLevelProgression never diverge
 */
const getExtendedLevelBounds = (lvl: number): { startXP: number; endXP: number } => {
  let startXP = LEVEL_DEFINITIONS[LEVEL_DEFINITIONS.length - 1].endXP;
  let currentLvl = LEVEL_DEFINITIONS.length + 1;
  let span = 14000;

  while (currentLvl < lvl) {
    startXP += span;
    span += 1000;
    currentLvl += 1;
  }

  return { startXP, endXP: startXP + span };
};

/**
 * Generate a level definition dynamically for any level number (Levels 1 to 100+)
 */
export const getLevelDefinition = (lvl: number): LevelDefinition => {
  if (lvl <= LEVEL_DEFINITIONS.length && lvl >= 1) {
    return LEVEL_DEFINITIONS[lvl - 1];
  }

  const { startXP, endXP } = getExtendedLevelBounds(lvl);
  const TITLES_EXTENDED = [
    'Pinnacle', 'Legend', 'Immortal', 'Infinite Horizon', 'Ascendant',
    'Vanguard', 'Paragon', 'Omnipresent', 'Luminary Prime', 'Mythic Sovereign'
  ];
  const title = TITLES_EXTENDED[(lvl - 21) % TITLES_EXTENDED.length] + (lvl > 30 ? ` Tier ${Math.floor((lvl - 20) / 10)}` : '');
  const milestone = `Sustain world-class execution across Level ${lvl} milestones and self-discipline.`;

  return {
    level: lvl,
    startXP,
    endXP,
    title,
    milestone,
    perks: [`Level ${lvl} Prestige Multiplier`, 'Supreme Habit Legacy', 'Apex Mastery Insignia'],
    color: '#B14AE0',
    xpRangeFormatted: formatXPRange(startXP, endXP)
  };
};

/**
 * Get all level definitions up to a specified level (default: 20)
 */
export const getAllLevelDefinitions = (maxLevel: number = 20): LevelDefinition[] => {
  const result: LevelDefinition[] = [];
  for (let i = 1; i <= maxLevel; i++) {
    result.push(getLevelDefinition(i));
  }
  return result;
};

/**
 * Calculate Level Progression from total Lifetime XP
 */
export const calculateLevelProgression = (totalLifetimeXP: number): LevelInfo => {
  const xp = Math.max(0, Math.round(totalLifetimeXP || 0));

  for (const def of LEVEL_DEFINITIONS) {
    if (xp < def.endXP) {
      const currentTierXP = xp - def.startXP;
      const xpNeededForTier = def.endXP - def.startXP;
      const progressFraction = Math.min(1, Math.max(0, currentTierXP / xpNeededForTier));
      return {
        level: def.level,
        title: def.title,
        milestone: def.milestone,
        tierStartXP: def.startXP,
        tierEndXP: def.endXP,
        currentTierXP,
        xpNeededForTier,
        xpToNextLevel: Math.max(0, def.endXP - xp),
        progressFraction,
        unlockedPerks: def.perks,
        themeColor: def.color,
        xpRangeFormatted: def.xpRangeFormatted
      };
    }
  }

  let currentLevel = LEVEL_DEFINITIONS.length + 1;
  let { startXP: currentStart, endXP: currentEnd } = getExtendedLevelBounds(currentLevel);

  while (xp >= currentEnd && currentLevel < 1000) {
    currentLevel += 1;
    const bounds = getExtendedLevelBounds(currentLevel);
    currentStart = bounds.startXP;
    currentEnd = bounds.endXP;
  }

  const def = getLevelDefinition(currentLevel);
  const currentTierXP = xp - currentStart;
  const xpNeededForTier = Math.max(1, currentEnd - currentStart);
  const progressFraction = Math.min(1, Math.max(0, currentTierXP / xpNeededForTier));

  return {
    level: currentLevel,
    title: def.title,
    milestone: def.milestone,
    tierStartXP: currentStart,
    tierEndXP: currentEnd,
    currentTierXP,
    xpNeededForTier,
    xpToNextLevel: Math.max(0, currentEnd - xp),
    progressFraction,
    unlockedPerks: def.perks,
    themeColor: def.color,
    xpRangeFormatted: formatXPRange(currentStart, currentEnd)
  };
};

/**
 * Storage helpers for idempotent completion records & XP transaction ledger
 */
const COMPLETION_RECORDS_BASE = 'completion_records';
const XP_TRANSACTIONS_BASE = 'xp_transactions';

export const loadCompletionRecords = (): Record<string, CompletionRecord> => {
  return readScopedJSON<Record<string, CompletionRecord>>(COMPLETION_RECORDS_BASE, {});
};

export const saveCompletionRecords = (records: Record<string, CompletionRecord>): void => {
  writeScopedJSON(COMPLETION_RECORDS_BASE, records);
};

export const loadXPTransactions = (): XPTransaction[] => {
  return readScopedJSON<XPTransaction[]>(XP_TRANSACTIONS_BASE, []);
};

export const saveXPTransactions = (transactions: XPTransaction[]): void => {
  writeScopedJSON(XP_TRANSACTIONS_BASE, transactions.slice(-500));
};

export const hasXPTransaction = (key: string, transactions?: XPTransaction[]): boolean => {
  const list = transactions ?? loadXPTransactions();
  return list.some(tx => tx.key === key && tx.amount > 0);
};

export const appendXPTransaction = (
  tx: Omit<XPTransaction, 'id' | 'timestamp'>,
  currentList?: XPTransaction[]
): XPTransaction[] => {
  const list = [...(currentList ?? loadXPTransactions())];
  const entry: XPTransaction = {
    ...tx,
    id: `xp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };
  list.push(entry);
  saveXPTransactions(list);
  return list;
};

export interface CompletionTransactionResult {
  xpDelta: number;
  newTotalXP: number;
  oldLevel: number;
  newLevel: number;
  isLevelUp: boolean;
  isLevelDown: boolean;
  motivationalQuote?: string;
  xpAwarded: number;
  records: Record<string, CompletionRecord>;
}

/**
 * Process an idempotent completion transaction
 */
export const processHabitCompletionTransaction = (
  habit: Habit,
  isCompletedNow: boolean,
  currentValue: number,
  todayKey: string,
  currentTotalXP: number,
  records: Record<string, CompletionRecord> = loadCompletionRecords()
): CompletionTransactionResult => {
  const cycleKey = habit.cycleId || todayKey;
  const recordId = `${habit.id}_${cycleKey}`;
  const existingRecord = records[recordId];
  const habitXP = getHabitXP(habit);

  const prevXP = Math.max(0, currentTotalXP || 0);
  const prevLevelInfo = calculateLevelProgression(prevXP);

  let xpDelta = 0;
  let quote: string | undefined = undefined;
  const nextRecords = { ...records };

  if (isCompletedNow) {
    // Transition: Incomplete -> Complete
    if (!existingRecord || !existingRecord.completed) {
      xpDelta = habitXP;
      nextRecords[recordId] = {
        id: recordId,
        habitId: habit.id,
        date: todayKey,
        completed: true,
        xpAwarded: habitXP,
        completionType: habit.type,
        completionValue: currentValue,
        timestamp: new Date().toISOString()
      };
      quote = getRandomMotivationalQuote();
    } else if (existingRecord.xpAwarded !== habitXP && existingRecord.xpAwarded > 0) {
      // Difficulty was edited while already completed in current cycle: reconcile delta cleanly
      xpDelta = habitXP - existingRecord.xpAwarded;
      nextRecords[recordId] = {
        ...existingRecord,
        xpAwarded: habitXP,
        completionValue: currentValue,
        timestamp: new Date().toISOString()
      };
    } else {
      // Already recorded as completed in current cycle: Anti-duplication safeguard
      xpDelta = 0;
      nextRecords[recordId] = {
        ...existingRecord,
        completionValue: currentValue,
        timestamp: new Date().toISOString()
      };
    }
  } else {
    // Transition: Complete -> Incomplete (Unfinishing)
    if (existingRecord && existingRecord.completed && existingRecord.xpAwarded > 0) {
      // Remove exactly the XP that was previously awarded
      xpDelta = -existingRecord.xpAwarded;
      nextRecords[recordId] = {
        ...existingRecord,
        completed: false,
        xpAwarded: 0,
        completionValue: currentValue,
        timestamp: new Date().toISOString()
      };
    } else {
      // Already incomplete: do nothing
      xpDelta = 0;
      if (existingRecord) {
        nextRecords[recordId] = {
          ...existingRecord,
          completed: false,
          completionValue: currentValue
        };
      }
    }
  }

  const newTotalXP = Math.max(0, prevXP + xpDelta);
  const newLevelInfo = calculateLevelProgression(newTotalXP);

  const isLevelUp = newLevelInfo.level > prevLevelInfo.level;
  const isLevelDown = newLevelInfo.level < prevLevelInfo.level;

  saveCompletionRecords(nextRecords);
  if (xpDelta !== 0) {
    appendXPTransaction({
      key: `habit_${recordId}`,
      amount: xpDelta,
      reason: xpDelta > 0 ? `Completed ${habit.name}` : `Reverted ${habit.name}`,
      source: 'habit',
      entityId: habit.id,
      date: todayKey
    });
  }

  return {
    xpDelta,
    newTotalXP,
    oldLevel: prevLevelInfo.level,
    newLevel: newLevelInfo.level,
    isLevelUp,
    isLevelDown,
    motivationalQuote: quote,
    xpAwarded: habitXP,
    records: nextRecords
  };
};

/**
 * Smart Habit Analysis for Difficulty Recommendation
 */
export interface HabitDifficultyAnalysis {
  recommendation: 'promote' | 'maintain' | 'ease';
  currentDifficulty: HabitDifficulty;
  recommendedDifficulty?: HabitDifficulty;
  confidence: number;
  reason: string;
  completionRate7d: number;
  streak: number;
}

export const analyzeHabitDifficulty = (habit: Habit, dateKey: string): HabitDifficultyAnalysis => {
  const currentDiff = habit.difficulty || inferHabitDifficulty(habit);
  const streak = habit.streak || 0;
  const history = habit.history || {};

  // Compute 7-day completion count
  let completedDaysCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const val = history[key];
    const target = habit.targetValue || 1;
    if (val === true || (typeof val === 'number' && val >= target)) {
      completedDaysCount++;
    }
  }

  const completionRate7d = Math.round((completedDaysCount / 7) * 100);

  if (streak >= 14 && completionRate7d >= 85) {
    let nextDiff: HabitDifficulty = 'Medium';
    if (currentDiff === 'Easy') nextDiff = 'Medium';
    else if (currentDiff === 'Medium') nextDiff = 'Hard';
    else if (currentDiff === 'Hard') nextDiff = 'Very Hard';
    else nextDiff = 'Very Hard';

    if (nextDiff !== currentDiff) {
      return {
        recommendation: 'promote',
        currentDifficulty: currentDiff,
        recommendedDifficulty: nextDiff,
        confidence: 0.9,
        reason: `Consistent ${streak}-day streak! Ready to step up to ${nextDiff} (+${DIFFICULTY_XP_MAP[nextDiff]} XP).`,
        completionRate7d,
        streak
      };
    }
  }

  if (completionRate7d < 40 && Object.keys(history).length >= 5 && streak === 0) {
    let lowerDiff: HabitDifficulty = 'Easy';
    if (currentDiff === 'Very Hard') lowerDiff = 'Hard';
    else if (currentDiff === 'Hard') lowerDiff = 'Medium';
    else lowerDiff = 'Easy';

    if (lowerDiff !== currentDiff) {
      return {
        recommendation: 'ease',
        currentDifficulty: currentDiff,
        recommendedDifficulty: lowerDiff,
        confidence: 0.8,
        reason: 'Protect your momentum. Adjusting to a lighter target helps rebuild your streak.',
        completionRate7d,
        streak
      };
    }
  }

  return {
    recommendation: 'maintain',
    currentDifficulty: currentDiff,
    confidence: 1.0,
    reason: 'Great pacing. Consistency is building.',
    completionRate7d,
    streak
  };
};
