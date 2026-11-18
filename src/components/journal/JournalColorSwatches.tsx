import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { JOURNAL_COLORS, JournalColor, getJournalColor } from '../../lib/journalColorData';

interface JournalColorSwatchesProps {
  selectedColorId?: string;
  onSelectColor: (colorId: string) => void;
  showDefaultOption?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const JournalColorSwatches: React.FC<JournalColorSwatchesProps> = ({
  selectedColorId = '',
  onSelectColor,
  showDefaultOption = true,
  size = 'md',
  showLabels = false,
}) => {
  const currentActive = getJournalColor(selectedColorId);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {showDefaultOption && (
          <button
            type="button"
            onClick={() => onSelectColor('')}
            title="Default (Monochrome Glass)"
            className={cn(
              sizeClasses[size],
              "rounded-full relative flex items-center justify-center transition-all duration-200 border",
              "bg-white/10 hover:bg-white/20 hover:scale-110",
              !selectedColorId
                ? "border-white ring-2 ring-white/40 ring-offset-2 ring-offset-[#0d1117] scale-105"
                : "border-white/20"
            )}
          >
            {!selectedColorId ? (
              <Check className={cn(iconSizes[size], "text-white drop-shadow")} />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            )}
          </button>
        )}

        {JOURNAL_COLORS.map((color) => {
          const isSelected = selectedColorId?.toLowerCase() === color.id.toLowerCase();
          return (
            <motion.button
              key={color.id}
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectColor(color.id)}
              title={color.name}
              className={cn(
                sizeClasses[size],
                "rounded-full relative flex items-center justify-center transition-all duration-200 shadow-sm",
                isSelected
                  ? "ring-2 ring-offset-2 ring-offset-[#0d1117] scale-110 shadow-lg"
                  : "hover:shadow-md opacity-90 hover:opacity-100"
              )}
              style={{
                backgroundColor: color.swatchHex,
                boxShadow: isSelected
                  ? `0 0 16px ${color.swatchHex}80`
                  : undefined,
              }}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check
                    className={cn(
                      iconSizes[size],
                      // For light colors like Cream, soft-yellow, sage, pastel-pink, peach, use dark check for maximum contrast
                      ['cream', 'soft-yellow', 'pastel-pink', 'peach', 'sage-green', 'sky-blue', 'lavender', 'classic-grey'].includes(color.id)
                        ? "text-slate-900 drop-shadow-sm stroke-[3]"
                        : "text-white drop-shadow stroke-[3]"
                    )}
                  />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {showLabels && (
        <div className="flex items-center gap-2 text-xs text-platinum/60">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>
            Selected:{' '}
            <strong className="text-white font-medium">
              {currentActive ? currentActive.name : 'Default Glass'}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};
