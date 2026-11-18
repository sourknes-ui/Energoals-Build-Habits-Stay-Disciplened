import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Repeat, 
  Calendar, 
  BarChart3, 
  BookOpen, 
  Trophy, 
  Settings,
  LogOut,
  Sparkles,
  Award
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Logo } from '../Logo';
import { UserProfile } from '../../types';
import { motion } from 'motion/react';
import { calculateLevelProgression } from '../../lib/progressionEngine';
import { getVibeById } from '../../lib/vibeData';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  onEditProfile: () => void;
  onLogout: () => void;
  className?: string;
}

const navItems = [
  { id: 'hub', label: 'Home', icon: LayoutDashboard },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'routines', label: 'Routines', icon: Repeat },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'coach', label: 'AI Coach', icon: Sparkles },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'rewards', label: 'Milestones', icon: Award },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userProfile, onEditProfile, onLogout, className }) => {
  const levelInfo = calculateLevelProgression(userProfile.totalLifetimeXP ?? userProfile.currentXP ?? 0);
  const currentLevel = levelInfo.level;
  const progressPercent = Math.round(levelInfo.progressFraction * 100);
  const vibeInfo = getVibeById(userProfile.vibe);

  return (
    <aside className={cn("w-64 h-screen glass-panel border-r border-border flex flex-col fixed left-0 top-0 z-50 transition-colors duration-250", className)}>
      <div className="p-6 mb-2">
        <Logo />
      </div>

      <div className="px-6 mb-6">
        <div 
          onClick={onEditProfile}
          className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0">
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-primary font-bold">{userProfile.name[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{userProfile.name}</div>
              <div className="text-[11px] font-semibold text-primary flex items-center gap-1 truncate">
                <span>Level {currentLevel}</span>
                <span className="text-platinum/30">•</span>
                <span className="text-platinum/60 truncate">{levelInfo.title}</span>
              </div>
            </div>
          </div>

          {/* Personality Vibe State */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-platinum/40">Vibe</span>
            {vibeInfo ? (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 shadow-sm truncate max-w-[130px]",
                vibeInfo.badgeBg
              )}>
                <span>{vibeInfo.emoji}</span>
                <span className="truncate">{vibeInfo.name}</span>
              </span>
            ) : (
              <span className="text-[10px] font-medium text-platinum/50 italic flex items-center gap-1 group-hover:text-primary transition-colors">
                <span>✨</span>
                <span>Choose your vibe</span>
              </span>
            )}
          </div>

          {/* Clean Synchronized XP Bar */}
          <div className="space-y-1 pt-1 border-t border-white/5">
            <div className="flex justify-between items-center text-[10px] font-bold text-platinum/50 font-mono">
              <span>{levelInfo.currentTierXP.toLocaleString()} / {levelInfo.xpNeededForTier.toLocaleString()} XP</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary-deep transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-primary/10 text-primary border-l-4 border-primary" 
                : "text-white hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === item.id ? "text-primary" : "text-white/40 group-hover:text-white"
            )} />
            <span className={cn("font-medium", item.id === 'dashboard' ? "ml-2" : "")}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto space-y-4">
        <div 
          onClick={() => setActiveTab('coach')}
          className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary-deep/5 border border-primary/20 relative overflow-hidden group cursor-pointer"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Coach</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
        </div>

        <div className="pt-4 border-t border-white/5 space-y-1">
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
              activeTab === 'settings' 
                ? "bg-primary/10 text-primary border-l-4 border-primary" 
                : "text-platinum/60 hover:bg-white/5 hover:text-platinum"
            )}
          >
            <Settings className={cn(
              "w-5 h-5",
              activeTab === 'settings' ? "text-primary" : "text-platinum/40"
            )} />
            <span className="font-medium">Settings</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-danger/60 hover:bg-danger/10 hover:text-danger transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
