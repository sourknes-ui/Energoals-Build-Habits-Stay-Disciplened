import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Repeat, 
  Calendar, 
  BarChart3, 
  BookOpen, 
  Sparkles, 
  Trophy, 
  Award, 
  Settings, 
  LogOut,
  ChevronRight,
  Zap,
  Flame,
  Clock,
  Shield,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserProfile, Habit, Goal, Challenge } from '../../types';
import { getVibeById } from '../../lib/vibeData';

interface AppHubProps {
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  habits: Habit[];
  goals: Goal[];
  challenges: Challenge[];
  onLogout: () => void;
}

export const AppHub: React.FC<AppHubProps> = ({ 
  setActiveTab, 
  userProfile, 
  habits, 
  goals, 
  challenges,
  onLogout 
}) => {
  const activeHabits = habits.filter(h => h.completedToday).length;
  const activeGoals = goals.filter(g => g.progress < 100).length;
  const activeChallenges = challenges.filter(c => c.isJoined).length;

  const hubItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Today’s progress and quick overview',
      summary: `${activeHabits}/${habits.length} habits done`,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      id: 'habits',
      title: 'Habits',
      icon: CheckSquare,
      description: 'Track daily habits and streaks',
      summary: `${userProfile.totalStreaks} total streaks`,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      id: 'goals',
      title: 'Goals',
      icon: Target,
      description: 'View and manage fitness goals',
      summary: `${activeGoals} active goals`,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      id: 'rewards',
      title: 'Milestones',
      icon: Award,
      description: 'Progress checkpoints and achievements',
      summary: `${userProfile.currentLevel} levels achieved`,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      id: 'routines',
      title: 'Routine',
      icon: Repeat,
      description: 'Planned routines and schedules',
      summary: 'Daily flow optimized',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: Calendar,
      description: 'Reminders, deadlines, and highlighted days',
      summary: 'Stay on schedule',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: BarChart3,
      description: 'Progress insights and charts',
      summary: 'Data-driven growth',
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10'
    },
    {
      id: 'journal',
      title: 'Journal',
      icon: BookOpen,
      description: 'Daily notes and reflections',
      summary: 'Mindful progress',
      color: 'text-teal-500',
      bg: 'bg-teal-500/10'
    },
    {
      id: 'coach',
      title: 'AI Coach',
      icon: Sparkles,
      description: 'Smart guidance and support',
      summary: 'Personalized insights',
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      id: 'challenges',
      title: 'Challenges',
      icon: Trophy,
      description: 'Active and upcoming challenges',
      summary: `${activeChallenges} joined`,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      description: 'App preferences and account controls',
      summary: 'Customize your experience',
      color: 'text-platinum/40',
      bg: 'bg-white/5'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 pb-20">
      <header className="space-y-4">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md shadow-primary/20">
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xl sm:text-2xl text-primary font-bold">{userProfile.name[0]}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">
                Welcome Back, <span className="text-primary">{userProfile.name.split(' ')[0]}</span>
              </h1>
              {(() => {
                const vibeInfo = getVibeById(userProfile.vibe);
                return vibeInfo ? (
                  <span className={cn(
                    "text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 shadow-sm",
                    vibeInfo.badgeBg
                  )}>
                    <span>{vibeInfo.emoji}</span>
                    <span>{vibeInfo.name}</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-platinum/50 italic inline-flex items-center gap-1">
                    <span>✨</span>
                    <span>Choose your vibe</span>
                  </span>
                );
              })()}
            </div>
            <p className="text-platinum/40 font-medium text-xs sm:text-sm mt-0.5">Your premium self-mastery hub is ready.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-white/5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-bold text-platinum/40 uppercase tracking-widest truncate">Momentum</div>
              <div className="text-base sm:text-lg font-bold text-white">{userProfile.momentumScore}%</div>
            </div>
          </div>
          <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-white/5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-bold text-platinum/40 uppercase tracking-widest truncate">Streaks</div>
              <div className="text-base sm:text-lg font-bold text-white">{userProfile.totalStreaks}d</div>
            </div>
          </div>
          <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-white/5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-bold text-platinum/40 uppercase tracking-widest truncate">Level</div>
              <div className="text-base sm:text-lg font-bold text-white">{userProfile.currentLevel}</div>
            </div>
          </div>
          <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-white/5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-bold text-platinum/40 uppercase tracking-widest truncate">Points</div>
              <div className="text-base sm:text-lg font-bold text-white">{userProfile.currentXP}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <h2 className="text-xs sm:text-sm font-bold text-platinum/40 uppercase tracking-[0.2em] mb-4 sm:mb-6">Explore Sections</h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {hubItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id)}
              className="w-full glass-panel p-4 sm:p-6 rounded-2xl border border-white/5 hover:border-primary/30 hover:bg-white/5 active:bg-white/10 transition-all group text-left flex items-center gap-3.5 sm:gap-6 touch-manipulation cursor-pointer"
            >
              <div className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 shadow-sm",
                item.bg,
                item.color
              )}>
                <item.icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1 sm:gap-4">
                  <h3 className="text-base sm:text-xl font-bold text-white group-hover:text-primary transition-colors truncate">{item.title}</h3>
                  <span className="text-[10px] sm:text-xs font-bold text-platinum/40 uppercase tracking-wider group-hover:text-primary/60 transition-colors">
                    {item.summary}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-platinum/50 font-medium leading-relaxed line-clamp-1 sm:line-clamp-none">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-platinum/20 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </motion.button>
          ))}

          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hubItems.length * 0.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full glass-panel p-4 sm:p-6 rounded-2xl border border-error/15 bg-error/5 hover:bg-error/10 active:bg-error/15 transition-all group text-left flex items-center gap-3.5 sm:gap-6 mt-6 sm:mt-8 touch-manipulation cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-error/20 text-error flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
              <LogOut className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-xl font-bold text-error">Log Out</h3>
              <p className="text-xs sm:text-sm text-error/60 font-medium truncate">Securely sign out of your account</p>
            </div>
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-error/30 group-hover:translate-x-1 transition-all shrink-0" />
          </motion.button>
        </div>
      </div>

      <footer className="pt-12 text-center space-y-4">
        <div className="text-2xl font-display font-bold text-primary opacity-20">EnerGoals</div>
        <p className="text-xs text-platinum/20 uppercase tracking-[0.3em]">Precision Self-Mastery Protocol</p>
      </footer>
    </div>
  );
};
