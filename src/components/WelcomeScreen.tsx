import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

export const WelcomeScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-bg-dark"
    >
      <div className="max-w-md w-full text-center space-y-8">
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-display font-bold text-white">Welcome to EnerGoals</h1>
          <p className="text-xl text-platinum/60">
            Build better habits.<br />
            Complete challenges.<br />
            Become your strongest self.
          </p>
        </div>

        <button 
          onClick={onContinue}
          className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};
