import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface XPNotificationProps {
  xp: number;
  onComplete: () => void;
}

export const XPNotification: React.FC<XPNotificationProps> = ({ xp, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: -50 }}
      exit={{ opacity: 0 }}
      className="fixed z-[200] text-primary font-bold text-xl pointer-events-none"
      style={{ left: '50%', top: '50%' }} // Simple positioning
    >
      +{xp} XP
    </motion.div>
  );
};
