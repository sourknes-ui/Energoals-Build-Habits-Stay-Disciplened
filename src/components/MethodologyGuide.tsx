import React from 'react';
import { motion } from 'motion/react';
import { X, Target, BarChart3, Repeat, Zap, Shield, BookOpen } from 'lucide-react';

interface MethodologyGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  {
    icon: Target,
    title: 'Habit Amendment System',
    description: 'Track habits with precision using our deterministic system. Choose between Checked (binary), Counted (numeric goal tracking), or Timing (elapsed duration) habits. Every action creates an immutable event log for total auditability.'
  },
  {
    icon: BarChart3,
    title: 'Precision Analytics',
    description: 'Derived from your immutable event history, not just current state. Get weekly/monthly rollups, streak consistency analysis, and energy-mood correlation charts based on your actual performance data.'
  },
  {
    icon: Repeat,
    title: 'Routine Automation',
    description: 'Bundle related habits into time-boxed routines. Set specific start times and durations to foster consistency and reduce decision fatigue during busy days.'
  },
  {
    icon: Zap,
    title: 'AI Coach Momentum',
    description: 'Your personal AI mentor analyzes your amendment logs to provide actionable feedback, suggest routine adjustments, and keep your consistency momentum high.'
  },
  {
    icon: Shield,
    title: 'Privacy & Data Control',
    description: 'Your habit data is stored locally first, with configurable cloud sync. We prioritize your privacy, ensuring your progress is yours alone.'
  },
  {
    icon: BookOpen,
    title: 'Reflective Journaling',
    description: 'Link your habit performance with journal entries. Track mood and energy alongside your completions to understand the "why" behind your productivity patterns.'
  }
];

export const MethodologyGuide: React.FC<MethodologyGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-bg-dark/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h2 className="text-2xl font-display font-bold text-white">How Energoals Works</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-platinum/40">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
            <h3 className="text-lg font-bold text-white mb-2">Core Methodology</h3>
            <p className="text-platinum/80 leading-relaxed">
              Energoals follows a closed-loop habit system framework. Every user action flows through a deterministic pipeline that updates state, persists data as immutable logs, and surfaces real-time progress feedback. We prioritize progress visibility and consistency, ensuring your data is always accurate and auditable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-surface p-6 rounded-2xl border border-white/5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-bold text-white">{f.title}</h4>
                <p className="text-sm text-platinum/60 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
