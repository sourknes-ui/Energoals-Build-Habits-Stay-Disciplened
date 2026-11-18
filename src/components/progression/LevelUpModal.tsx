import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Zap, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { calculateLevelProgression } from '../../lib/progressionEngine';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
  totalXP: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  oldLevel,
  newLevel,
  totalXP
}) => {
  if (!isOpen) return null;

  const currentLevelInfo = calculateLevelProgression(totalXP);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop with dark blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-bg-dark/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-[#0e0c1a] border border-primary/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(177,74,224,0.35)] overflow-hidden z-10 text-center"
        >
          {/* Glowing Ambient Light Orbs */}
          <div className="absolute -top-24 -left-24 w-52 h-52 bg-primary/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-accent-purple/30 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-platinum/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Trophy / Crown Badge */}
          <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-accent-purple to-warning opacity-40 blur-md"
            />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-deep border border-white/20 flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white drop-shadow" />
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className="space-y-2 mb-5">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest"
            >
              <Sparkles className="w-3.5 h-3.5" /> Level Up Celebration
            </motion.div>
            <h2 className="text-3xl font-display font-black text-white tracking-tight pt-1">
              LEVEL UP!
            </h2>
            <div className="flex items-center justify-center gap-3 text-lg font-bold text-platinum/80">
              <span className="text-platinum/50 font-medium">Level {oldLevel}</span>
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="text-primary font-extrabold text-2xl">Level {newLevel}</span>
            </div>

            {/* Level -> Name -> XP Range Card */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-base font-bold text-white">{currentLevelInfo.title}</span>
                <span className="text-platinum/30">•</span>
                <span className="text-xs font-bold text-primary font-mono">{currentLevelInfo.xpRangeFormatted}</span>
              </div>
            </div>
          </div>

          {/* Reached Milestone Statement */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/15 via-accent-purple/10 to-transparent border border-primary/30 mb-5 text-center">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-1">
              Milestone Achieved
            </div>
            <p className="text-sm font-semibold text-white leading-snug">
              “{currentLevelInfo.milestone}”
            </p>
          </div>

          {/* Unlocked Capabilities List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-platinum/50 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-warning" /> Unlocked Perks & Capabilities
            </div>
            <div className="space-y-2">
              {currentLevelInfo.unlockedPerks.map((perk, index) => (
                <div key={index} className="flex items-center gap-2 text-xs font-semibold text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary to-primary-deep text-white font-bold text-sm tracking-wide shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Claim & Keep Building
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
