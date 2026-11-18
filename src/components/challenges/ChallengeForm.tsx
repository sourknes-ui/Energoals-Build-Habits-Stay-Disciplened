import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Calendar, Target, Globe, Lock, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Challenge, ChallengeGoalType, ChallengeVisibility } from '../../types';

interface ChallengeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (challenge: Challenge) => void;
  initialData?: Challenge | null;
}

const getDefaultDates = () => ({
  start: new Date().toISOString().split('T')[0],
  end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
});

export const ChallengeForm: React.FC<ChallengeFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Challenge>>(() => {
    const { start, end } = getDefaultDates();
    return (
      initialData || {
        title: '',
        description: '',
        goalType: 'streak',
        goalTarget: 30,
        startAt: start,
        endAt: end,
        visibility: 'public',
        color: '#B14AE0'
      }
    );
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    if (initialData) {
      setFormData({
        ...initialData,
        startAt: initialData.startAt ? new Date(initialData.startAt).toISOString().split('T')[0] : getDefaultDates().start,
        endAt: initialData.endAt ? new Date(initialData.endAt).toISOString().split('T')[0] : getDefaultDates().end
      });
    } else {
      const { start, end } = getDefaultDates();
      setFormData({
        title: '',
        description: '',
        goalType: 'streak',
        goalTarget: 30,
        startAt: start,
        endAt: end,
        visibility: 'public',
        color: '#B14AE0'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setErrorMsg('Please enter a challenge title.');
      return;
    }
    const targetVal = Number(formData.goalTarget || 0);
    if (targetVal < 1) {
      setErrorMsg('Target value must be at least 1.');
      return;
    }
    const startMs = new Date(formData.startAt || '').getTime();
    const endMs = new Date(formData.endAt || '').getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs < startMs) {
      setErrorMsg('End date must be on or after the start date.');
      return;
    }

    const challenge: Challenge = {
      id: initialData?.id || `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdByUserId: initialData?.createdByUserId || 'current-user',
      title: formData.title.trim(),
      description: (formData.description || '').trim(),
      goalType: (formData.goalType as ChallengeGoalType) || 'streak',
      goalTarget: targetVal,
      startAt: new Date(formData.startAt || '').toISOString(),
      endAt: new Date(formData.endAt || '').toISOString(),
      visibility: (formData.visibility as ChallengeVisibility) || 'public',
      participantCount: initialData?.participantCount || 1,
      color: formData.color || '#B14AE0',
      isJoined: initialData ? initialData.isJoined : true,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      joinCode:
        formData.visibility === 'inviteOnly'
          ? initialData?.joinCode || Math.random().toString(36).substr(2, 6).toUpperCase()
          : undefined
    };

    onSave(challenge);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-border flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{initialData ? 'Edit Challenge' : 'Create Challenge'}</h2>
              <p className="text-xs text-platinum/40 uppercase tracking-widest font-bold">Set the bar for excellence</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-platinum/40" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-bold text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Challenge Title</label>
              <input
                type="text"
                required
                placeholder="e.g., 75 Hard, Morning Mastery..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Description</label>
              <textarea
                placeholder="What is this challenge about? What are the rules?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-4 text-white focus:outline-none focus:border-primary/50 transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Goal Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['streak', 'count', 'minutes', 'custom'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, goalType: type })}
                      className={cn(
                        'py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all',
                        formData.goalType === type
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-white/5 border-border text-platinum/40 hover:text-platinum'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Target Value</label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
                  <input
                    type="number"
                    min={1}
                    placeholder="30"
                    value={formData.goalTarget || ''}
                    onChange={(e) => setFormData({ ...formData, goalTarget: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white/5 border border-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
                  <input
                    type="date"
                    required
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    className="w-full bg-white/5 border border-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
                  <input
                    type="date"
                    required
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                    className="w-full bg-white/5 border border-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Visibility</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'public', label: 'Public', icon: Globe },
                  { id: 'private', label: 'Private', icon: Lock },
                  { id: 'inviteOnly', label: 'Invite Only', icon: UserPlus }
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: v.id as ChallengeVisibility })}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                      formData.visibility === v.id
                        ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10'
                        : 'bg-white/5 border-border text-platinum/40 hover:bg-white/10'
                    )}
                  >
                    <v.icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Accent Color</label>
              <div className="flex gap-3">
                {['#B14AE0', '#3B82F6', '#5FD4A7', '#F5B971', '#FF6B7A', '#D9B6FF'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all border-2',
                      formData.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex gap-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {initialData ? 'Save Changes' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
