import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Flame,
  Activity,
  Zap,
  Smile,
  Repeat,
  Download,
  Award,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '../../lib/utils';
import {
  Habit,
  Goal,
  Routine,
  JournalEntry,
  FocusSessionRecord,
  XPTransaction
} from '../../types';
import {
  getTodayKey,
  isHabitDueOnDate,
  isHabitValueCompleted,
  calculateLongestStreak
} from '../../lib/habitUtils';
import { triggerBrowserDownload } from '../../lib/storageSync';
import { WeeklyConsistencyChart } from './WeeklyConsistencyChart';
import { ToastType } from '../ui/Feedback';

interface AnalyticsDashboardProps {
  habits: Habit[];
  goals: Goal[];
  routines: Routine[];
  journalEntries: JournalEntry[];
  focusSessions?: FocusSessionRecord[];
  xpTransactions?: XPTransaction[];
  showToast?: (message: string, type?: ToastType) => void;
}

type RangeKey = '7d' | '30d' | '90d' | 'all';

const CATEGORY_COLORS: Record<string, string> = {
  Productivity: '#B14AE0',
  Health: '#5FD4A7',
  Mindfulness: '#D9B6FF',
  Learning: '#F5B971',
  Fitness: '#3B82F6',
  Finance: '#C8C6D1',
  Custom: '#FFFFFF'
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  habits,
  goals,
  routines,
  journalEntries,
  focusSessions = [],
  xpTransactions = [],
  showToast
}) => {
  const [range, setRange] = useState<RangeKey>('7d');

  const rangeDays = useMemo(() => {
    if (range === '7d') return 7;
    if (range === '30d') return 30;
    if (range === '90d') return 90;
    return 180;
  }, [range]);

  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (rangeDays - 1));
    return d;
  }, [rangeDays]);

  const activeHabits = useMemo(() => habits.filter((h) => !h.isArchived && !h.isPaused), [habits]);

  // Consistency score across the selected window
  const consistencyScore = useMemo(() => {
    if (activeHabits.length === 0) return '0.0';
    const now = new Date();
    const todayKey = getTodayKey(now);
    const daysToCheck = range === 'all' ? 30 : rangeDays;
    let totalDue = 0;
    let totalCompleted = 0;

    for (let i = 0; i < daysToCheck; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = getTodayKey(d);
      const isToday = dateKey === todayKey;

      activeHabits.forEach((h) => {
        if (!isHabitDueOnDate(h, d)) return;
        totalDue++;
        if (isToday) {
          if (h.completedToday || isHabitValueCompleted(h, h.history?.[dateKey])) {
            totalCompleted++;
          }
        } else if (isHabitValueCompleted(h, h.history?.[dateKey])) {
          totalCompleted++;
        }
      });
    }

    if (totalDue === 0) return '0.0';
    return ((totalCompleted / totalDue) * 100).toFixed(1);
  }, [activeHabits, range, rangeDays]);

  // Total active streaks
  const totalStreaks = useMemo(() => {
    return habits.reduce((acc, h) => acc + (h.streak || 0), 0);
  }, [habits]);

  // Real Focus Hours from Focus Sessions + manual timing habit events (never double-counted)
  const focusSummary = useMemo(() => {
    const filteredSessions = focusSessions.filter((s) => {
      if (s.mode !== 'focus') return false;
      if (range === 'all') return true;
      return new Date(s.completedAt) >= cutoffDate;
    });

    const sessionMinutes = filteredSessions.reduce(
      (sum, s) => sum + (s.actualSecondsCompleted || s.durationMinutes * 60) / 60,
      0
    );

    const todayKey = getTodayKey();
    const manualTimingMinutes = habits
      .filter((h) => h.type === 'timing')
      .reduce((sum, h) => {
        const focusSessionMinutesOnHabitToday = (h.events || [])
          .filter(
            (e) =>
              e.notes === 'focus_session' &&
              getTodayKey(new Date(e.timestamp)) === todayKey
          )
          .reduce((acc, e) => acc + (typeof e.value === 'number' ? e.value : 0), 0);

        const totalHabitVal = h.currentValue || 0;
        const extraManual = Math.max(0, totalHabitVal - focusSessionMinutesOnHabitToday);
        return sum + extraManual;
      }, 0);

    const totalMinutes = Math.round(sessionMinutes + manualTimingMinutes);
    return {
      hours: (totalMinutes / 60).toFixed(1),
      minutes: totalMinutes,
      sessionCount: filteredSessions.length
    };
  }, [focusSessions, habits, range, cutoffDate]);

  // Average Energy from Journal in range
  const filteredJournal = useMemo(() => {
    if (range === 'all') return journalEntries;
    return journalEntries.filter((e) => new Date(e.date) >= cutoffDate);
  }, [journalEntries, range, cutoffDate]);

  const avgEnergy = useMemo(() => {
    if (filteredJournal.length === 0) return '0.0';
    return (
      filteredJournal.reduce((acc, e) => acc + (e.energy || 0), 0) / filteredJournal.length
    ).toFixed(1);
  }, [filteredJournal]);

  // Category Distribution
  const categoryDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    habits.forEach((h) => {
      distribution[h.category] = (distribution[h.category] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#FFFFFF'
    }));
  }, [habits]);

  // Energy Trend Data (chronological left-to-right)
  const energyTrendData = useMemo(() => {
    return [...filteredJournal]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14)
      .map((e) => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        energy: e.energy,
        mood: e.mood
      }));
  }, [filteredJournal]);

  // XP Earned Over Time chart data
  const xpChartData = useMemo(() => {
    const now = new Date();
    const bucketDays = Math.min(range === 'all' ? 30 : rangeDays, 30);
    const map: Record<string, number> = {};
    const orderedKeys: { key: string; label: string }[] = [];

    for (let i = bucketDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = getTodayKey(d);
      map[key] = 0;
      orderedKeys.push({
        key,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    xpTransactions.forEach((tx) => {
      const k = tx.date || getTodayKey(new Date(tx.timestamp));
      if (k in map) {
        map[k] = Math.max(0, map[k] + tx.amount);
      }
    });

    return orderedKeys.map((item) => ({
      date: item.label,
      xp: map[item.key] || 0
    }));
  }, [xpTransactions, range, rangeDays]);

  // Habit Performance Breakdown (Top & Needs Attention)
  const habitPerformance = useMemo(() => {
    const now = new Date();
    const daysBack = Math.min(range === 'all' ? 30 : rangeDays, 30);
    return activeHabits.map((h) => {
      let due = 0;
      let done = 0;
      for (let i = 0; i < daysBack; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        if (!isHabitDueOnDate(h, d)) continue;
        due++;
        const k = getTodayKey(d);
        if (i === 0 ? h.completedToday : isHabitValueCompleted(h, h.history?.[k])) {
          done++;
        }
      }
      const rate = due > 0 ? Math.round((done / due) * 100) : h.completedToday ? 100 : 0;
      const bestStreak = Math.max(h.longestStreak || 0, h.streak || 0, calculateLongestStreak(h, now));
      return {
        id: h.id,
        name: h.name,
        emoji: h.emoji || '✨',
        streak: h.streak || 0,
        bestStreak,
        rate
      };
    });
  }, [activeHabits, range, rangeDays]);

  const topPerformers = useMemo(
    () => [...habitPerformance].sort((a, b) => b.rate - a.rate || b.streak - a.streak).slice(0, 4),
    [habitPerformance]
  );

  const needsAttention = useMemo(
    () =>
      [...habitPerformance]
        .filter((h) => h.rate < 70)
        .sort((a, b) => a.rate - b.rate)
        .slice(0, 4),
    [habitPerformance]
  );

  // Local Calendar Heatmap Data (Last 140 days, zero UTC drift)
  const heatmapData = useMemo(() => {
    const data = [];
    const today = new Date();
    const todayKey = getTodayKey(today);

    for (let i = 139; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = getTodayKey(date);

      let completedCount = 0;
      let totalCount = 0;

      habits.forEach((h) => {
        if (!isHabitDueOnDate(h, date)) return;
        totalCount++;
        if (dateStr === todayKey) {
          if (h.completedToday) completedCount++;
        } else if (h.history && h.history[dateStr] !== undefined) {
          if (isHabitValueCompleted(h, h.history[dateStr])) completedCount++;
        }
      });

      const hasJournalEntry = journalEntries.some(
        (e) => getTodayKey(new Date(e.date)) === dateStr
      );
      if (hasJournalEntry) {
        completedCount++;
        totalCount++;
      }

      const rate = totalCount > 0 ? completedCount / totalCount : 0;
      data.push({ date: dateStr, rate });
    }
    return data;
  }, [habits, journalEntries]);

  const handleExportAnalytics = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      range,
      summary: {
        consistencyScore: `${consistencyScore}%`,
        activeHabits: activeHabits.length,
        totalActiveStreaks: totalStreaks,
        focusHours: Number(focusSummary.hours),
        focusSessionsCount: focusSummary.sessionCount,
        averageEnergy: Number(avgEnergy),
        activeGoals: goals.filter((g) => g.status !== 'archived').length,
        completedGoals: goals.filter((g) => g.progress >= 100 || g.status === 'completed').length,
        routinesCount: routines.length
      },
      habitPerformance,
      xpHistory: xpChartData
    };
    triggerBrowserDownload(
      `energoals-analytics-${range}-${getTodayKey()}.json`,
      JSON.stringify(report, null, 2),
      'application/json'
    );
    showToast?.('Analytics report downloaded', 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-1 sm:mb-2">Analytics</h1>
          <p className="text-platinum/60 font-medium text-xs sm:text-sm">Deep insights into your personal growth velocity.</p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
            {([
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: 'all', label: 'All' }
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  range === item.id ? 'bg-primary text-white shadow-sm' : 'text-platinum/50 hover:text-white'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportAnalytics}
            className="btn-primary py-2 px-3 sm:px-4 text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export Data
          </button>
        </div>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="glass-panel p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-sm font-bold text-platinum/40 uppercase tracking-widest truncate">Consistency</span>
          </div>
          <div className="text-2xl sm:text-4xl font-display font-bold text-white mb-1 sm:mb-2">{consistencyScore}%</div>
          <div className="flex items-center gap-1.5 text-platinum/40 text-xs sm:text-sm font-bold">
            <TrendingUp className="w-3.5 h-3.5" /> {range.toUpperCase()} avg rate
          </div>
        </div>
        <div className="glass-panel p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-warning/10 text-warning">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-sm font-bold text-platinum/40 uppercase tracking-widest truncate">Streaks</span>
          </div>
          <div className="text-2xl sm:text-4xl font-display font-bold text-white mb-1 sm:mb-2">{totalStreaks}</div>
          <p className="text-platinum/40 text-xs sm:text-sm">Combined active days</p>
        </div>
        <div className="glass-panel p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-success/10 text-success">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-sm font-bold text-platinum/40 uppercase tracking-widest truncate">Focus Time</span>
          </div>
          <div className="text-2xl sm:text-4xl font-display font-bold text-white mb-1 sm:mb-2">{focusSummary.hours}h</div>
          <p className="text-platinum/40 text-xs sm:text-sm">{focusSummary.sessionCount} sessions • {focusSummary.minutes}m</p>
        </div>
        <div className="glass-panel p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-error/10 text-error">
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-sm font-bold text-platinum/40 uppercase tracking-widest truncate">Avg. Energy</span>
          </div>
          <div className="text-2xl sm:text-4xl font-display font-bold text-white mb-1 sm:mb-2">{avgEnergy}</div>
          <p className="text-platinum/40 text-xs sm:text-sm">From {filteredJournal.length} entries</p>
        </div>
      </div>

      {/* Featured Weekly Habit Completion Consistency Chart */}
      <WeeklyConsistencyChart habits={habits} />

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-2xl min-w-0">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Energy Trend
          </h3>
          <div className="h-[320px] w-full">
            {energyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={energyTrendData}>
                  <defs>
                    <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5FD4A7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5FD4A7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16161D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="energy" stroke="#5FD4A7" strokeWidth={3} fillOpacity={1} fill="url(#colorEnergy)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-platinum/20 h-full">
                <Zap className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-xs">No journal data yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl min-w-0">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> XP Earned Over Time
          </h3>
          <div className="h-[320px] w-full">
            {xpChartData.some((d) => d.xp > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={xpChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16161D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    formatter={(val: any) => [`+${val} XP`, 'XP Earned']}
                  />
                  <Bar dataKey="xp" fill="#B14AE0" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-platinum/20 h-full">
                <Award className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-xs">Complete habits or focus sessions to track XP</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution, Routines & Top/Attention Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-2xl min-w-0">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Category Distribution
          </h3>
          <div className="h-[280px] w-full flex items-center">
            {habits.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#16161D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 pl-4 sm:pl-8 shrink-0">
                  {categoryDistribution.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <div>
                        <div className="text-xs font-bold text-platinum/40 uppercase tracking-widest">{cat.name}</div>
                        <div className="text-base font-bold text-white">
                          {((cat.value / habits.length) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-platinum/20">
                <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-xs">No data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" /> Habit Performance & Routines
          </h3>

          {topPerformers.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Top Performers</div>
              {topPerformers.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span>{h.emoji}</span>
                    <span className="font-bold text-sm text-white truncate">{h.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs font-bold">
                    <span className="text-warning">{h.streak}d streak (best {h.bestStreak}d)</span>
                    <span className="text-emerald-400">{h.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {needsAttention.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-widest text-warning flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Needs Attention
              </div>
              {needsAttention.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-warning/5 border border-warning/15">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span>{h.emoji}</span>
                    <span className="font-bold text-sm text-white truncate">{h.name}</span>
                  </div>
                  <span className="text-xs font-bold text-warning shrink-0">{h.rate}% consistency</span>
                </div>
              ))}
            </div>
          )}

          {routines.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="text-[11px] font-bold uppercase tracking-widest text-platinum/40">Active Routines</div>
              {routines.map((routine) => (
                <div key={routine.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${routine.color}20`, color: routine.color }}
                    >
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{routine.name}</div>
                      <div className="text-xs text-platinum/40">
                        {routine.habits.length} steps • {routine.duration}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-platinum/40 uppercase tracking-widest">{routine.time}</div>
                </div>
              ))}
            </div>
          )}

          {topPerformers.length === 0 && routines.length === 0 && (
            <div className="py-10 text-center text-platinum/20">
              <Repeat className="w-10 h-10 mb-3 opacity-20 mx-auto" />
              <p className="font-bold uppercase tracking-widest text-xs">Add habits or routines to see performance stats</p>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="glass-panel p-8 rounded-2xl min-w-0">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Consistency Heatmap
        </h3>
        <div className="grid grid-cols-7 md:grid-cols-14 lg:grid-cols-28 gap-2">
          {heatmapData.map((day, i) => {
            const opacity = day.rate > 0 ? 0.2 + day.rate * 0.8 : 0;

            return (
              <div
                key={i}
                className="aspect-square rounded-sm transition-all hover:scale-125 cursor-pointer"
                style={{
                  backgroundColor: day.rate > 0 ? '#B14AE0' : '#16161D',
                  opacity: day.rate > 0 ? opacity : 1,
                  border: day.rate === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                }}
                title={`${day.date}: ${Math.round(day.rate * 100)}% completion`}
              />
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-end gap-2 text-[10px] font-bold text-platinum/40 uppercase tracking-widest">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-surface" />
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <div className="w-3 h-3 rounded-sm bg-primary/70" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
