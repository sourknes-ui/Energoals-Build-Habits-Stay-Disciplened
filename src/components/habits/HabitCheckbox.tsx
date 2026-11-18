import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  scale: number;
}

interface HabitCheckboxProps {
  checked: boolean;
  onToggle: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'checkbox' | 'button';
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const PARTICLE_COLORS = [
  '#10B981', // Emerald
  '#34D399', // Mint
  '#6EE7B7', // Light Emerald
  '#F59E0B', // Amber
  '#FCD34D', // Gold
  '#A855F7', // Violet
  '#38BDF8', // Sky Blue
  '#FFFFFF', // Pure White
];

export const HabitCheckbox: React.FC<HabitCheckboxProps> = ({
  checked,
  onToggle,
  size = 'md',
  variant = 'checkbox',
  label,
  disabled = false,
  className,
  id,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [rippleKey, setRippleKey] = useState<number>(0);

  const triggerBurst = useCallback(() => {
    // Generate 10-12 radial particles
    const particleCount = 10;
    const newParticles: Particle[] = [];
    const baseRadius = variant === 'button' ? 32 : 24;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i * (360 / particleCount) + (Math.random() * 20 - 10)) * (Math.PI / 180);
      const distance = baseRadius + Math.random() * 18;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      const particleSize = 3 + Math.random() * 3.5;
      const delay = Math.random() * 0.06;

      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        size: particleSize,
        color,
        delay,
        scale: 0.8 + Math.random() * 0.5,
      });
    }

    setParticles(newParticles);
    setIsAnimating(true);
    setRippleKey(prev => prev + 1);

    const timer = setTimeout(() => {
      setParticles([]);
      setIsAnimating(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [variant]);

  const prevCheckedRef = React.useRef(checked);
  useEffect(() => {
    if (!prevCheckedRef.current && checked && !isAnimating) {
      triggerBurst();
    }
    prevCheckedRef.current = checked;
  }, [checked, isAnimating, triggerBurst]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    // If transitioning to completed, fire the celebratory particle burst & bounce
    if (!checked) {
      triggerBurst();
    }
    onToggle(e);
  };

  // Sizing definitions
  const sizeClasses = {
    sm: 'w-6 h-6 rounded-lg',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-10 h-10 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  };

  if (variant === 'button') {
    return (
      <div className="relative inline-flex items-center justify-center">
        {/* Shockwave Glow Wave */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              key={`shockwave-${rippleKey}`}
              initial={{ scale: 0.85, opacity: 0.9 }}
              animate={{ scale: 1.35, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="absolute inset-0 rounded-2xl bg-emerald-400/40 pointer-events-none blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Radial Particle Burst */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: 0,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.6,
                delay: p.delay,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 6px ${p.color}`,
              }}
              className="absolute rounded-full pointer-events-none z-30"
            />
          ))}
        </AnimatePresence>

        {/* Interactive Button */}
        <motion.button
          id={id}
          type="button"
          disabled={disabled}
          onClick={handleClick}
          whileTap={{ scale: 0.90 }}
          animate={isAnimating ? {
            scale: [0.90, 1.08, 0.98, 1.0],
          } : { scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={cn(
            "relative px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer select-none",
            checked
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
              : "bg-white/5 text-platinum/60 hover:bg-primary/20 hover:text-primary border border-white/5 hover:border-primary/30",
            disabled && "opacity-40 cursor-not-allowed pointer-events-none",
            className
          )}
        >
          {checked ? (
            <>
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="flex items-center justify-center shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
              <span>{label || 'Completed'}</span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span>{label || 'Mark Complete'}</span>
            </>
          )}
        </motion.button>
      </div>
    );
  }

  // Standalone checkbox variant (square/circular box with checkmark and particle burst)
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Shockwave expanding ring */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            key={`ring-${rippleKey}`}
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute rounded-full border-2 border-emerald-400 bg-emerald-400/20 pointer-events-none inset-0"
          />
        )}
      </AnimatePresence>

      {/* Floating Micro-particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, scale: p.scale, opacity: 1 }}
            animate={{
              x: p.x,
              y: p.y,
              scale: 0,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.55,
              delay: p.delay,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 6px ${p.color}`,
            }}
            className="absolute rounded-full pointer-events-none z-30"
          />
        ))}
      </AnimatePresence>

      {/* Micro-interaction Checkbox Box */}
      <motion.button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleClick}
        whileTap={{ scale: 0.85 }}
        animate={isAnimating ? {
          scale: [0.85, 1.2, 0.95, 1.05, 1.0],
          rotate: [0, -5, 5, 0]
        } : { scale: 1, rotate: 0 }}
        transition={isAnimating ? {
          duration: 0.45,
          ease: "easeOut"
        } : {
          duration: 0.15
        }}
        className={cn(
          "relative flex items-center justify-center border transition-colors cursor-pointer select-none overflow-hidden",
          sizeClasses[size],
          checked
            ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30"
            : "bg-white/5 border-white/15 hover:border-primary/50 hover:bg-primary/10 text-transparent hover:text-platinum/30",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          className
        )}
        title={checked ? "Completed (Click to unmark)" : "Click to complete habit"}
      >
        <AnimatePresence mode="wait">
          {checked ? (
            <motion.div
              key="checked-icon"
              initial={{ scale: 0, rotate: -40, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 25 }}
              className="flex items-center justify-center"
            >
              <Check className={cn(iconSizes[size], "stroke-[3] text-white drop-shadow-sm")} />
            </motion.div>
          ) : (
            <div className="w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <Check className={cn(iconSizes[size], "stroke-[2] text-platinum/40")} />
            </div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
