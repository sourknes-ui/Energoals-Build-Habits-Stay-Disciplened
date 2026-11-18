import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Flame, 
  Target, 
  Calendar as CalendarIcon, 
  Info,
  Filter,
  BarChart2,
  Activity,
  Award
} from 'lucide-react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  AreaChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Cell
} from 'recharts';
import { Habit, HabitCategory } from '../../types';
import { getTodayKey, isHabitDueOnDate } from '../../lib/habitUtils';
import { cn } from '../../lib/utils';

interface WeeklyConsistencyChartProps {
  habits: Habit[];
  className?: string;
}

type ViewMode = 'composed' | 'area' | 'counts';
type WeekRange = 'currentWeek' | 'last7Days';

interface DayConsistencyData {
  dayName: string;
  fullDayName: string;
  dateStr: string;
  formattedDate: string;
  isToday: boolean;
  isFuture: boolean;
  dueCount: number;
  completedCount: number;
  rate: number;
  benchmark: number;
  status: 'exceptional' | 'target_met' | 'in_progress' | 'rest_day' | 'upcoming';
}

export const WeeklyConsistencyChart: React.FC<WeeklyConsistencyChartProps> = ({ 
  habits, 
  className 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('composed');
  const [rangeMode, setRangeMode] = useState<WeekRange>('currentWeek');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'All'>('All');

  // Filter habits by category if selected
  const filteredHabits = useMemo(() => {
    const active = habits.filter(h => !h.isArchived && !h.isPaused);
    if (selectedCategory === 'All') return active;
    return active.filter(h => h.category === selectedCategory);
  }, [habits, selectedCategory]);

  // Compute 7 days of consistency data
  const chartData: DayConsistencyData[] = useMemo(() => {
    const now = new Date();
    const todayKey = getTodayKey(now);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const dates: Date[] = [];

    if (rangeMode === 'currentWeek') {
      // Monday to Sunday of the current week
      const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
      const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
      }
    } else {
      // Rolling last 7 days (today is the last day)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates.push(d);
      }
    }

    return dates.map(d => {
      const dateStr = getTodayKey(d);
      const isToday = dateStr === todayKey;
      const isFuture = d > now && !isToday;
      const dayIndex = d.getDay(); // 0 is Sun, 1 is Mon...
      const mappedIdx = dayIndex === 0 ? 6 : dayIndex - 1;
      const dayName = dayNames[mappedIdx];
      const fullDayName = fullDayNames[mappedIdx];
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      let dueCount = 0;
      let completedCount = 0;

      filteredHabits.forEach(h => {
        const isDue = isHabitDueOnDate(h, d);
        if (!isDue) return;

        dueCount++;

        const target = Math.max(1, h.targetValue || (h.type === 'timing' ? 15 : h.type === 'quantitative' ? 10 : 1));

        if (isToday) {
          const isDone = Boolean(h.completedToday || (h.history && h.history[dateStr] !== undefined && (
            typeof h.history[dateStr] === 'boolean' 
              ? h.history[dateStr] 
              : Number(h.history[dateStr]) >= target
          )));
          if (isDone) completedCount++;
        } else if (!isFuture) {
          const histVal = h.history?.[dateStr];
          const isDone = histVal !== undefined && (
            typeof histVal === 'boolean'
              ? histVal === true
              : Number(histVal) >= target
          );
          if (isDone) completedCount++;
        }
      });

      const rate = dueCount > 0 ? Math.round((completedCount / dueCount) * 100) : 0;

      let status: DayConsistencyData['status'] = 'in_progress';
      if (isFuture) {
        status = 'upcoming';
      } else if (dueCount === 0) {
        status = 'rest_day';
      } else if (rate >= 100) {
        status = 'exceptional';
      } else if (rate >= 80) {
        status = 'target_met';
      } else {
        status = 'in_progress';
      }

      return {
        dayName,
        fullDayName,
        dateStr,
        formattedDate,
        isToday,
        isFuture,
        dueCount,
        completedCount,
        rate: isFuture ? 0 : rate,
        benchmark: 80,
        status
      };
    });
  }, [filteredHabits, rangeMode]);

  // Aggregate metrics
  const evaluatedDays = useMemo(() => chartData.filter(d => !d.isFuture), [chartData]);
  
  const avgConsistency = useMemo(() => {
    if (evaluatedDays.length === 0) return 0;
    const daysWithDue = evaluatedDays.filter(d => d.dueCount > 0);
    if (daysWithDue.length === 0) return 0;
    return Math.round(daysWithDue.reduce((sum, d) => sum + d.rate, 0) / daysWithDue.length);
  }, [evaluatedDays]);

  const targetMetCount = useMemo(() => {
    return evaluatedDays.filter(d => d.dueCount > 0 && d.rate >= 80).length;
  }, [evaluatedDays]);

  const totalCompletions = useMemo(() => {
    return evaluatedDays.reduce((sum, d) => sum + d.completedCount, 0);
  }, [evaluatedDays]);

  const todayData = useMemo(() => {
    return chartData.find(d => d.isToday) || null;
  }, [chartData]);

  // Dynamic custom tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data: DayConsistencyData = payload[0].payload;

    return (
      <div className="glass-panel p-4 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl space-y-2 min-w-[210px] text-xs">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-1.5">
              <span>{data.fullDayName}</span>
              {data.isToday && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/20 text-primary font-black uppercase tracking-wider">
                  Today
                </span>
              )}
            </div>
            <div className="text-[10px] text-platinum/50 font-mono">{data.formattedDate}</div>
          </div>
          <div className="text-right">
            <span className={cn(
              "text-lg font-display font-black",
              data.isFuture ? "text-platinum/30" : data.rate >= 80 ? "text-emerald-400" : data.rate >= 50 ? "text-primary" : "text-warning"
            )}>
              {data.isFuture ? '—' : `${data.rate}%`}
            </span>
          </div>
        </div>

        {data.isFuture ? (
          <div className="text-platinum/40 italic py-1">Upcoming day in current cycle</div>
        ) : (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-platinum/70">
              <span>Habits Completed:</span>
              <span className="font-bold text-white font-mono">{data.completedCount} / {data.dueCount}</span>
            </div>
            <div className="flex items-center justify-between text-platinum/70">
              <span>Consistency Status:</span>
              <span className={cn(
                "font-bold uppercase text-[10px] tracking-wider",
                data.rate >= 100 ? "text-emerald-400" : data.rate >= 80 ? "text-teal-400" : data.rate >= 50 ? "text-primary" : "text-warning"
              )}>
                {data.dueCount === 0 ? "Rest Day" : data.rate >= 100 ? "100% Perfect" : data.rate >= 80 ? "Target Met" : "Building"}
              </span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  data.rate >= 80 ? "bg-emerald-400" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, data.rate)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("glass-panel p-6 md:p-8 rounded-2xl min-w-0 border border-white/5 space-y-6", className)}>
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-display font-bold text-white">
              Weekly Habit Consistency
            </h3>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
              avgConsistency >= 80 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : avgConsistency >= 50 
                  ? "bg-primary/10 border-primary/30 text-primary" 
                  : "bg-warning/10 border-warning/30 text-warning"
            )}>
              {avgConsistency >= 80 ? "Optimal Rhythm" : avgConsistency >= 50 ? "Steady Momentum" : "Needs Consistency"}
            </span>
          </div>
          <p className="text-xs text-platinum/50">
            Real-time completion percentage mapped against scheduled habits for the week.
          </p>
        </div>

        {/* View Mode & Range Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-white/5 border border-white/10 hover:border-white/20 text-platinum text-xs rounded-xl px-3 py-1.5 font-bold transition-all appearance-none pr-8 cursor-pointer focus:outline-none focus:border-primary"
            >
              <option value="All" className="bg-bg-dark text-white">All Categories</option>
              <option value="Productivity" className="bg-bg-dark text-white">Productivity</option>
              <option value="Fitness" className="bg-bg-dark text-white">Fitness</option>
              <option value="Health" className="bg-bg-dark text-white">Health</option>
              <option value="Mindfulness" className="bg-bg-dark text-white">Mindfulness</option>
              <option value="Learning" className="bg-bg-dark text-white">Learning</option>
              <option value="Finance" className="bg-bg-dark text-white">Finance</option>
            </select>
            <Filter className="w-3 h-3 text-platinum/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Range Selector */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setRangeMode('currentWeek')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                rangeMode === 'currentWeek' 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-platinum/50 hover:text-white"
              )}
            >
              Mon–Sun
            </button>
            <button
              onClick={() => setRangeMode('last7Days')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                rangeMode === 'last7Days' 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-platinum/50 hover:text-white"
              )}
            >
              Last 7d
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('composed')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === 'composed' 
                  ? "bg-white/10 text-white" 
                  : "text-platinum/50 hover:text-white"
              )}
              title="Bar & Trend line"
            >
              Bars
            </button>
            <button
              onClick={() => setViewMode('area')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === 'area' 
                  ? "bg-white/10 text-white" 
                  : "text-platinum/50 hover:text-white"
              )}
              title="Smooth area curve"
            >
              Area
            </button>
            <button
              onClick={() => setViewMode('counts')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === 'counts' 
                  ? "bg-white/10 text-white" 
                  : "text-platinum/50 hover:text-white"
              )}
              title="Total completed vs scheduled counts"
            >
              Counts
            </button>
          </div>
        </div>
      </div>

      {/* Quick KPI Stat Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-platinum/40 tracking-wider">Avg Consistency</div>
            <div className="text-xl font-display font-black text-white mt-0.5">{avgConsistency}%</div>
          </div>
          <Activity className="w-5 h-5 text-primary opacity-60" />
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-platinum/40 tracking-wider">Target Met (≥80%)</div>
            <div className="text-xl font-display font-black text-emerald-400 mt-0.5">{targetMetCount} <span className="text-xs text-platinum/40">/ {evaluatedDays.length}d</span></div>
          </div>
          <Target className="w-5 h-5 text-emerald-400 opacity-60" />
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-platinum/40 tracking-wider">Total Executions</div>
            <div className="text-xl font-display font-black text-white mt-0.5">{totalCompletions} <span className="text-xs text-platinum/40">done</span></div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-teal-400 opacity-60" />
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-platinum/40 tracking-wider">Today's Pace</div>
            <div className="text-xl font-display font-black text-white mt-0.5">
              {todayData ? `${todayData.completedCount}/${todayData.dueCount}` : '—'}
            </div>
          </div>
          <Flame className="w-5 h-5 text-warning opacity-60" />
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-[320px] w-full relative">
        {filteredHabits.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-platinum/40">
            <CalendarIcon className="w-12 h-12 mb-3 text-platinum/20" />
            <p className="text-sm font-bold text-white">No active habits in this category</p>
            <p className="text-xs text-platinum/40 mt-1">Add habits or switch the category filter above to see consistency analytics.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'composed' ? (
              <ComposedChart data={chartData} margin={{ top: 20, right: 15, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B14AE0" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="barGradHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="dayName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A3A3B3', fontSize: 12, fontWeight: 600 }} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 25, 50, 75, 100]}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A3A3B3', fontSize: 11 }} 
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={80} 
                  stroke="#10B981" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.7}
                  label={{ 
                    value: 'Target (80%)', 
                    position: 'insideTopRight', 
                    fill: '#10B981', 
                    fontSize: 10,
                    fontWeight: 700
                  }} 
                />
                <Bar 
                  dataKey="rate" 
                  name="Completion Rate" 
                  radius={[8, 8, 2, 2]} 
                  maxBarSize={48}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.isFuture 
                          ? 'rgba(255,255,255,0.05)' 
                          : entry.rate >= 80 
                            ? 'url(#barGradHigh)' 
                            : 'url(#barGrad)'
                      } 
                    />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#5FD4A7" 
                  strokeWidth={3} 
                  dot={{ fill: '#16161D', stroke: '#5FD4A7', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#5FD4A7', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </ComposedChart>
            ) : viewMode === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 20, right: 15, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaConsistency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B14AE0" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#B14AE0" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="dayName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A3A3B3', fontSize: 12, fontWeight: 600 }} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 25, 50, 75, 100]}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A3A3B3', fontSize: 11 }} 
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={80} 
                  stroke="#10B981" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.7}
                  label={{ 
                    value: 'Target (80%)', 
                    position: 'insideTopRight', 
                    fill: '#10B981', 
                    fontSize: 10,
                    fontWeight: 700
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#B14AE0" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#areaConsistency)" 
                />
              </AreaChart>
            ) : (
              <ComposedChart data={chartData} margin={{ top: 20, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="dayName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A3A3B3', fontSize: 12, fontWeight: 600 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A3A3B3', fontSize: 11 }} 
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="dueCount" 
                  name="Scheduled" 
                  fill="rgba(255,255,255,0.1)" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={28}
                />
                <Bar 
                  dataKey="completedCount" 
                  name="Completed" 
                  fill="#B14AE0" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={28}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend & Insight Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs text-platinum/50">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            <span>Optimal (≥80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>Regular Pace (&lt;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-emerald-400" />
            <span>80% Target Benchmark</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-platinum/40 italic">
          <Info className="w-3.5 h-3.5" />
          <span>Consistent routines maintain discipline velocity</span>
        </div>
      </div>
    </div>
  );
};
