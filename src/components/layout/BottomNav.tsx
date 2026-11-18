import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Sparkles,
  Settings,
  Home
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'hub', label: 'Home', icon: Home },
  { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'coach', label: 'AI Coach', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-[#12121A]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.7)] flex items-center justify-around px-2 select-none h-[calc(4.25rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)]"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <motion.button
            key={item.id}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 flex-1 h-full py-1.5 transition-colors touch-manipulation cursor-pointer",
              isActive ? "text-primary" : "text-platinum/50 hover:text-platinum/80"
            )}
          >
            {/* Active Pill Indicator Glow */}
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute inset-x-2 inset-y-1.5 bg-primary/15 rounded-2xl border border-primary/25 shadow-[0_0_15px_rgba(177,74,224,0.2)]"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}

            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
              <Icon 
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(177,74,224,0.5)]" : "text-platinum/50"
                )} 
              />
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider transition-colors",
                isActive ? "text-white font-extrabold" : "text-platinum/50"
              )}>
                {item.label}
              </span>
            </div>

            {/* Active micro dot */}
            {isActive && (
              <motion.div 
                layoutId="bottomNavDot"
                className="absolute bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_6px_var(--primary)]"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};
