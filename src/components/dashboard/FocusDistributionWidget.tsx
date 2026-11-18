import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Habit } from '../../types';

interface FocusDistributionWidgetProps {
  habits: Habit[];
  onSelectCategory?: (category: string) => void;
}

interface CategorySlice {
  name: string;
  percentage: number;
  rawScore: number;
  color: string;
  gradientId: string;
  startColor: string;
  endColor: string;
  completedCount: number;
  totalCount: number;
  detail: string;
}

const CATEGORY_COLORS: Record<string, { start: string; end: string; solid: string }> = {
  Productivity: { start: '#C084FC', end: '#9333EA', solid: '#B14AE0' },
  Fitness: { start: '#60A5FA', end: '#2563EB', solid: '#3B82F6' },
  Health: { start: '#34D399', end: '#059669', solid: '#10B981' },
  Mindfulness: { start: '#E879F9', end: '#C026D3', solid: '#D946EF' },
  Learning: { start: '#FBBF24', end: '#D97706', solid: '#F59E0B' },
  Finance: { start: '#94A3B8', end: '#475569', solid: '#64748B' },
  Custom: { start: '#A78BFA', end: '#7C3AED', solid: '#8B5CF6' }
};

export const FocusDistributionWidget: React.FC<FocusDistributionWidgetProps> = ({ habits }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const activeHabits = useMemo(() => {
    return habits.filter(h => !h.isArchived && !h.isPaused);
  }, [habits]);

  // Compute energy distribution mathematically from habit effort and completions
  const { slices, topCategory, totalTrackedScore, insight } = useMemo(() => {
    if (activeHabits.length === 0) {
      return {
        slices: [],
        topCategory: null,
        totalTrackedScore: 0,
        insight: "Add your first habit to track where your daily focus flows."
      };
    }

    const categoryStats: Record<
      string,
      { score: number; completedCount: number; totalCount: number; timingMinutes: number; quantitativeUnits: number }
    > = {};

    activeHabits.forEach(habit => {
      const cat = habit.category || 'Custom';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { score: 0, completedCount: 0, totalCount: 0, timingMinutes: 0, quantitativeUnits: 0 };
      }

      categoryStats[cat].totalCount += 1;
      if (habit.completedToday) {
        categoryStats[cat].completedCount += 1;
      }

      // Calculate weight based on habit type & today's recorded progress
      if (habit.type === 'timing') {
        const trackedMinutes = habit.currentValue || (habit.completedToday ? (habit.targetValue || 15) : 0);
        const targetMinutes = habit.targetValue || 15;
        categoryStats[cat].timingMinutes += trackedMinutes;
        // 1 min of timing = 1 point; baseline scheduled effort = 10 pts
        const effortScore = trackedMinutes > 0 ? trackedMinutes : (targetMinutes * 0.4);
        const completionBonus = habit.completedToday ? 15 : 0;
        categoryStats[cat].score += effortScore + completionBonus;
      } else if (habit.type === 'quantitative') {
        const trackedUnits = habit.currentValue || (habit.completedToday ? (habit.targetValue || 10) : 0);
        const targetUnits = habit.targetValue || 10;
        categoryStats[cat].quantitativeUnits += trackedUnits;
        const effortScore = (trackedUnits / Math.max(1, targetUnits)) * 25;
        const completionBonus = habit.completedToday ? 15 : 0;
        categoryStats[cat].score += Math.max(5, effortScore) + completionBonus;
      } else {
        // Binary yes/no habit
        const baseScore = 15;
        const completionBonus = habit.completedToday ? 20 : 0;
        categoryStats[cat].score += baseScore + completionBonus;
      }
    });

    let totalScore = Object.values(categoryStats).reduce((sum, item) => sum + item.score, 0);
    if (totalScore <= 0) totalScore = 1;

    // Convert to percentage slices
    const rawSlices: CategorySlice[] = Object.entries(categoryStats).map(([name, stat], index) => {
      const palette = CATEGORY_COLORS[name] || CATEGORY_COLORS.Custom;
      const rawPct = (stat.score / totalScore) * 100;
      
      let detail = `${stat.completedCount}/${stat.totalCount} completed`;
      if (stat.timingMinutes > 0) {
        detail = `${Math.round(stat.timingMinutes)}m tracked • ${stat.completedCount}/${stat.totalCount} done`;
      } else if (stat.quantitativeUnits > 0) {
        detail = `${stat.quantitativeUnits} units • ${stat.completedCount}/${stat.totalCount} done`;
      }

      return {
        name,
        percentage: Math.round(rawPct),
        rawScore: stat.score,
        color: palette.solid,
        gradientId: `focus-grad-${index}-${name.toLowerCase()}`,
        startColor: palette.start,
        endColor: palette.end,
        completedCount: stat.completedCount,
        totalCount: stat.totalCount,
        detail
      };
    });

    // Sort descending by percentage
    rawSlices.sort((a, b) => b.rawScore - a.rawScore);

    // Normalize rounding so percentages sum precisely to 100%
    const sumPct = rawSlices.reduce((acc, s) => acc + s.percentage, 0);
    if (rawSlices.length > 0 && sumPct !== 100) {
      rawSlices[0].percentage += (100 - sumPct);
    }

    const top = rawSlices.length > 0 ? rawSlices[0] : null;

    // Generate intelligent dynamic insight from actual data
    let dynamicInsight = "Where your energy went today.";
    if (top) {
      if (top.percentage >= 60) {
        dynamicInsight = `${top.name} is your dominant focus area today (${top.percentage}%).`;
      } else if (top.completedCount > 0 && top.completedCount === top.totalCount) {
        dynamicInsight = `All ${top.name} goals completed today. Outstanding work!`;
      } else if (rawSlices.length > 1 && rawSlices[0].percentage - rawSlices[1].percentage < 15) {
        dynamicInsight = `Balanced distribution between ${rawSlices[0].name} & ${rawSlices[1].name}.`;
      } else {
        dynamicInsight = `You invested the most focus in ${top.name} today.`;
      }
    }

    return {
      slices: rawSlices,
      topCategory: top,
      totalTrackedScore: totalScore,
      insight: dynamicInsight
    };
  }, [activeHabits]);

  // Active slice in view (hovered or default top)
  const activeSlice = useMemo(() => {
    if (hoveredCategory) {
      const found = slices.find(s => s.name === hoveredCategory);
      if (found) return found;
    }
    return topCategory || {
      name: 'No Habits',
      percentage: 0,
      rawScore: 0,
      color: '#B14AE0',
      gradientId: 'default-grad',
      startColor: '#C084FC',
      endColor: '#9333EA',
      completedCount: 0,
      totalCount: 0,
      detail: 'Add a habit to start tracking'
    };
  }, [hoveredCategory, slices, topCategory]);

  // SVG Donut calculation metrics
  const size = 180;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Compute SVG stroke-dasharray segments with small gap separators
  const donutSegments = useMemo(() => {
    if (slices.length === 0) return [];
    
    const gapDeg = slices.length > 1 ? 3 : 0;
    const totalGapLength = (gapDeg / 360) * circumference * slices.length;
    const usableCircumference = Math.max(0, circumference - totalGapLength);

    let currentOffset = 0;

    return slices.map(slice => {
      const arcLength = (slice.percentage / 100) * usableCircumference;
      const isHovered = hoveredCategory === slice.name;
      const strokeDasharray = `${Math.max(1, arcLength)} ${circumference}`;
      const strokeDashoffset = -currentOffset;
      
      currentOffset += arcLength + (gapDeg / 360) * circumference;

      return {
        ...slice,
        strokeDasharray,
        strokeDashoffset,
        isHovered
      };
    });
  }, [slices, circumference, hoveredCategory]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel p-5 rounded-2xl min-w-0 border border-white/10 bg-[#0c0a17]/90 shadow-[0_8px_32px_-8px_rgba(177,74,224,0.15)] relative overflow-hidden group"
    >
      {/* Subtle Purple Background Glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-all duration-700" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-1.5 tracking-tight">
            <Zap className="w-4 h-4 text-warning fill-warning/20 shrink-0" />
            <span>Focus Distribution</span>
          </h3>
          <p className="text-[11px] font-medium text-platinum/50 mt-0.5">
            Where your energy went today
          </p>
        </div>

        {topCategory && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-platinum/70 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: topCategory.color }} />
            <span>{topCategory.name}</span>
          </div>
        )}
      </div>

      {/* Main Content Visual Area */}
      {activeHabits.length > 0 && slices.length > 0 ? (
        <div className="space-y-4 relative z-10">
          {/* Donut Chart with Centered Hero Stat */}
          <div className="relative flex items-center justify-center my-1">
            <div className="relative w-[180px] h-[180px]">
              <svg 
                className="w-full h-full -rotate-90 transform" 
                viewBox={`0 0 ${size} ${size}`}
              >
                <defs>
                  {slices.map(slice => (
                    <linearGradient 
                      key={slice.gradientId} 
                      id={slice.gradientId} 
                      x1="0%" y1="0%" x2="100%" y2="100%"
                    >
                      <stop offset="0%" stopColor={slice.startColor} />
                      <stop offset="100%" stopColor={slice.endColor} />
                    </linearGradient>
                  ))}
                  {/* Subtle drop shadow filter for active segment */}
                  <filter id="focus-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#B14AE0" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Base track circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth={strokeWidth}
                />

                {/* Interactive Donut Segments */}
                {donutSegments.map(segment => (
                  <circle
                    key={segment.name}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={`url(#${segment.gradientId})`}
                    strokeWidth={segment.isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      filter: segment.isHovered ? 'url(#focus-glow)' : 'none',
                      opacity: hoveredCategory && !segment.isHovered ? 0.45 : 1
                    }}
                    onMouseEnter={() => setHoveredCategory(segment.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                ))}
              </svg>

              {/* Center Metrics Display */}
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-4"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlice.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <span 
                      className="text-3xl font-display font-black tracking-tight leading-none drop-shadow-sm text-white"
                    >
                      {activeSlice.percentage}%
                    </span>
                    <span 
                      className="text-[11px] font-bold uppercase tracking-wider mt-1 truncate max-w-[110px]"
                      style={{ color: activeSlice.startColor }}
                    >
                      {activeSlice.name}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Interactive Tooltip Card on Hover */}
          <AnimatePresence>
            {hoveredCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: activeSlice.color }} 
                    />
                    <span className="font-bold text-white">{activeSlice.name}</span>
                  </div>
                  <span className="text-[11px] font-medium text-platinum/70">
                    {activeSlice.detail}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact Grid / List Legend */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
            {slices.map(slice => {
              const isSelected = hoveredCategory === slice.name;
              return (
                <div
                  key={slice.name}
                  onMouseEnter={() => setHoveredCategory(slice.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white/10 border border-white/10 scale-[1.02]' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm transition-transform"
                      style={{ 
                        backgroundColor: slice.color,
                        transform: isSelected ? 'scale(1.3)' : 'scale(1)'
                      }} 
                    />
                    <span className="text-[11px] font-semibold text-platinum/80 truncate">
                      {slice.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-white shrink-0 ml-1.5">
                    {slice.percentage}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Intelligent Data-Driven Insight Footer */}
          <div className="pt-2 flex items-start gap-2 text-platinum/70 text-[11px] leading-snug border-t border-white/5">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span className="font-medium text-platinum/80">
              {insight}
            </span>
          </div>
        </div>
      ) : (
        /* Zero State when No Active Habits */
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <Zap className="w-7 h-7 text-primary/60" />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-0.5">No Active Focus Data</p>
            <p className="text-xs text-platinum/50 max-w-[200px]">
              Complete or add habits to start generating daily focus analytics.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
