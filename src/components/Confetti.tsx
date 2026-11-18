import React from 'react';
import { motion } from 'motion/react';

export const Confetti: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ['#4CAF50', '#8BC34A', '#FFC107', '#E91E63', '#2196F3'][Math.floor(Math.random() * 5)],
            left: '50%',
            top: '50%'
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ 
            x: (Math.random() - 0.5) * 800, 
            y: (Math.random() - 0.5) * 800,
            opacity: 0,
            rotate: Math.random() * 360
          }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};
