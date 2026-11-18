import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { VIBE_OPTIONS, VibeOption } from '../../lib/vibeData';

interface ChooseYourVibeProps {
  selectedVibe?: string;
  onSelectVibe: (vibeId?: string) => void;
  className?: string;
}

export const ChooseYourVibe: React.FC<ChooseYourVibeProps> = ({
  selectedVibe,
  onSelectVibe,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <span>Choose Your Vibe</span>
            <span className="text-primary animate-pulse">✨</span>
          </h3>

          {selectedVibe && (
            <button
              type="button"
              onClick={() => onSelectVibe(undefined)}
              className="text-xs font-semibold text-platinum/50 hover:text-white transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer"
              title="Clear personality vibe selection"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear selection</span>
            </button>
          )}
        </div>
        <p className="text-xs sm:text-sm text-platinum/60 leading-relaxed max-w-xl">
          Choose what suits you best. Make your profile reflect your personality and the way you approach your goals.
        </p>
      </div>

      {/* Grid of 6 Personality Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1" role="radiogroup" aria-label="Personality Vibe Options">
        {VIBE_OPTIONS.map((vibe: VibeOption) => {
          const isSelected = selectedVibe?.toLowerCase() === vibe.id.toLowerCase() ||
                             selectedVibe?.toLowerCase() === vibe.name.toLowerCase();

          return (
            <motion.button
              key={vibe.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                // If already selected, user can click to keep or select another
                onSelectVibe(vibe.id);
              }}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group select-none overflow-hidden",
                isSelected
                  ? cn(
                      vibe.cardActiveBorder,
                      vibe.cardActiveBg,
                      vibe.cardGlow,
                      "ring-1 ring-inset ring-white/10"
                    )
                  : "bg-surface/40 hover:bg-surface/80 border-white/5 hover:border-white/15"
              )}
            >
              {/* Selected Glow Accent Background */}
              {isSelected && (
                <div 
                  className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40"
                  style={{ backgroundColor: vibe.colorName === 'amber' ? '#f59e0b' : vibe.colorName === 'purple' ? '#a855f7' : vibe.colorName === 'red' ? '#ef4444' : vibe.colorName === 'emerald' ? '#10b981' : vibe.colorName === 'yellow' ? '#eab308' : '#14b8a6' }}
                />
              )}

              {/* Card Header: Emoji & Selection Indicator */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-transform duration-200 shrink-0",
                  isSelected
                    ? "bg-white/15 shadow-inner scale-110"
                    : "bg-white/5 group-hover:scale-105"
                )}>
                  <span>{vibe.emoji}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isSelected ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Selected</span>
                    </motion.div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/15 group-hover:border-white/30 transition-colors flex items-center justify-center" />
                  )}
                </div>
              </div>

              {/* Card Title */}
              <div className="space-y-1 relative z-10 flex-1">
                <h4 className={cn(
                  "font-display font-bold text-sm tracking-tight transition-colors",
                  isSelected ? "text-white" : "text-white/90 group-hover:text-white"
                )}>
                  {vibe.name}
                </h4>

                {/* Card Description */}
                <p className="text-xs text-platinum/60 leading-snug font-normal">
                  {vibe.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
