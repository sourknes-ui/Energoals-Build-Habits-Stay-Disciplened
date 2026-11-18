import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Star, 
  Medal, 
  Crown, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  CheckSquare,
  Lock, 
  Unlock,
  Zap, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp,
  Layers,
  Clock,
  Heart,
  RotateCcw,
  Target,
  Sunrise,
  Moon,
  Watch,
  Search,
  Filter,
  Flame,
  HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Achievement, AchievementCategory, AchievementRarity, UserProfile } from '../../types';
import { calculateLevelProgression, getAllLevelDefinitions, LevelDefinition } from '../../lib/progressionEngine';
import { BADGE_CATEGORIES, RARITY_CONFIG } from '../../lib/badgeEngine';

interface RewardsOverviewProps {
  achievements: Achievement[];
  userProfile: UserProfile;
}

export const RewardsOverview: React.FC<RewardsOverviewProps> = ({ achievements, userProfile }) => {
  const [activeMainTab, setActiveMainTab] = useState<'achievements' | 'levels'>('achievements');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unlocked' | 'locked' | 'in_progress'>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<'all' | '1-10' | '11-20'>('all');

  const totalLifetimeXP = userProfile?.totalLifetimeXP ?? userProfile?.currentXP ?? 0;
  const currentLevelInfo = calculateLevelProgression(totalLifetimeXP);
  const currentLevel = currentLevelInfo.level;
  const allLevels = getAllLevelDefinitions(20);

  // Icon lookup resolver
  const renderBadgeIcon = (iconName: string, className?: string) => {
    const props = { className: className || "w-7 h-7" };
    switch (iconName) {
      case 'Flame': return <Flame {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'Medal': return <Medal {...props} />;
      case 'Award': return <Award {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'CheckCircle2': return <CheckCircle2 {...props} />;
      case 'CheckSquare': return <CheckSquare {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'ShieldCheck': return <ShieldCheck {...props} />;
      case 'TrendingUp': return <TrendingUp {...props} />;
      case 'Layers': return <Layers {...props} />;
      case 'Clock': return <Clock {...props} />;
      case 'Heart': return <Heart {...props} />;
      case 'RotateCcw': return <RotateCcw {...props} />;
      case 'Target': return <Target {...props} />;
      case 'Sunrise': return <Sunrise {...props} />;
      case 'Moon': return <Moon {...props} />;
      case 'Watch': return <Watch {...props} />;
      default: return <Star {...props} />;
    }
  };

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter(badge => {
      // Category filter
      if (selectedCategory !== 'all' && badge.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'unlocked' && !badge.unlocked) return false;
      if (selectedStatus === 'locked' && badge.unlocked) return false;
      if (selectedStatus === 'in_progress' && (badge.unlocked || badge.currentProgress === 0)) return false;
      // Rarity filter
      if (selectedRarity !== 'all' && badge.rarity !== selectedRarity) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = badge.title.toLowerCase().includes(q);
        const matchesDesc = badge.description.toLowerCase().includes(q);
        const matchesReq = badge.requirement?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesReq) return false;
      }
      return true;
    });
  }, [achievements, selectedCategory, selectedStatus, selectedRarity, searchQuery]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const inProgressCount = achievements.filter(a => !a.unlocked && a.currentProgress > 0).length;
  const lockedCount = achievements.filter(a => !a.unlocked && a.currentProgress === 0).length;
  const completionPercentage = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  // Levels filter
  const filteredLevels = allLevels.filter(lvl => {
    if (selectedRange === '1-10') return lvl.level <= 10;
    if (selectedRange === '11-20') return lvl.level > 10 && lvl.level <= 20;
    return true;
  });

  // Format unlock date cleanly
  const formatUnlockDate = (dateStr?: string) => {
    if (!dateStr) return 'Unlocked';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Unlocked';
      return d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return 'Unlocked';
    }
  };

  return (
    <div className="space-y-8 pb-16" id="rewards-overview-root">
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Achievement & Milestone System
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">Milestones & Badges</h1>
          <p className="text-platinum/60 font-medium text-sm sm:text-base mt-1">
            Track your journey through progressive discipline tiers, deep focus achievements, and habit mastery.
          </p>
        </div>

        {/* Global XP and Level Metric Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-surface px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 font-display font-bold text-sm">
              L{currentLevel}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-platinum/40">{currentLevelInfo.title}</div>
              <div className="text-sm font-display font-bold text-white font-mono">{totalLifetimeXP.toLocaleString()} XP</div>
            </div>
          </div>

          <div className="bg-surface px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-platinum/40">Badges Unlocked</div>
              <div className="text-sm font-display font-bold text-amber-400 font-mono">
                {unlockedCount} / {achievements.length} <span className="text-xs text-platinum/40 font-normal">({completionPercentage}%)</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab('achievements')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer",
              activeMainTab === 'achievements'
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 hover:bg-white/10 text-platinum/60 hover:text-white"
            )}
          >
            <Trophy className="w-4 h-4" />
            <span>Badge Collection</span>
            <span className="ml-1 px-1.5 py-0.2 rounded bg-white/20 text-[10px] font-extrabold font-mono">
              {unlockedCount}/{achievements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('levels')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer",
              activeMainTab === 'levels'
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 hover:bg-white/10 text-platinum/60 hover:text-white"
            )}
          >
            <Layers className="w-4 h-4" />
            <span>Level Progression Roadmap</span>
            <span className="ml-1 px-1.5 py-0.2 rounded bg-white/20 text-[10px] font-extrabold font-mono">
              {allLevels.length} Levels
            </span>
          </button>
        </div>

        {activeMainTab === 'levels' && (
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setSelectedRange('all')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                selectedRange === 'all' ? "bg-white/15 text-white" : "text-platinum/50 hover:text-white"
              )}
            >
              All Levels
            </button>
            <button
              onClick={() => setSelectedRange('1-10')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                selectedRange === '1-10' ? "bg-white/15 text-white" : "text-platinum/50 hover:text-white"
              )}
            >
              Levels 1–10
            </button>
            <button
              onClick={() => setSelectedRange('11-20')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                selectedRange === '11-20' ? "bg-white/15 text-white" : "text-platinum/50 hover:text-white"
              )}
            >
              Levels 11–20
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BADGES & TROPHIES COLLECTION */}
      {/* ========================================================================= */}
      {activeMainTab === 'achievements' && (
        <div className="space-y-6">
          {/* Achievement Summary & Progress Hero Bar */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 bg-gradient-to-r from-[#121024] via-surface to-[#161226] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-widest text-primary mb-1">
                  Discipline Achievement System
                </div>
                <div className="text-xl sm:text-2xl font-display font-bold text-white">
                  {unlockedCount} of {achievements.length} Badges Unlocked
                </div>
                <p className="text-xs text-platinum/60 mt-0.5">
                  Every achievement automatically monitors and updates its progress in real-time as you complete habits, routines, and focus sessions.
                </p>
              </div>

              {/* Rarity breakdown badges */}
              <div className="flex flex-wrap items-center gap-2">
                {(['common', 'rare', 'epic', 'legendary', 'mythic'] as AchievementRarity[]).map((r) => {
                  const cfg = RARITY_CONFIG[r];
                  const totalOfRarity = achievements.filter(a => a.rarity === r).length;
                  const unlockedOfRarity = achievements.filter(a => a.rarity === r && a.unlocked).length;
                  return (
                    <button
                      key={r}
                      onClick={() => setSelectedRarity(selectedRarity === r ? 'all' : r)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                        selectedRarity === r 
                          ? `${cfg.bg} ${cfg.border} text-white ring-1 ring-white/30` 
                          : "bg-white/5 border-white/10 text-platinum/60 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="capitalize">{r}:</span>
                      <span className="font-mono text-white">{unlockedOfRarity}/{totalOfRarity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-platinum/60 font-medium">Overall Collection Progress</span>
                <span className="text-primary font-mono">{completionPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-primary to-amber-500 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Filter Bar: Category Tabs, Status Filter, Search */}
          <div className="space-y-3">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                  selectedCategory === 'all'
                    ? "bg-white text-bg-dark font-extrabold shadow-md"
                    : "bg-surface hover:bg-white/10 text-platinum/70 border border-white/5 hover:border-white/15"
                )}
              >
                <Trophy className="w-3.5 h-3.5" /> All Categories ({achievements.length})
              </button>

              {BADGE_CATEGORIES.map(cat => {
                const count = achievements.filter(a => a.category === cat.id).length;
                const unlocked = achievements.filter(a => a.category === cat.id && a.unlocked).length;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                      isSelected
                        ? "bg-primary text-white shadow-lg shadow-primary/20 border border-primary/40"
                        : "bg-surface hover:bg-white/10 text-platinum/70 border border-white/5 hover:border-white/15"
                    )}
                  >
                    <span>{cat.label}</span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded text-[10px] font-mono",
                      isSelected ? "bg-white/20 text-white font-extrabold" : "bg-white/5 text-platinum/40"
                    )}>
                      {unlocked}/{count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Secondary Controls: Search, Status, Rarity */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-surface/50 p-2 rounded-2xl border border-white/5">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-platinum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search badges by title, description, or requirement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-platinum/40 focus:outline-none focus:border-primary/50 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-platinum/40 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div 
                id="badge-status-filter-group"
                className="grid grid-cols-2 min-[540px]:grid-cols-4 items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 w-full lg:w-auto shrink-0"
              >
                <button
                  id="filter-status-all"
                  type="button"
                  onClick={() => setSelectedStatus('all')}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    selectedStatus === 'all' 
                      ? "bg-white/20 text-white shadow-sm" 
                      : "text-platinum/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Trophy className="w-3 h-3 shrink-0" />
                  <span>All</span>
                  <span className="font-mono text-[11px] opacity-80 shrink-0">({achievements.length})</span>
                </button>

                <button
                  id="filter-status-unlocked"
                  type="button"
                  onClick={() => setSelectedStatus('unlocked')}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    selectedStatus === 'unlocked' 
                      ? "bg-emerald-500/20 text-emerald-300 shadow-sm" 
                      : "text-platinum/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Unlock className="w-3 h-3 shrink-0" />
                  <span>Unlocked</span>
                  <span className="font-mono text-[11px] opacity-80 shrink-0">({unlockedCount})</span>
                </button>

                <button
                  id="filter-status-in-progress"
                  type="button"
                  onClick={() => setSelectedStatus('in_progress')}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    selectedStatus === 'in_progress' 
                      ? "bg-blue-500/20 text-blue-300 shadow-sm" 
                      : "text-platinum/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Zap className="w-3 h-3 shrink-0" />
                  <span>In Progress</span>
                  <span className="font-mono text-[11px] opacity-80 shrink-0">({inProgressCount})</span>
                </button>

                <button
                  id="filter-status-locked"
                  type="button"
                  onClick={() => setSelectedStatus('locked')}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    selectedStatus === 'locked' 
                      ? "bg-white/15 text-white shadow-sm" 
                      : "text-platinum/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Locked</span>
                  <span className="font-mono text-[11px] opacity-80 shrink-0">({lockedCount})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Badge Grid Display */}
          {filteredAchievements.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-white/5 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-platinum/40">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No badges match your filter</h3>
              <p className="text-xs text-platinum/50 max-w-sm mx-auto">
                Try adjusting your search query, status selector, or category filter to discover more achievements.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setSelectedRarity('all');
                  setSearchQuery('');
                }}
                className="btn-secondary text-xs px-4 py-2 mx-auto"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {filteredAchievements.map((badge) => {
                const rarityCfg = RARITY_CONFIG[badge.rarity || 'common'];
                const progressRatio = badge.maxProgress > 0 ? badge.currentProgress / badge.maxProgress : (badge.unlocked ? 1 : 0);
                const progressPercent = Math.min(100, Math.round(progressRatio * 100));

                return (
                  <motion.div
                    key={badge.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={cn(
                      "glass-panel rounded-3xl border p-5 sm:p-6 transition-all relative overflow-hidden flex flex-col justify-between group",
                      badge.unlocked
                        ? "bg-surface border-white/15 shadow-lg"
                        : "bg-surface/50 border-white/5 opacity-85 hover:opacity-100 hover:border-white/15"
                    )}
                  >
                    {/* Ambient Glow for unlocked/rare badges */}
                    {badge.unlocked && (
                      <div 
                        className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-25 pointer-events-none"
                        style={{ backgroundColor: badge.color }}
                      />
                    )}

                    <div className="space-y-4">
                      {/* Top Header: Rarity Tag + Category Tag */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className={cn(
                              "text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border flex items-center gap-1",
                              rarityCfg.bg,
                              rarityCfg.border
                            )}
                            style={{ color: rarityCfg.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rarityCfg.color }} />
                            {rarityCfg.label}
                          </span>

                          <span className="text-[10px] font-bold uppercase tracking-wider text-platinum/50 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                            {badge.category}
                          </span>
                        </div>

                        {/* Lock / Unlock State Pill */}
                        <div>
                          {badge.unlocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shadow-sm">
                              🔓 <span className="font-extrabold">Unlocked</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-platinum/40 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                              🔒 <span className="font-medium">Locked</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Icon & Title Row */}
                      <div className="flex items-start gap-4">
                        <div 
                          className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-105",
                            badge.unlocked 
                              ? "shadow-lg shadow-black/40 border-white/20" 
                              : "border-white/5 bg-white/5 grayscale opacity-75"
                          )}
                          style={{
                            backgroundColor: badge.unlocked ? `${badge.color}20` : undefined,
                            color: badge.unlocked ? badge.color : '#94A3B8'
                          }}
                        >
                          {renderBadgeIcon(badge.icon)}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <h3 className="text-lg font-display font-bold text-white tracking-tight leading-snug group-hover:text-primary transition-colors">
                            {badge.title}
                          </h3>
                          <p className="text-xs text-platinum/70 leading-relaxed font-normal line-clamp-2">
                            {badge.description}
                          </p>
                        </div>
                      </div>

                      {/* Requirement Box */}
                      <div className={cn(
                        "p-3 rounded-2xl border text-xs leading-relaxed transition-colors",
                        badge.unlocked
                          ? "bg-white/[0.03] border-white/10 text-platinum/80"
                          : "bg-black/20 border-white/5 text-platinum/60"
                      )}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-platinum/40 mb-0.5">
                          Requirement
                        </div>
                        <div className="font-medium text-white/90">
                          {badge.requirement || badge.description}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Area: Real Progress & Unlock Date */}
                    <div className="mt-5 pt-3.5 border-t border-white/5 space-y-2.5">
                      {/* Real Progress Counter */}
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[11px] font-mono text-platinum/50">Progress</span>
                        <span className={cn(
                          "font-mono font-bold text-xs",
                          badge.unlocked ? "text-emerald-400" : "text-white"
                        )}>
                          {badge.progressFormatted || `${badge.currentProgress.toLocaleString()} / ${badge.maxProgress.toLocaleString()} ${badge.unit}`}
                        </span>
                      </div>

                      {/* Progress Visual Bar */}
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            badge.unlocked 
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                              : "bg-gradient-to-r from-primary to-accent-purple"
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Unlock Status / Unlock Date line */}
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        {badge.unlocked ? (
                          <div className="flex items-center justify-between w-full text-platinum/50 font-medium">
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Milestone Achieved
                            </span>
                            <span className="font-mono text-platinum/60">
                              {formatUnlockDate(badge.unlockedAt)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full text-platinum/40 font-medium">
                            <span>
                              {badge.maxProgress - badge.currentProgress > 0
                                ? `${(badge.maxProgress - badge.currentProgress).toLocaleString()} ${badge.unit} remaining`
                                : 'Almost there'}
                            </span>
                            <span className="font-mono">{progressPercent}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LEVEL SYSTEM & MILESTONES ROADMAP */}
      {/* ========================================================================= */}
      {activeMainTab === 'levels' && (
        <div className="space-y-6">
          {/* Current Level Hero Banner */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-primary/30 relative overflow-hidden bg-gradient-to-br from-[#131127] via-[#0e0c1a] to-[#18112e] shadow-[0_10px_35px_rgba(0,0,0,0.4)]">
            <div 
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-25 pointer-events-none"
              style={{ backgroundColor: currentLevelInfo.themeColor }}
            />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-5">
                {/* Level Circle Ring */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary-deep/30 border border-primary/50 flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <div className="text-xs font-extrabold uppercase tracking-widest text-platinum/50">Level</div>
                      <div className="text-3xl sm:text-4xl font-display font-black text-white">{currentLevel}</div>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-primary text-white text-[9px] font-extrabold uppercase tracking-widest shadow-md">
                    Active
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
                      {currentLevelInfo.title}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-primary border border-white/15 text-xs font-mono font-bold">
                      {currentLevelInfo.xpRangeFormatted}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-platinum/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent-purple">Current Milestone:</span>
                    <span className="font-medium text-white">{currentLevelInfo.milestone}</span>
                  </div>
                  <div className="text-xs text-platinum/50 flex items-center gap-3 pt-0.5">
                    <span>{currentLevelInfo.currentTierXP.toLocaleString()} / {currentLevelInfo.xpNeededForTier.toLocaleString()} XP in Tier</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{currentLevelInfo.xpToNextLevel.toLocaleString()} XP to Level {currentLevel + 1}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Next Level Preview */}
              <div className="w-full lg:w-80 space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-platinum/60 uppercase tracking-wider text-[10px]">Tier Progress</span>
                  <span className="text-primary font-mono">{Math.round(currentLevelInfo.progressFraction * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(currentLevelInfo.progressFraction * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary via-accent-purple to-warning rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-platinum/50 pt-0.5">
                  <span>Level {currentLevel}</span>
                  <span className="flex items-center gap-1 text-platinum/70 font-semibold">
                    Next: {calculateLevelProgression(currentLevelInfo.tierEndXP).title} <ChevronRight className="w-3 h-3 text-primary" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Level Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLevels.map((def: LevelDefinition) => {
              const isCompleted = totalLifetimeXP >= def.endXP;
              const isCurrent = totalLifetimeXP >= def.startXP && totalLifetimeXP < def.endXP;
              const isLocked = totalLifetimeXP < def.startXP;

              return (
                <motion.div
                  key={def.level}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group",
                    isCurrent 
                      ? "bg-gradient-to-br from-primary/15 via-surface to-accent-purple/10 border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/30" 
                      : isCompleted
                      ? "bg-surface/90 border-emerald-500/30 hover:border-emerald-500/50 shadow-sm"
                      : "bg-surface/50 border-white/5 opacity-75 hover:opacity-100 hover:border-white/15"
                  )}
                >
                  {isCurrent && (
                    <div 
                      className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
                      style={{ backgroundColor: def.color }}
                    />
                  )}

                  <div className="space-y-3">
                    {/* Top Row: Level Tag + XP Range + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-display font-black uppercase tracking-wider flex items-center gap-1.5",
                          isCurrent 
                            ? "bg-primary text-white shadow-sm" 
                            : isCompleted 
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                            : "bg-white/5 text-platinum/50 border border-white/10"
                        )}>
                          Level {def.level}
                        </span>

                        <span className="font-mono text-xs font-bold text-platinum/70 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                          {def.xpRangeFormatted}
                        </span>
                      </div>

                      <div>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Achieved
                          </span>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary/40 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5" /> Current Rank
                          </span>
                        )}
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-platinum/40 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Level Name */}
                    <div>
                      <h3 className="text-xl font-display font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                        <span>{def.title}</span>
                      </h3>
                    </div>

                    {/* Milestone Statement Box */}
                    <div className={cn(
                      "p-3 rounded-xl border text-xs leading-relaxed",
                      isCurrent
                        ? "bg-primary/10 border-primary/30 text-white"
                        : isCompleted
                        ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-200/90"
                        : "bg-white/[0.02] border-white/5 text-platinum/60"
                    )}>
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5 text-platinum/40">
                        Milestone
                      </div>
                      <p className="font-medium text-white/90">
                        {def.milestone}
                      </p>
                    </div>

                    {/* Unlocked Perks Tags */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-platinum/40">
                        Unlocked Capabilities
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {def.perks.map((perk, pIdx) => (
                          <span 
                            key={pIdx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-platinum/70 flex items-center gap-1"
                          >
                            <Zap className="w-2.5 h-2.5 text-primary" />
                            {perk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Active Level Progress Mini-bar */}
                  {isCurrent && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-platinum/60">Level Progress</span>
                        <span className="text-primary font-mono">{totalLifetimeXP - def.startXP} / {def.endXP - def.startXP} XP</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent-purple rounded-full"
                          style={{ width: `${Math.round(((totalLifetimeXP - def.startXP) / (def.endXP - def.startXP)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isLocked && (
                    <div className="mt-4 pt-2 text-[10px] font-semibold text-platinum/40 flex items-center justify-between border-t border-white/5">
                      <span>Requires {def.startXP.toLocaleString()} XP total</span>
                      <span className="text-primary/70">{(def.startXP - totalLifetimeXP).toLocaleString()} XP away</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
