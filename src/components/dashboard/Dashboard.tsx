import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Plus,
  Search,
  Bell,
  User,
  Sparkles,
  ChevronRight,
  Zap,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { CreateHabitModal } from '../habits/CreateHabitModal';
import { HabitCard } from '../habits/HabitCard';
import { DeleteHabitConfirmModal } from '../habits/DeleteHabitConfirmModal';
import { DailyAffirmation } from './DailyAffirmation';
import { FocusDistributionWidget } from './FocusDistributionWidget';
import { SmartWidgetsArea } from './SmartWidgetsArea';
import { playSound } from '../../lib/audio';
import { Habit, UserProfile } from '../../types';
import { getTodayKey, isHabitDueOnDate, isHabitValueCompleted } from '../../lib/habitUtils';
import { calculateLevelProgression } from '../../lib/progressionEngine';
import { getVibeById } from '../../lib/vibeData';
import { useSmartGreeting } from '../../utils/smartGreeting';

interface DashboardProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  toggleHabit: (id: string, e?: React.MouseEvent) => void;
  onUpdateHabitProgress?: (id: string, newValue: number, meta?: { source?: string }) => void;
  onSaveHabit?: (habitData: any) => void;
  onDeleteHabit?: (id: string) => void;
  pinnedHabitIds?: string[];
  onTogglePinHabit?: (id: string) => void;
  onSavePinnedHabits?: (ids: string[]) => void;
  onStartFocus?: (habit?: Habit) => void;
  onAddXP?: (amount: number, meta?: any) => void;
  userProfile: UserProfile;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  habits, 
  setHabits, 
  toggleHabit, 
  onUpdateHabitProgress,
  onSaveHabit,
  onDeleteHabit,
  pinnedHabitIds,
  onTogglePinHabit,
  onSavePinnedHabits,
  onStartFocus,
  userProfile, 
  setActiveTab 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const { template: greetingTemplate } = useSmartGreeting();

  const activeHabits = useMemo(() => habits.filter(h => !h.isArchived && !h.isPaused), [habits]);
  const completedHabits = useMemo(() => activeHabits.filter(h => h.completedToday).length, [activeHabits]);
  const totalHabits = activeHabits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const totalStreak = useMemo(() => habits.reduce((acc, h) => acc + (h.streak || 0), 0), [habits]);
  const remainingHabits = totalHabits - completedHabits;

  // Compute real weekly performance for the current week (Mon-Sun)
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const todayKey = getTodayKey(now);
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    return days.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateKey = getTodayKey(d);
      const isToday = dateKey === todayKey;
      const isPastOrToday = d <= now || isToday;
      
      if (!isPastOrToday) {
        return { name: dayName, completion: 0 };
      }

      if (isToday) {
        return { name: dayName, completion: completionRate };
      }

      const dueHabits = activeHabits.filter(h => isHabitDueOnDate(h, d));
      if (dueHabits.length === 0) {
        return { name: dayName, completion: 0 };
      }

      let completedOnDay = 0;
      dueHabits.forEach(h => {
        const histVal = h.history?.[dateKey];
        if (isHabitValueCompleted(h, histVal)) {
          completedOnDay++;
        }
      });

      const dayRate = Math.round((completedOnDay / dueHabits.length) * 100);
      return { name: dayName, completion: dayRate };
    });
  }, [activeHabits, completionRate]);

  const handleAddHabit = (habitData: any) => {
    if (onSaveHabit) {
      onSaveHabit(editingHabit ? { ...habitData, id: editingHabit.id } : habitData);
    } else if (editingHabit) {
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...habitData } : h));
    } else {
      const now = new Date();
      const newHabit: Habit = {
        id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        streak: 0,
        completedToday: false,
        currentValue: 0,
        history: {},
        events: [],
        createdAt: now.toISOString(),
        cycleStartedAt: now.toISOString(),
        cycleId: `cycle_${now.getTime()}_${Math.random().toString(36).substring(2, 8)}`,
        ...habitData
      };
      setHabits(prev => [newHabit, ...prev]);
    }
    setEditingHabit(null);
    setIsModalOpen(false);
  };

  const requestDeleteHabit = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setHabitToDelete(habit);
    }
  };

  const confirmDeleteHabit = () => {
    if (!habitToDelete) return;
    const id = habitToDelete.id;
    if (onDeleteHabit) {
      onDeleteHabit(id);
    } else {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
    setHabitToDelete(null);
  };

  const startEditHabit = (habit: Habit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleTogglePin = (habitId: string) => {
    if (onTogglePinHabit) {
      onTogglePinHabit(habitId);
      return;
    }
    playSound('click');
  };

  return (
    <div className="space-y-8 pb-12">
      <AnimatePresence>
        {isModalOpen && (
          <CreateHabitModal 
            isOpen={isModalOpen} 
            onClose={() => {
              setIsModalOpen(false);
              setEditingHabit(null);
            }} 
            onSave={handleAddHabit}
            onDelete={(id) => requestDeleteHabit(id)}
            editingHabit={editingHabit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {habitToDelete && (
          <DeleteHabitConfirmModal
            isOpen={!!habitToDelete}
            habit={habitToDelete}
            onClose={() => setHabitToDelete(null)}
            onConfirm={confirmDeleteHabit}
          />
        )}
      </AnimatePresence>

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap mb-1.5 sm:mb-2">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white tracking-tight"
            >
              {greetingTemplate.before} <span className="text-primary">{userProfile.name || 'Champion'}</span>{greetingTemplate.after}
            </motion.h1>
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
          <p className="text-platinum/60 font-medium flex items-center gap-2 text-xs sm:text-sm">
            <Zap className="w-4 h-4 text-warning shrink-0" /> Discipline is the bridge between goals and accomplishment.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full md:w-auto">
          {(() => {
            const levelInfo = calculateLevelProgression(userProfile.totalLifetimeXP || 0);
            return (
              <div 
                onClick={() => setActiveTab('rewards')}
                className="flex flex-col items-end gap-1 p-2 px-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                title={`Current Milestone: ${levelInfo.milestone}`}
              >
                <div className="flex items-center gap-2 text-sm font-display font-bold text-white">
                  <span>Level {levelInfo.level}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 group-hover:bg-primary group-hover:text-white transition-colors">
                    {levelInfo.title}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-platinum/40 uppercase tracking-widest font-mono">
                  {levelInfo.currentTierXP.toLocaleString()} / {levelInfo.xpNeededForTier.toLocaleString()} XP
                </div>
                <div className="w-36 h-2 bg-white/5 rounded-full overflow-hidden mt-0.5 border border-white/10">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-accent-purple"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(levelInfo.progressFraction * 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            );
          })()}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('rewards')}
              className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden"
            >
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>
        </div>
      </header>

      <DailyAffirmation />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Daily Score" 
          value={`${completionRate}%`} 
          trend={totalHabits > 0 ? `${completedHabits}/${totalHabits}` : "0%"} 
          icon={TrendingUp} 
          color="primary"
          description="Completion rate today"
        />
        <StatCard 
          title="Total Streaks" 
          value={`${totalStreak}d`} 
          trend="Active" 
          icon={Flame} 
          color="warning"
          description="Across all daily habits"
        />
        <StatCard 
          title="Habits Done" 
          value={`${completedHabits}/${totalHabits}`} 
          trend={`${completionRate}%`} 
          icon={CheckCircle2} 
          color="success"
          description={`${remainingHabits} habits remaining`}
        />
        <StatCard 
          title="Momentum" 
          value={`${userProfile.momentumScore}%`} 
          trend={userProfile.momentumScore > 75 ? "High" : userProfile.momentumScore > 40 ? "Medium" : "Starting"} 
          icon={Sparkles} 
          color="lavender"
          description="Discipline velocity"
        />
      </div>

      {/* Smart Widgets - Top 3 Critical Keystone Habits */}
      <SmartWidgetsArea 
        habits={habits}
        setHabits={setHabits}
        toggleHabit={toggleHabit}
        onUpdateHabitProgress={onUpdateHabitProgress}
        pinnedHabitIds={pinnedHabitIds}
        onTogglePinHabit={onTogglePinHabit}
        onSavePinnedHabits={onSavePinnedHabits}
        onStartFocus={(h) => onStartFocus?.(h)}
        onOpenCreateHabit={() => {
          setEditingHabit(null);
          setIsModalOpen(true);
        }}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Habits List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-2xl font-display font-bold text-white">Today's Habits</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => onStartFocus?.()}
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-primary/20 hover:bg-primary/30 active:bg-primary/40 text-primary hover:text-white border border-primary/40 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-primary/10 touch-manipulation cursor-pointer"
                title="Start a timed Deep Work countdown session"
              >
                <Zap className="w-3.5 h-3.5 fill-primary" /> Focus Session
              </button>

              <button 
                onClick={() => {
                  setEditingHabit(null);
                  setIsModalOpen(true);
                }}
                className="btn-primary py-2.5 text-xs px-4 flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" /> Add Habit
              </button>
            </div>
          </div>

          {/* Deep Work Quick Launcher Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-accent-purple/10 to-transparent border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Deep Work Focus Sprint</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-primary/30 text-primary border border-primary/40 font-extrabold">Flow Mode</span>
                </div>
                <div className="text-[11px] text-platinum/50 mt-0.5">
                  Single-task with zero distractions. Countdown timer, ambient soundscapes & XP bonuses.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onStartFocus?.()}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-deep text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Launch Timer</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {activeHabits.length > 0 ? (
              activeHabits.map((habit) => (
                <HabitCard 
                  key={habit.id}
                  habit={habit}
                  onToggle={(id, e) => toggleHabit(id, e)}
                  onStartFocus={(h) => onStartFocus?.(h)}
                  onUpdateProgress={(id, val) => {
                    if (onUpdateHabitProgress) {
                      onUpdateHabitProgress(id, val);
                    } else {
                      setHabits(prev => prev.map(h => h.id === id ? { ...h, currentValue: val, completedToday: val >= (h.targetValue || 1) } : h));
                    }
                  }}
                  onEdit={(h, e) => startEditHabit(h, e)}
                  onDelete={(id, e) => requestDeleteHabit(id, e)}
                  onTogglePin={handleTogglePin}
                  isPinned={pinnedHabitIds ? pinnedHabitIds.includes(habit.id) : habit.isPinned}
                />
              ))
            ) : (
              <div className="glass-panel p-12 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary opacity-40" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">No habits for today</h3>
                  <p className="text-platinum/40 max-w-xs mx-auto text-sm">
                    Start building your discipline by adding your first daily habit.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditingHabit(null);
                    setIsModalOpen(true);
                  }}
                  className="btn-secondary py-2 px-6 text-sm"
                >
                  <Plus className="w-4 h-4" /> Create Habit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl min-w-0 border border-white/5"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-primary" /> Weekly Performance
            </h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B14AE0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#B14AE0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#ffffff40', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#16161D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#B14AE0' }}
                    formatter={(val: any) => [`${val}%`, 'Completion']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completion" 
                    stroke="#B14AE0" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorComp)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Focus Distribution Analytics Widget */}
          <FocusDistributionWidget habits={habits} />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 rounded-2xl relative overflow-hidden group border border-primary/20 bg-primary/5 cursor-pointer" 
            onClick={() => setActiveTab('coach')}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">AI Performance Insight</span>
              </div>
              <p className="text-sm text-platinum/80 mb-4 leading-relaxed font-medium">
                "{userProfile.name || 'Champion'}, your momentum score is {userProfile.momentumScore}%. Consistency beats intensity. Keep going!"
              </p>
              <button className="text-primary text-xs font-bold hover:underline flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Get Personalized Coaching <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, icon: Icon, color, description }: any) => {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    success: 'text-success bg-success/10 border-success/20',
    lavender: 'text-lavender bg-lavender/10 border-lavender/20',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl border", colorMap[color] || colorMap.primary)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn("text-xs font-bold uppercase tracking-wider", color === 'success' || (typeof trend === 'string' && trend.startsWith('+')) ? 'text-success' : 'text-platinum/40')}>
          {trend}
        </span>
      </div>
      <div className="space-y-1">
        <h3 className="text-platinum/40 text-xs font-bold uppercase tracking-wider">{title}</h3>
        <div className="text-3xl font-display font-bold text-white">{value}</div>
        <p className="text-xs text-platinum/40 mt-1">{description}</p>
      </div>
    </motion.div>
  );
};
