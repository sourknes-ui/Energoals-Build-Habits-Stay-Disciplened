import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Habit } from '../../types';

interface DeleteHabitConfirmModalProps {
  isOpen: boolean;
  habit: Habit | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const DeleteHabitConfirmModal: React.FC<DeleteHabitConfirmModalProps> = ({
  isOpen,
  habit,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
      setErrorMessage(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !habit) return null;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await Promise.resolve(onConfirm());
      onClose();
    } catch (err: any) {
      console.error('Failed to delete habit:', err);
      setErrorMessage(err?.message || 'Failed to delete habit. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={!isDeleting ? onClose : undefined}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-habit-title"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl border border-error/30 bg-[#161622] shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-10 space-y-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close dialog"
          className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 text-platinum/40 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/25 flex items-center justify-center mx-auto text-error shadow-[0_0_25px_rgba(239,68,68,0.15)]">
          <Trash2 className="w-8 h-8" />
        </div>

        {/* Text */}
        <div className="text-center space-y-2.5">
          <h3 id="delete-habit-title" className="text-2xl font-display font-bold text-white tracking-tight">
            Delete Habit?
          </h3>
          <p className="text-sm text-platinum/70 leading-relaxed px-2">
            Are you sure you want to permanently delete{' '}
            <span className="text-white font-bold inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
              <span>{habit.emoji || '✨'}</span>
              <span>{habit.name}</span>
            </span>
            ?
          </p>
          <p className="text-xs text-platinum/40">
            This action cannot be undone. Associated goal and routine links will be safely cleaned up.
          </p>
          {errorMessage && (
            <div className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs font-semibold">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/10 disabled:opacity-40 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-error hover:bg-red-600 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-error/25 border border-error/40 disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Habit</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
