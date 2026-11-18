import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sun, Save } from 'lucide-react';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: (data: { energy: number; focus: string }) => void;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({ isOpen, onClose }) => {
  const [energy, setEnergy] = useState(5);
  const [focus, setFocus] = useState('');
  const [view, setView] = useState<'input' | 'quote'>('input');

  const handleClose = (data: { energy: number; focus: string }) => {
    setView('input');
    onClose(data);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-bg-dark/95 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-sm w-full glass-panel p-8 rounded-3xl border border-white/10 space-y-6"
        >
          {view === 'input' ? (
            <>
              <div className="flex items-center gap-3">
                <Sun className="w-8 h-8 text-warning" />
                <h2 className="text-2xl font-display font-bold text-white">Daily Check-in</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-platinum/60">Morning Energy Level ({energy}/10)</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={energy}
                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                    className="w-full accent-primary h-8 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-platinum/60">Primary Daily Focus</label>
                  <input 
                    type="text" 
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="What is your main goal today?"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={() => setView('quote')}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Save Daily Focus
              </button>
            </>
          ) : (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-display font-bold text-white">Focus for Today</h2>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-lg font-medium text-white/95 leading-relaxed">You don't have to be perfect today. You only have to keep your promise to yourself.</p>
              </div>
              <button 
                onClick={() => handleClose({ energy, focus })}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2"
              >
                Continue
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
