import { 
  Achievement, 
  AchievementCategory, 
  AchievementRarity, 
  Habit, 
  UserProfile, 
  Routine, 
  Challenge, 
  JournalEntry 
} from '../types';
import { isHabitDueOnDate } from './habitUtils';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  requirement: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  maxProgress: number;
  unit: string;
  icon: string;
  color: string;
  evaluator: (context: BadgeEvaluationContext) => number;
}

export interface BadgeEvaluationContext {
  habits: Habit[];
  userProfile: UserProfile;
  routines: Routine[];
  challenges: Challenge[];
  journalEntries: JournalEntry[];
  totalFocusMinutes: number;
  completedRoutineSessions: number;
  completedChallengesCount: number;
  streakRecoveriesCount: number;
}

export const BADGE_CATEGORIES: { id: AchievementCategory; label: string; description: string; icon: string }[] = [
  { id: 'consistency', label: 'Consistency', description: 'Volume of habits executed and daily rhythm', icon: 'CheckCircle2' },
  { id: 'streaks', label: 'Streaks', description: 'Unbroken daily chains of discipline', icon: 'Flame' },
  { id: 'focus', label: 'Focus', description: 'Deep work sessions and concentrated flow', icon: 'Crown' },
  { id: 'routines', label: 'Routines', description: 'Designed workflows and stacked systems', icon: 'Layers' },
  { id: 'health', label: 'Health & Wellness', description: 'Vitality, physical well-being, and body care', icon: 'Heart' },
  { id: 'discipline', label: 'Discipline', description: 'Consistency through resistance and long horizons', icon: 'ShieldCheck' },
  { id: 'xp', label: 'XP & Progression', description: 'Lifetime achievement points and level milestones', icon: 'TrendingUp' },
  { id: 'challenges', label: 'Daily Challenges', description: 'Goal milestones and community sprints', icon: 'Target' },
  { id: 'time', label: 'Time-Based', description: 'Morning discipline, night focus, and timing mastery', icon: 'Clock' },
  { id: 'resilience', label: 'Recovery & Resilience', description: 'Bouncing back from missed days and setbacks', icon: 'RotateCcw' },
];

export const RARITY_CONFIG: Record<AchievementRarity, { label: string; color: string; border: string; bg: string; glow: string }> = {
  common: {
    label: 'Common',
    color: '#10B981',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  rare: {
    label: 'Rare',
    color: '#3B82F6',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    glow: 'rgba(59, 130, 246, 0.18)'
  },
  epic: {
    label: 'Epic',
    color: '#8B5CF6',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    glow: 'rgba(139, 92, 246, 0.22)'
  },
  legendary: {
    label: 'Legendary',
    color: '#F59E0B',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    glow: 'rgba(245, 158, 11, 0.25)'
  },
  mythic: {
    label: 'Mythic',
    color: '#EC4899',
    border: 'border-pink-500/30',
    bg: 'bg-pink-500/10',
    glow: 'rgba(236, 72, 153, 0.3)'
  }
};

/**
 * All Badge Definitions organized by categories.
 * Preserves the exact 5 existing badges and adds all user-requested achievements.
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ==========================================
  // 1. CONSISTENCY
  // ==========================================
  {
    id: 'badge_getting_started',
    title: 'Getting Started',
    description: 'Complete your first 10 habits.',
    requirement: 'Complete 10 total habit check-ins.',
    category: 'consistency',
    rarity: 'common',
    maxProgress: 10,
    unit: 'habits',
    icon: 'Sparkles',
    color: '#10B981',
    evaluator: (ctx) => calculateTotalHabitCompletions(ctx.habits)
  },
  {
    id: 'badge_habit_builder',
    title: 'Habit Builder',
    description: 'Complete 50 habits.',
    requirement: 'Complete 50 total habit check-ins.',
    category: 'consistency',
    rarity: 'common',
    maxProgress: 50,
    unit: 'habits',
    icon: 'CheckSquare',
    color: '#06B6D4',
    evaluator: (ctx) => calculateTotalHabitCompletions(ctx.habits)
  },
  {
    id: 'badge_consistency_pro',
    title: 'Consistency Pro',
    description: 'Complete 100 habits.',
    requirement: 'Complete 100 total habit check-ins.',
    category: 'consistency',
    rarity: 'rare',
    maxProgress: 100,
    unit: 'habits',
    icon: 'Award',
    color: '#3B82F6',
    evaluator: (ctx) => calculateTotalHabitCompletions(ctx.habits)
  },
  {
    id: 'badge_habit_machine',
    title: 'Habit Machine',
    description: 'Complete 250 habits.',
    requirement: 'Complete 250 total habit check-ins.',
    category: 'consistency',
    rarity: 'epic',
    maxProgress: 250,
    unit: 'habits',
    icon: 'Zap',
    color: '#8B5CF6',
    evaluator: (ctx) => calculateTotalHabitCompletions(ctx.habits)
  },
  {
    id: 'badge_consistency_legend',
    title: 'Consistency Legend',
    description: 'Complete 500 habits.',
    requirement: 'Complete 500 total habit check-ins.',
    category: 'consistency',
    rarity: 'legendary',
    maxProgress: 500,
    unit: 'habits',
    icon: 'Crown',
    color: '#F59E0B',
    evaluator: (ctx) => calculateTotalHabitCompletions(ctx.habits)
  },
  {
    id: 'badge_the_reliable_one',
    title: 'The Reliable One',
    description: 'Complete all planned habits for 7 days.',
    requirement: 'Complete every active habit on 7 distinct days.',
    category: 'consistency',
    rarity: 'rare',
    maxProgress: 7,
    unit: 'days',
    icon: 'CheckCircle2',
    color: '#10B981',
    evaluator: (ctx) => calculatePerfectDaysCount(ctx.habits)
  },
  {
    id: 'badge_perfect_week',
    title: 'Perfect Week',
    description: 'Complete every planned habit for 7 consecutive days.',
    requirement: 'Maintain a 7-day streak of 100% daily habit completion.',
    category: 'consistency',
    rarity: 'epic',
    maxProgress: 7,
    unit: 'days',
    icon: 'Star',
    color: '#8B5CF6',
    evaluator: (ctx) => calculateMaxConsecutivePerfectDays(ctx.habits)
  },
  {
    id: 'badge_perfect_month',
    title: 'Perfect Month',
    description: 'Complete every planned habit for 30 days.',
    requirement: 'Complete all planned habits on 30 distinct days.',
    category: 'consistency',
    rarity: 'legendary',
    maxProgress: 30,
    unit: 'days',
    icon: 'Medal',
    color: '#F59E0B',
    evaluator: (ctx) => calculatePerfectDaysCount(ctx.habits)
  },
  {
    id: 'badge_no_excuses',
    title: 'No Excuses',
    description: 'Complete your daily habits for 14 consecutive days.',
    requirement: '14 uninterrupted consecutive days of 100% habit execution.',
    category: 'consistency',
    rarity: 'epic',
    maxProgress: 14,
    unit: 'days',
    icon: 'ShieldCheck',
    color: '#EC4899',
    evaluator: (ctx) => calculateMaxConsecutivePerfectDays(ctx.habits)
  },

  // ==========================================
  // 2. STREAKS
  // ==========================================
  {
    id: 'badge_7_day_warrior',
    title: '7-Day Warrior',
    description: 'Maintain a 7-day streak.',
    requirement: 'Hold a 7-day active streak on any habit.',
    category: 'streaks',
    rarity: 'common',
    maxProgress: 7,
    unit: 'days',
    icon: 'Flame',
    color: '#10B981',
    evaluator: (ctx) => calculateMaxStreak(ctx.habits)
  },
  {
    id: 'badge_14_day_champion',
    title: '14-Day Champion',
    description: 'Maintain a 14-day streak.',
    requirement: 'Hold a 14-day active streak on any habit.',
    category: 'streaks',
    rarity: 'rare',
    maxProgress: 14,
    unit: 'days',
    icon: 'Flame',
    color: '#3B82F6',
    evaluator: (ctx) => calculateMaxStreak(ctx.habits)
  },
  {
    id: '2', // Preserving original Unstoppable ID
    title: 'Unstoppable',
    description: 'Maintain a 30-day streak.',
    requirement: 'Hold a 30-day active streak on any habit.',
    category: 'streaks',
    rarity: 'epic',
    maxProgress: 30,
    unit: 'days',
    icon: 'Flame',
    color: '#B14AE0',
    evaluator: (ctx) => calculateMaxStreak(ctx.habits)
  },
  {
    id: 'badge_60_day_discipline',
    title: '60-Day Discipline',
    description: 'Maintain a 60-day streak.',
    requirement: 'Hold a 60-day active streak on any habit.',
    category: 'streaks',
    rarity: 'epic',
    maxProgress: 60,
    unit: 'days',
    icon: 'Flame',
    color: '#8B5CF6',
    evaluator: (ctx) => calculateMaxStreak(ctx.habits)
  },
  {
    id: 'badge_90_day_transformation',
    title: '90-Day Transformation',
    description: 'Maintain a 90-day streak.',
    requirement: 'Hold a 90-day active streak on any habit.',
    category: 'streaks',
    rarity: 'legendary',
    maxProgress: 90,
    unit: 'days',
    icon: 'Flame',
    color: '#F59E0B',
    evaluator: (ctx) => calculateMaxStreak(ctx.habits)
  },
  {
    id: 'badge_100_day_legend',
    title: '100-Day Legend',
    description: 'Maintain a 100-day streak.',
    requirement: 'Hold a 100-day active streak on any habit.',
    category: 'streaks',
    rarity: 'legendary',
    maxProgress: 100,
    unit: 'days',
    icon: 'Flame',
    color: '#EC4899',
    evaluator: (ctx) => calculateMaxStreak(ctx.habits)
  },
  {
    id: 'badge_half_year_hero',
    title: 'Half-Year Hero',
    description: 'Maintain a 180-day streak.',
    requirement: 'Hold a 180-day active streak on any habit.',
    category: 'streaks',
    rarity: 'mythic',
    maxProgress: 180,
    unit: 'days',
    icon: 'Trophy',
    color: '#F43F5E',
    evaluator: (ctx) => calculateMaxStreak(ctx.habits)
  },
  {
    id: 'badge_365_day_master',
    title: '365-Day Master',
    description: 'Maintain a 365-day streak.',
    requirement: 'Hold a full 365-day year streak on any habit.',
    category: 'streaks',
    rarity: 'mythic',
    maxProgress: 365,
    unit: 'days',
    icon: 'Crown',
    color: '#EAB308',
    evaluator: (ctx) => calculateMaxStreak(ctx.habits)
  },

  // ==========================================
  // 3. FOCUS & DEEP WORK
  // ==========================================
  {
    id: 'badge_first_focus',
    title: 'First Focus',
    description: 'Complete your first hour of deep work.',
    requirement: 'Log 1 hour (60 minutes) of deep work focus sessions.',
    category: 'focus',
    rarity: 'common',
    maxProgress: 1,
    unit: 'hours',
    icon: 'Target',
    color: '#10B981',
    evaluator: (ctx) => calculateDeepWorkHours(ctx)
  },
  {
    id: 'badge_focus_mode',
    title: 'Focus Mode',
    description: 'Complete 10 hours of deep work.',
    requirement: 'Log 10 hours of deep work focus sessions.',
    category: 'focus',
    rarity: 'common',
    maxProgress: 10,
    unit: 'hours',
    icon: 'Clock',
    color: '#06B6D4',
    evaluator: (ctx) => calculateDeepWorkHours(ctx)
  },
  {
    id: 'badge_deep_thinker',
    title: 'Deep Thinker',
    description: 'Complete 25 hours of deep work.',
    requirement: 'Log 25 hours of deep work focus sessions.',
    category: 'focus',
    rarity: 'rare',
    maxProgress: 25,
    unit: 'hours',
    icon: 'Zap',
    color: '#3B82F6',
    evaluator: (ctx) => calculateDeepWorkHours(ctx)
  },
  {
    id: '3', // Preserving original Master of Focus ID
    title: 'Master of Focus',
    description: 'Complete 100 hours of deep work.',
    requirement: 'Log 100 hours of deep work focus sessions.',
    category: 'focus',
    rarity: 'epic',
    maxProgress: 100,
    unit: 'hours',
    icon: 'Crown',
    color: '#D9B6FF',
    evaluator: (ctx) => calculateDeepWorkHours(ctx)
  },
  {
    id: 'badge_focus_elite',
    title: 'Focus Elite',
    description: 'Complete 250 hours of deep work.',
    requirement: 'Log 250 hours of deep work focus sessions.',
    category: 'focus',
    rarity: 'legendary',
    maxProgress: 250,
    unit: 'hours',
    icon: 'Trophy',
    color: '#F59E0B',
    evaluator: (ctx) => calculateDeepWorkHours(ctx)
  },
  {
    id: 'badge_deep_work_legend',
    title: 'Deep Work Legend',
    description: 'Complete 500 hours of deep work.',
    requirement: 'Log 500 hours of deep work focus sessions.',
    category: 'focus',
    rarity: 'mythic',
    maxProgress: 500,
    unit: 'hours',
    icon: 'Sparkles',
    color: '#EC4899',
    evaluator: (ctx) => calculateDeepWorkHours(ctx)
  },

  // ==========================================
  // 4. ROUTINES
  // ==========================================
  {
    id: 'badge_routine_rookie',
    title: 'Routine Rookie',
    description: 'Create your first custom routine.',
    requirement: 'Design and save 1 custom routine.',
    category: 'routines',
    rarity: 'common',
    maxProgress: 1,
    unit: 'routines',
    icon: 'Layers',
    color: '#10B981',
    evaluator: (ctx) => ctx.routines.length
  },
  {
    id: 'badge_routine_builder',
    title: 'Routine Builder',
    description: 'Complete 3 custom routines.',
    requirement: 'Execute and complete 3 routine flows.',
    category: 'routines',
    rarity: 'common',
    maxProgress: 3,
    unit: 'routines',
    icon: 'CheckSquare',
    color: '#06B6D4',
    evaluator: (ctx) => ctx.completedRoutineSessions
  },
  {
    id: '5', // Preserving original The Architect ID
    title: 'The Architect',
    description: 'Design and complete 5 custom routines.',
    requirement: 'Create and complete 5 custom routines.',
    category: 'routines',
    rarity: 'rare',
    maxProgress: 5,
    unit: 'routines',
    icon: 'Award',
    color: '#3B82F6',
    evaluator: (ctx) => Math.min(ctx.routines.length, ctx.completedRoutineSessions)
  },
  {
    id: 'badge_routine_master',
    title: 'Routine Master',
    description: 'Complete 10 custom routines.',
    requirement: 'Execute and complete 10 routine flows.',
    category: 'routines',
    rarity: 'epic',
    maxProgress: 10,
    unit: 'routines',
    icon: 'Crown',
    color: '#8B5CF6',
    evaluator: (ctx) => ctx.completedRoutineSessions
  },
  {
    id: 'badge_system_builder',
    title: 'System Builder',
    description: 'Successfully maintain 5 routines for 30 days.',
    requirement: 'Maintain at least 5 active routines across 30 active days.',
    category: 'routines',
    rarity: 'legendary',
    maxProgress: 5,
    unit: 'routines',
    icon: 'ShieldCheck',
    color: '#F59E0B',
    evaluator: (ctx) => {
      const activeDays = calculateActiveHabitDays(ctx.habits);
      if (activeDays >= 30) return Math.min(5, ctx.routines.length);
      return Math.min(ctx.routines.length, Math.floor((activeDays / 30) * 5));
    }
  },
  {
    id: 'badge_the_strategist',
    title: 'The Strategist',
    description: 'Maintain 10 active routines consistently.',
    requirement: 'Design and maintain 10 structured routines.',
    category: 'routines',
    rarity: 'mythic',
    maxProgress: 10,
    unit: 'routines',
    icon: 'Medal',
    color: '#EC4899',
    evaluator: (ctx) => ctx.routines.length
  },

  // ==========================================
  // 5. HEALTH & WELLNESS
  // ==========================================
  {
    id: 'badge_healthy_start',
    title: 'Healthy Start',
    description: 'Complete 10 health-related habits.',
    requirement: 'Complete 10 habits in the Health category.',
    category: 'health',
    rarity: 'common',
    maxProgress: 10,
    unit: 'habits',
    icon: 'Heart',
    color: '#10B981',
    evaluator: (ctx) => calculateCategoryCompletions(ctx.habits, 'Health')
  },
  {
    id: '4', // Preserving original Health Guru ID
    title: 'Health Guru',
    description: 'Complete all health habits for 14 days.',
    requirement: 'Complete all active health habits on 14 distinct days.',
    category: 'health',
    rarity: 'rare',
    maxProgress: 14,
    unit: 'days',
    icon: 'Medal',
    color: '#5FD4A7',
    evaluator: (ctx) => calculateCategoryAllCompletedDays(ctx.habits, 'Health')
  },
  {
    id: 'badge_wellness_warrior',
    title: 'Wellness Warrior',
    description: 'Complete health habits for 30 days.',
    requirement: 'Log health habit completions across 30 active days.',
    category: 'health',
    rarity: 'epic',
    maxProgress: 30,
    unit: 'days',
    icon: 'ShieldCheck',
    color: '#3B82F6',
    evaluator: (ctx) => calculateCategoryActiveDays(ctx.habits, 'Health')
  },
  {
    id: 'badge_balanced_life',
    title: 'Balanced Life',
    description: 'Maintain healthy habits across 30 days.',
    requirement: 'Maintain continuous wellness habits across 30 days.',
    category: 'health',
    rarity: 'epic',
    maxProgress: 30,
    unit: 'days',
    icon: 'Sparkles',
    color: '#8B5CF6',
    evaluator: (ctx) => calculateCategoryActiveDays(ctx.habits, 'Health')
  },
  {
    id: 'badge_healthy_discipline',
    title: 'Healthy Discipline',
    description: 'Complete 100 health habits.',
    requirement: 'Complete 100 total health habit check-ins.',
    category: 'health',
    rarity: 'legendary',
    maxProgress: 100,
    unit: 'habits',
    icon: 'Trophy',
    color: '#F59E0B',
    evaluator: (ctx) => calculateCategoryCompletions(ctx.habits, 'Health')
  },
  {
    id: 'badge_wellness_master',
    title: 'Wellness Master',
    description: 'Maintain a consistent health routine for 90 days.',
    requirement: 'Maintain consistent wellness habits across 90 days.',
    category: 'health',
    rarity: 'mythic',
    maxProgress: 90,
    unit: 'days',
    icon: 'Crown',
    color: '#EC4899',
    evaluator: (ctx) => calculateCategoryActiveDays(ctx.habits, 'Health')
  },

  // ==========================================
  // 6. DISCIPLINE
  // ==========================================
  {
    id: 'badge_first_commitment',
    title: 'First Commitment',
    description: 'Complete a habit when motivation is low.',
    requirement: 'Complete a habit on a low-energy day or hard difficulty tier.',
    category: 'discipline',
    rarity: 'common',
    maxProgress: 1,
    unit: 'habits',
    icon: 'Zap',
    color: '#10B981',
    evaluator: (ctx) => calculateLowMotivationCompletions(ctx)
  },
  {
    id: 'badge_discipline_begins',
    title: 'Discipline Begins',
    description: 'Complete habits for 7 consecutive days.',
    requirement: 'Log habit check-ins for 7 consecutive days.',
    category: 'discipline',
    rarity: 'common',
    maxProgress: 7,
    unit: 'days',
    icon: 'CheckCircle2',
    color: '#06B6D4',
    evaluator: (ctx) => calculateMaxActiveConsecutiveDays(ctx.habits)
  },
  {
    id: 'badge_iron_discipline',
    title: 'Iron Discipline',
    description: 'Complete 30 consecutive days of planned habits.',
    requirement: 'Execute planned habits across 30 consecutive days.',
    category: 'discipline',
    rarity: 'epic',
    maxProgress: 30,
    unit: 'days',
    icon: 'ShieldCheck',
    color: '#8B5CF6',
    evaluator: (ctx) => calculateMaxActiveConsecutiveDays(ctx.habits)
  },
  {
    id: 'badge_mental_toughness',
    title: 'Mental Toughness',
    description: 'Recover from a missed day and maintain your streak afterward.',
    requirement: 'Rebound from a broken streak and rebuild a 3+ day streak.',
    category: 'discipline',
    rarity: 'rare',
    maxProgress: 1,
    unit: 'recoveries',
    icon: 'RotateCcw',
    color: '#3B82F6',
    evaluator: (ctx) => Math.min(1, ctx.streakRecoveriesCount || calculateInferredRecoveries(ctx.habits))
  },
  {
    id: 'badge_built_different',
    title: 'Built Different',
    description: 'Complete 100 days of consistent habit activity.',
    requirement: 'Record habit activity on 100 distinct days.',
    category: 'discipline',
    rarity: 'legendary',
    maxProgress: 100,
    unit: 'days',
    icon: 'Flame',
    color: '#F59E0B',
    evaluator: (ctx) => calculateActiveHabitDays(ctx.habits)
  },
  {
    id: 'badge_discipline_master',
    title: 'Discipline Master',
    description: 'Maintain high consistency for 180 days.',
    requirement: 'Record habit activity on 180 distinct days.',
    category: 'discipline',
    rarity: 'mythic',
    maxProgress: 180,
    unit: 'days',
    icon: 'Crown',
    color: '#EC4899',
    evaluator: (ctx) => calculateActiveHabitDays(ctx.habits)
  },

  // ==========================================
  // 7. XP & LEVEL PROGRESSION
  // ==========================================
  {
    id: 'badge_xp_hunter',
    title: 'XP Hunter',
    description: 'Earn your first 1,000 XP.',
    requirement: 'Accumulate 1,000 total lifetime XP.',
    category: 'xp',
    rarity: 'common',
    maxProgress: 1000,
    unit: 'XP',
    icon: 'TrendingUp',
    color: '#10B981',
    evaluator: (ctx) => ctx.userProfile.totalLifetimeXP || 0
  },
  {
    id: 'badge_rising_star',
    title: 'Rising Star',
    description: 'Earn 2,500 XP.',
    requirement: 'Accumulate 2,500 total lifetime XP.',
    category: 'xp',
    rarity: 'common',
    maxProgress: 2500,
    unit: 'XP',
    icon: 'Sparkles',
    color: '#06B6D4',
    evaluator: (ctx) => ctx.userProfile.totalLifetimeXP || 0
  },
  {
    id: 'badge_momentum_builder',
    title: 'Momentum Builder',
    description: 'Earn 5,000 XP.',
    requirement: 'Accumulate 5,000 total lifetime XP.',
    category: 'xp',
    rarity: 'rare',
    maxProgress: 5000,
    unit: 'XP',
    icon: 'Zap',
    color: '#3B82F6',
    evaluator: (ctx) => ctx.userProfile.totalLifetimeXP || 0
  },
  {
    id: 'badge_xp_elite',
    title: 'XP Elite',
    description: 'Earn 10,000 XP.',
    requirement: 'Accumulate 10,000 total lifetime XP.',
    category: 'xp',
    rarity: 'rare',
    maxProgress: 10000,
    unit: 'XP',
    icon: 'Award',
    color: '#8B5CF6',
    evaluator: (ctx) => ctx.userProfile.totalLifetimeXP || 0
  },
  {
    id: 'badge_xp_master',
    title: 'XP Master',
    description: 'Earn 25,000 XP.',
    requirement: 'Accumulate 25,000 total lifetime XP.',
    category: 'xp',
    rarity: 'epic',
    maxProgress: 25000,
    unit: 'XP',
    icon: 'Medal',
    color: '#A855F7',
    evaluator: (ctx) => ctx.userProfile.totalLifetimeXP || 0
  },
  {
    id: 'badge_xp_legend',
    title: 'XP Legend',
    description: 'Earn 50,000 XP.',
    requirement: 'Accumulate 50,000 total lifetime XP.',
    category: 'xp',
    rarity: 'legendary',
    maxProgress: 50000,
    unit: 'XP',
    icon: 'Trophy',
    color: '#F59E0B',
    evaluator: (ctx) => ctx.userProfile.totalLifetimeXP || 0
  },
  {
    id: 'badge_the_veteran',
    title: 'The Veteran',
    description: 'Earn 100,000 XP.',
    requirement: 'Accumulate 100,000 total lifetime XP.',
    category: 'xp',
    rarity: 'legendary',
    maxProgress: 100000,
    unit: 'XP',
    icon: 'ShieldCheck',
    color: '#EC4899',
    evaluator: (ctx) => ctx.userProfile.totalLifetimeXP || 0
  },
  {
    id: 'badge_grandmaster_xp',
    title: 'Grandmaster',
    description: 'Reach a major high-level XP milestone.',
    requirement: 'Accumulate 150,000 total lifetime XP or reach Level 20+.',
    category: 'xp',
    rarity: 'mythic',
    maxProgress: 150000,
    unit: 'XP',
    icon: 'Crown',
    color: '#EAB308',
    evaluator: (ctx) => ctx.userProfile.totalLifetimeXP || 0
  },

  // ==========================================
  // 8. DAILY CHALLENGES
  // ==========================================
  {
    id: 'badge_day_one',
    title: 'Day One',
    description: 'Complete your first full day.',
    requirement: 'Complete 100% of all planned daily habits for 1 day.',
    category: 'challenges',
    rarity: 'common',
    maxProgress: 1,
    unit: 'days',
    icon: 'CheckSquare',
    color: '#10B981',
    evaluator: (ctx) => calculatePerfectDaysCount(ctx.habits)
  },
  {
    id: 'badge_daily_champion',
    title: 'Daily Champion',
    description: 'Complete 10 perfect days.',
    requirement: 'Achieve 10 perfect 100% daily completion days.',
    category: 'challenges',
    rarity: 'rare',
    maxProgress: 10,
    unit: 'days',
    icon: 'Trophy',
    color: '#3B82F6',
    evaluator: (ctx) => calculatePerfectDaysCount(ctx.habits)
  },
  {
    id: 'badge_challenge_accepted',
    title: 'Challenge Accepted',
    description: 'Complete your first challenge.',
    requirement: 'Join and finish 1 community or personal challenge.',
    category: 'challenges',
    rarity: 'common',
    maxProgress: 1,
    unit: 'challenges',
    icon: 'Target',
    color: '#06B6D4',
    evaluator: (ctx) => ctx.completedChallengesCount
  },
  {
    id: 'badge_challenge_hunter',
    title: 'Challenge Hunter',
    description: 'Complete 10 challenges.',
    requirement: 'Join and finish 10 challenge sprints.',
    category: 'challenges',
    rarity: 'rare',
    maxProgress: 10,
    unit: 'challenges',
    icon: 'Zap',
    color: '#8B5CF6',
    evaluator: (ctx) => ctx.completedChallengesCount
  },
  {
    id: 'badge_challenge_master',
    title: 'Challenge Master',
    description: 'Complete 50 challenges.',
    requirement: 'Join and finish 50 challenge sprints.',
    category: 'challenges',
    rarity: 'legendary',
    maxProgress: 50,
    unit: 'challenges',
    icon: 'Medal',
    color: '#F59E0B',
    evaluator: (ctx) => ctx.completedChallengesCount
  },
  {
    id: 'badge_challenge_legend',
    title: 'Challenge Legend',
    description: 'Complete 100 challenges.',
    requirement: 'Join and finish 100 challenge sprints.',
    category: 'challenges',
    rarity: 'mythic',
    maxProgress: 100,
    unit: 'challenges',
    icon: 'Crown',
    color: '#EC4899',
    evaluator: (ctx) => ctx.completedChallengesCount
  },

  // ==========================================
  // 9. TIME-BASED
  // ==========================================
  {
    id: '1', // Preserving original Early Bird ID
    title: 'Early Bird',
    description: 'Complete 10 habits before 8 AM.',
    requirement: 'Complete 10 habit sessions before 8:00 AM.',
    category: 'time',
    rarity: 'common',
    maxProgress: 10,
    unit: 'habits',
    icon: 'Sparkles',
    color: '#F5B971',
    evaluator: (ctx) => calculateTimeBasedHabits(ctx.habits, 'morning')
  },
  {
    id: 'badge_morning_master',
    title: 'Morning Master',
    description: 'Complete 50 habits before 8 AM.',
    requirement: 'Complete 50 habit sessions before 8:00 AM.',
    category: 'time',
    rarity: 'epic',
    maxProgress: 50,
    unit: 'habits',
    icon: 'Sunrise',
    color: '#F59E0B',
    evaluator: (ctx) => calculateTimeBasedHabits(ctx.habits, 'morning')
  },
  {
    id: 'badge_night_owl',
    title: 'Night Owl',
    description: 'Complete 25 habits after 8 PM.',
    requirement: 'Complete 25 habit sessions after 8:00 PM.',
    category: 'time',
    rarity: 'rare',
    maxProgress: 25,
    unit: 'habits',
    icon: 'Moon',
    color: '#8B5CF6',
    evaluator: (ctx) => calculateTimeBasedHabits(ctx.habits, 'evening')
  },
  {
    id: 'badge_time_keeper',
    title: 'Time Keeper',
    description: 'Complete 100 timed habits.',
    requirement: 'Complete 100 timed focus or exercise habit sessions.',
    category: 'time',
    rarity: 'epic',
    maxProgress: 100,
    unit: 'sessions',
    icon: 'Clock',
    color: '#3B82F6',
    evaluator: (ctx) => calculateTimedHabitSessions(ctx.habits)
  },
  {
    id: 'badge_clockwork',
    title: 'Clockwork',
    description: 'Complete habits at consistent times for 14 days.',
    requirement: 'Execute scheduled habits within consistent time windows for 14 days.',
    category: 'time',
    rarity: 'legendary',
    maxProgress: 14,
    unit: 'days',
    icon: 'Watch',
    color: '#EC4899',
    evaluator: (ctx) => calculateClockworkConsistencyDays(ctx.habits)
  },

  // ==========================================
  // 10. RECOVERY & RESILIENCE
  // ==========================================
  {
    id: 'badge_back_on_track',
    title: 'Back on Track',
    description: 'Return to your habits after missing a day.',
    requirement: 'Re-engage and check in the day immediately following a missed day.',
    category: 'resilience',
    rarity: 'common',
    maxProgress: 1,
    unit: 'comebacks',
    icon: 'RotateCcw',
    color: '#10B981',
    evaluator: (ctx) => Math.min(1, calculateBackOnTrackEvents(ctx.habits))
  },
  {
    id: 'badge_comeback_kid',
    title: 'Comeback Kid',
    description: 'Recover from a broken streak and build a new 7-day streak.',
    requirement: 'Recover after a streak reset and build a brand-new 7-day streak.',
    category: 'resilience',
    rarity: 'rare',
    maxProgress: 1,
    unit: 'comebacks',
    icon: 'Flame',
    color: '#3B82F6',
    evaluator: (ctx) => Math.min(1, calculateComebackKidEvents(ctx.habits))
  },
  {
    id: 'badge_resilient',
    title: 'Resilient',
    description: 'Recover from 3 broken streaks successfully.',
    requirement: 'Successfully rebuild a 3+ day streak after 3 separate reset events.',
    category: 'resilience',
    rarity: 'epic',
    maxProgress: 3,
    unit: 'recoveries',
    icon: 'ShieldCheck',
    color: '#8B5CF6',
    evaluator: (ctx) => Math.min(3, ctx.streakRecoveriesCount || calculateInferredRecoveries(ctx.habits))
  },
  {
    id: 'badge_second_wind',
    title: 'Second Wind',
    description: 'Restart and maintain consistency for 30 days.',
    requirement: 'Maintain 30 active days of consistency following a habit restart.',
    category: 'resilience',
    rarity: 'legendary',
    maxProgress: 30,
    unit: 'days',
    icon: 'Sparkles',
    color: '#F59E0B',
    evaluator: (ctx) => calculateSecondWindDays(ctx.habits)
  },
  {
    id: 'badge_never_finished',
    title: 'Never Finished',
    description: 'Successfully rebuild after a major period of inactivity.',
    requirement: 'Rebuild a 14-day streak after an extended period of inactivity.',
    category: 'resilience',
    rarity: 'mythic',
    maxProgress: 1,
    unit: 'rebuilds',
    icon: 'Trophy',
    color: '#EC4899',
    evaluator: (ctx) => Math.min(1, calculateNeverFinishedMilestone(ctx.habits))
  }
];

// ============================================================================
// AUTOMATIC METRIC EVALUATORS
// ============================================================================

export const calculateTotalHabitCompletions = (habits: Habit[]): number => {
  let count = 0;
  for (const h of habits) {
    if (h.events && h.events.length > 0) {
      count += h.events.filter(e => e.value === true || (typeof e.value === 'number' && e.value > 0)).length;
    } else if (h.history) {
      count += Object.values(h.history).filter(v => v === true || (typeof v === 'number' && v > 0)).length;
    }
  }
  return count;
};

export const calculateMaxStreak = (habits: Habit[]): number => {
  if (!habits || habits.length === 0) return 0;
  return Math.max(0, ...habits.map(h => h.streak || 0));
};

export const calculateDeepWorkHours = (ctx: BadgeEvaluationContext): number => {
  // Deep work from dedicated focus sessions (in minutes) + manual timed habit logs not already created by focus sessions
  let totalMins = ctx.totalFocusMinutes || 0;
  for (const h of ctx.habits) {
    if (h.type === 'timing' && h.events) {
      for (const e of h.events) {
        if (typeof e.value === 'number' && e.value > 0 && !e.notes?.includes('focus_session')) {
          totalMins += e.value;
        }
      }
    } else if (h.type === 'timing' && !ctx.totalFocusMinutes && h.history) {
      totalMins += Object.values(h.history).reduce<number>((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    }
  }
  return Math.floor(totalMins / 60);
};

export const calculatePerfectDaysCount = (habits: Habit[]): number => {
  const activeHabits = habits.filter(h => !h.isArchived && !h.isPaused);
  if (activeHabits.length === 0) return 0;

  const dateSet = new Set<string>();
  for (const h of activeHabits) {
    if (h.history) {
      Object.keys(h.history).forEach(d => dateSet.add(d));
    }
    if (h.events) {
      h.events.forEach(e => {
        const d = e.timestamp ? e.timestamp.split('T')[0] : '';
        if (d) dateSet.add(d);
      });
    }
  }

  let perfectDays = 0;
  for (const dateKey of dateSet) {
    const dateObj = new Date(`${dateKey}T12:00:00`);
    const dueOnDate = activeHabits.filter(h => isHabitDueOnDate(h, dateObj, { ignoreCurrentStatus: true }));
    if (dueOnDate.length === 0) continue;

    const allCompleted = dueOnDate.every(h => {
      const histVal = h.history?.[dateKey];
      return histVal === true || (typeof histVal === 'number' && histVal >= (h.targetValue || 1));
    });
    if (allCompleted) perfectDays++;
  }
  return perfectDays;
};

export const calculateMaxConsecutivePerfectDays = (habits: Habit[]): number => {
  const activeHabits = habits.filter(h => !h.isArchived && !h.isPaused);
  if (activeHabits.length === 0) return 0;

  const dateSet = new Set<string>();
  for (const h of activeHabits) {
    if (h.history) {
      Object.keys(h.history).forEach(d => dateSet.add(d));
    }
  }

  const sortedDates = Array.from(dateSet).sort();
  let maxConsec = 0;
  let currentConsec = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const curDate = new Date(`${dStr}T12:00:00`);
    const dueOnDate = activeHabits.filter(h => isHabitDueOnDate(h, curDate, { ignoreCurrentStatus: true }));
    if (dueOnDate.length === 0) continue;

    const allCompleted = dueOnDate.every(h => {
      const histVal = h.history?.[dStr];
      return histVal === true || (typeof histVal === 'number' && histVal >= (h.targetValue || 1));
    });

    if (allCompleted) {
      if (prevDate) {
        const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        currentConsec = diffDays === 1 ? currentConsec + 1 : 1;
      } else {
        currentConsec = 1;
      }
      prevDate = curDate;
      if (currentConsec > maxConsec) maxConsec = currentConsec;
    } else {
      currentConsec = 0;
      prevDate = null;
    }
  }
  return maxConsec;
};

export const calculateActiveHabitDays = (habits: Habit[]): number => {
  const dateSet = new Set<string>();
  for (const h of habits) {
    if (h.history) {
      Object.entries(h.history).forEach(([d, v]) => {
        if (v === true || (typeof v === 'number' && v > 0)) dateSet.add(d);
      });
    }
  }
  return dateSet.size;
};

export const calculateMaxActiveConsecutiveDays = (habits: Habit[]): number => {
  const dateSet = new Set<string>();
  for (const h of habits) {
    if (h.history) {
      Object.entries(h.history).forEach(([d, v]) => {
        if (v === true || (typeof v === 'number' && v > 0)) dateSet.add(d);
      });
    }
  }

  const sortedDates = Array.from(dateSet).sort();
  let maxStreak = 0;
  let curStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const curDate = new Date(dStr);
    if (prevDate) {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        curStreak++;
      } else if (diffDays > 1) {
        curStreak = 1;
      }
    } else {
      curStreak = 1;
    }
    prevDate = curDate;
    if (curStreak > maxStreak) maxStreak = curStreak;
  }
  return Math.max(maxStreak, calculateMaxStreak(habits));
};

export const calculateCategoryCompletions = (habits: Habit[], category: string): number => {
  const catHabits = habits.filter(h => h.category?.toLowerCase() === category.toLowerCase());
  return calculateTotalHabitCompletions(catHabits);
};

export const calculateCategoryActiveDays = (habits: Habit[], category: string): number => {
  const catHabits = habits.filter(h => h.category?.toLowerCase() === category.toLowerCase());
  return calculateActiveHabitDays(catHabits);
};

export const calculateCategoryAllCompletedDays = (habits: Habit[], category: string): number => {
  const catHabits = habits.filter(h => h.category?.toLowerCase() === category.toLowerCase() && !h.isArchived);
  if (catHabits.length === 0) return 0;
  return calculatePerfectDaysCount(catHabits);
};

export const calculateTimeBasedHabits = (habits: Habit[], period: 'morning' | 'evening'): number => {
  let count = 0;
  for (const h of habits) {
    const target = Math.max(1, h.targetValue || 1);
    if (h.events && h.events.length > 0) {
      for (const e of h.events) {
        const isPositiveCompletion = e.value === true || (typeof e.value === 'number' && e.value >= target);
        if (e.timestamp && isPositiveCompletion) {
          const hour = new Date(e.timestamp).getHours();
          if (period === 'morning' && hour < 8) count++;
          if (period === 'evening' && hour >= 20) count++;
        }
      }
    } else if (h.timeOfDay) {
      const lowerTod = h.timeOfDay.toLowerCase();
      const matches = period === 'morning' ? lowerTod === 'morning' : (lowerTod === 'evening' || lowerTod === 'night');
      if (matches && h.history) {
        count += Object.values(h.history).filter(v => v === true || (typeof v === 'number' && v >= target)).length;
      }
    }
  }
  return count;
};

export const calculateTimedHabitSessions = (habits: Habit[]): number => {
  let count = 0;
  for (const h of habits) {
    if (h.type === 'timing') {
      if (h.events && h.events.length > 0) {
        count += h.events.length;
      } else if (h.history) {
        count += Object.values(h.history).filter(v => v === true || (typeof v === 'number' && v > 0)).length;
      }
    }
  }
  return count;
};

export const calculateClockworkConsistencyDays = (habits: Habit[]): number => {
  const activeDays = calculateActiveHabitDays(habits);
  return Math.min(14, activeDays);
};

export const calculateLowMotivationCompletions = (ctx: BadgeEvaluationContext): number => {
  let count = 0;
  // From low energy journal entries
  const lowEnergyDates = new Set(
    ctx.journalEntries.filter(j => j.energy <= 2 || j.mood === 'sad' || j.mood === 'tired').map(j => j.date)
  );

  for (const h of ctx.habits) {
    if (h.difficulty === 'Hard' || h.difficulty === 'Very Hard') {
      count += calculateTotalHabitCompletions([h]);
    }
    if (h.history) {
      for (const [dateKey, val] of Object.entries(h.history)) {
        if (lowEnergyDates.has(dateKey) && (val === true || (typeof val === 'number' && val > 0))) {
          count++;
        }
      }
    }
  }
  return count > 0 ? count : (ctx.habits.some(h => h.completedToday) ? 1 : 0);
};

export const calculateInferredRecoveries = (habits: Habit[]): number => {
  let recoveries = 0;
  for (const h of habits) {
    if (h.streak >= 3) recoveries++;
  }
  return recoveries;
};

export const calculateBackOnTrackEvents = (habits: Habit[]): number => {
  return calculateActiveHabitDays(habits) >= 2 ? 1 : 0;
};

export const calculateComebackKidEvents = (habits: Habit[]): number => {
  return calculateMaxStreak(habits) >= 7 ? 1 : 0;
};

export const calculateSecondWindDays = (habits: Habit[]): number => {
  return calculateActiveHabitDays(habits);
};

export const calculateNeverFinishedMilestone = (habits: Habit[]): number => {
  return calculateMaxStreak(habits) >= 14 ? 1 : 0;
};

// ============================================================================
// BADGE SYNCHRONIZATION & EVALUATION CONTROLLER
// ============================================================================

/**
 * Evaluates all badges dynamically and merges with historical unlock state.
 */
export const evaluateAllBadges = (
  habits: Habit[],
  userProfile: UserProfile,
  routines: Routine[] = [],
  challenges: Challenge[] = [],
  journalEntries: JournalEntry[] = [],
  existingAchievements: Achievement[] = [],
  completedRoutineSessions: number = 0,
  totalFocusMinutes: number = 0,
  completedChallengesCount: number = 0,
  streakRecoveriesCount: number = 0
): Achievement[] => {
  const context: BadgeEvaluationContext = {
    habits,
    userProfile,
    routines,
    challenges,
    journalEntries,
    totalFocusMinutes,
    completedRoutineSessions,
    completedChallengesCount,
    streakRecoveriesCount
  };

  const existingMap = new Map<string, Achievement>();
  existingAchievements.forEach(a => existingMap.set(a.id, a));

  const nowISO = new Date().toISOString();

  return BADGE_DEFINITIONS.map(def => {
    const existing = existingMap.get(def.id);
    const rawVal = def.evaluator(context);
    const currentProgress = Math.max(0, Math.min(def.maxProgress, Math.round(rawVal)));
    const isUnlocked = existing?.unlocked || currentProgress >= def.maxProgress;
    const unlockedAt = existing?.unlocked ? existing.unlockedAt : (isUnlocked ? nowISO : undefined);

    const progressFormatted = `${currentProgress.toLocaleString()} / ${def.maxProgress.toLocaleString()} ${def.unit}`;

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      requirement: def.requirement,
      category: def.category,
      rarity: def.rarity,
      currentProgress,
      maxProgress: def.maxProgress,
      unit: def.unit,
      progressFormatted,
      icon: def.icon,
      color: def.color,
      unlocked: isUnlocked,
      unlockedAt
    };
  });
};

export const ALL_BADGE_DEFINITIONS = BADGE_DEFINITIONS;

export const getInitialAchievements = (): Achievement[] => {
  return BADGE_DEFINITIONS.map(def => ({
    id: def.id,
    title: def.title,
    description: def.description,
    requirement: def.requirement,
    category: def.category,
    rarity: def.rarity,
    currentProgress: 0,
    maxProgress: def.maxProgress,
    unit: def.unit,
    progressFormatted: `0 / ${def.maxProgress.toLocaleString()} ${def.unit}`,
    icon: def.icon,
    color: def.color,
    unlocked: false
  }));
};
