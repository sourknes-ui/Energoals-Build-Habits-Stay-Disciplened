import React from 'react';
import { ArrowLeft, Flame, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { UserProfile } from '../../types';
import { Logo } from '../Logo';

interface MobileHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  onEditProfile: () => void;
  onBack?: () => void;
  showBack?: boolean;
  className?: string;
}

const TAB_TITLES: Record<string, string> = {
  hub: 'Home',
  dashboard: 'Dashboard',
  habits: 'Habits',
  goals: 'Goals',
  routines: 'Routines',
  calendar: 'Calendar',
  analytics: 'Analytics',
  journal: 'Journal',
  coach: 'AI Coach',
  challenges: 'Challenges',
  rewards: 'Milestones',
  settings: 'Settings',
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  onEditProfile,
  onBack,
  showBack,
  className,
}) => {
  const currentTitle = TAB_TITLES[activeTab] || 'EnerGoals';

  return (
    <header
      className={cn(
        "lg:hidden sticky top-0 z-40 bg-bg-dark/85 backdrop-blur-2xl border-b border-white/5 transition-all duration-200 select-none",
        "px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Back button or Logo */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack && onBack ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={onBack}
              className="flex items-center gap-1.5 py-1.5 px-2.5 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-platinum border border-white/5 transition-all touch-manipulation cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-platinum/90">
                Back
              </span>
            </motion.button>
          ) : (
            <div 
              onClick={() => setActiveTab('hub')}
              className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform touch-manipulation"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent-purple flex items-center justify-center shadow-md shadow-primary/30">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-display font-extrabold text-base tracking-tight text-white">
                Ener<span className="text-primary">Goals</span>
              </span>
            </div>
          )}

          {/* Current Section Title when showing Back */}
          {showBack && (
            <div className="min-w-0 ml-1">
              <span className="text-sm font-bold text-white truncate block">
                {currentTitle}
              </span>
            </div>
          )}
        </div>

        {/* Right: Stats & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Streaks Badge */}
          {userProfile.totalStreaks > 0 && (
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-bold active:scale-95 transition-transform touch-manipulation cursor-pointer"
              title={`${userProfile.totalStreaks} Day Total Streak`}
            >
              <Flame className="w-3.5 h-3.5 fill-warning animate-pulse" />
              <span>{userProfile.totalStreaks}d</span>
            </div>
          )}

          {/* Level Pill */}
          <div 
            onClick={() => setActiveTab('rewards')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-bold active:scale-95 transition-transform touch-manipulation cursor-pointer"
            title={`Level ${userProfile.currentLevel || 1}`}
          >
            <span>Lv.{userProfile.currentLevel || 1}</span>
          </div>

          {/* Avatar button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onEditProfile}
            className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden hover:scale-105 active:scale-90 transition-transform touch-manipulation cursor-pointer shadow-sm shadow-primary/20"
            title="Edit Profile"
          >
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xs text-primary font-bold">
                {userProfile.name ? userProfile.name[0] : 'U'}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
};
