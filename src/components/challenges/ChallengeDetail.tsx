import React from 'react';
import { motion } from 'motion/react';
import {
  X,
  Trophy,
  Users,
  Calendar,
  Target,
  Globe,
  Lock,
  Share2,
  Trash2,
  Edit2,
  CheckCircle2,
  ArrowRight,
  Copy
} from 'lucide-react';
import { Challenge, Habit, FocusSessionRecord } from '../../types';
import { evaluateChallengeProgress } from '../../lib/challengeUtils';
import { ToastType } from '../ui/Feedback';

interface ChallengeDetailProps {
  challenge: Challenge;
  habits?: Habit[];
  focusSessions?: FocusSessionRecord[];
  onClose: () => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onEdit: (challenge: Challenge) => void;
  onDelete: (id: string) => void;
  isCreator: boolean;
  showToast?: (message: string, type?: ToastType) => void;
}

export const ChallengeDetail: React.FC<ChallengeDetailProps> = ({
  challenge,
  habits = [],
  focusSessions = [],
  onClose,
  onJoin,
  onLeave,
  onEdit,
  onDelete,
  isCreator,
  showToast
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    const shareData = {
      title: challenge.title,
      text: `Join my challenge on EnerGoals: ${challenge.title}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      setCopied(true);
      showToast?.('Challenge link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(challenge.endAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );
  const progress = evaluateChallengeProgress(challenge, habits, focusSessions);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel w-full max-w-3xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundColor: challenge.color }} />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-all z-20"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl shrink-0"
                style={{ backgroundColor: challenge.color }}
              >
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">{challenge.title}</h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-platinum/60 text-xs font-bold uppercase tracking-widest">
                    <Users className="w-4 h-4" />
                    {challenge.participantCount} Participants
                  </div>
                  <div className="flex items-center gap-2 text-platinum/60 text-xs font-bold uppercase tracking-widest">
                    {challenge.visibility === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {challenge.visibility}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Goal</span>
              </div>
              <div className="text-xl font-bold text-white capitalize">
                {progress.current} / {progress.target} {challenge.goalType}
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Time Left</span>
              </div>
              <div className="text-xl font-bold text-white">{daysRemaining} Days</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Progress</span>
              </div>
              <div className="text-xl font-bold text-white">
                {challenge.isJoined ? `${progress.percent}%` : 'Join to track'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-platinum/40 uppercase tracking-widest">About this Challenge</h3>
            <p className="text-platinum/70 leading-relaxed">
              {challenge.description || 'No description provided for this challenge.'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Challenge Timeline</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-bold text-platinum/40 uppercase mb-1">Starts</div>
                <div className="text-sm font-bold text-white">{new Date(challenge.startAt).toLocaleDateString()}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-platinum/20" />
              <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-bold text-platinum/40 uppercase mb-1">Ends</div>
                <div className="text-sm font-bold text-white">{new Date(challenge.endAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {challenge.joinCode && (
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-primary mb-1">Invite Code</h4>
                <p className="text-xs text-platinum/40">Share this code with friends to join</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(challenge.joinCode!).catch(() => {});
                  setCopied(true);
                  showToast?.('Invite code copied!', 'success');
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary font-mono font-bold text-xl transition-all"
              >
                {challenge.joinCode}
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-border bg-white/5 flex flex-wrap gap-4">
          {challenge.isJoined ? (
            <button
              type="button"
              onClick={() => onLeave(challenge.id)}
              className="btn-secondary text-danger hover:bg-danger/10 border-danger/20"
            >
              Leave Challenge
            </button>
          ) : (
            <button type="button" onClick={() => onJoin(challenge.id)} className="btn-primary flex-1">
              Join Challenge (+15 XP)
            </button>
          )}

          <button type="button" onClick={handleShare} className="btn-secondary flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share'}
          </button>

          {isCreator && (
            <>
              <button type="button" onClick={() => onEdit(challenge)} className="btn-secondary flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="btn-secondary text-danger hover:bg-danger/10 border-danger/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>

        {isDeleting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-bg-dark/95 backdrop-blur-md">
            <div className="max-w-sm text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
                <Trash2 className="w-10 h-10 text-danger" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Delete Challenge?</h3>
                <p className="text-platinum/40">This action is irreversible. All participant progress will be lost.</p>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsDeleting(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(challenge.id);
                    onClose();
                  }}
                  className="btn-primary bg-danger hover:bg-danger-dark border-danger flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
