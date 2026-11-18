import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const LevelUpScreen: React.FC<{ level: number, onContinue: () => void }> = ({ level, onContinue }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-bg-dark/95 backdrop-blur-md"
    >
      {/* Confetti effect simulation */}
      {[...Array(10)].map((_, i) => (
        <motion.div
           key={i}
           className="absolute w-3 h-3 bg-primary rounded-full"
           initial={{ opacity: 1, x: 0, y: 0 }}
           animate={{ 
             opacity: 0, 
             x: (Math.random() - 0.5) * 400, 
             y: (Math.random() - 0.5) * 400,
             scale: 0 
           }}
           transition={{ duration: 1.5, ease: "easeOut" }}
           style={{ left: '50%', top: '50%' }}
        />
      ))}

      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 200 }}
        className="relative max-w-sm w-full text-center space-y-6 glass-panel p-8 rounded-3xl border border-white/10"
      >
        <motion.div 
           animate={{ rotate: [0, 10, -10, 0] }}
           transition={{ repeat: Infinity, duration: 2 }}
           className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto"
        >
          <Sparkles className="w-12 h-12 text-primary" />
        </motion.div>
        
        <div className="space-y-2">
          <h2 className="text-4xl font-display font-bold text-white tracking-tighter">LEVEL {level}</h2>
          <p className="text-xl text-platinum">Unlocked new potential!</p>
        </div>

        <button 
          onClick={onContinue}
          className="btn-primary w-full py-4 text-lg font-bold"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
};
