import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, ChevronRight, Plus, Search, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Challenge, Habit, FocusSessionRecord, XPTransaction } from '../../types';
import { ChallengeForm } from './ChallengeForm';
import { ChallengeDetail } from './ChallengeDetail';
import { evaluateChallengeProgress } from '../../lib/challengeUtils';
import { ToastType } from '../ui/Feedback';

interface ChallengesOverviewProps {
  challenges: Challenge[];
  setChallenges: React.Dispatch<React.SetStateAction<Challenge[]>>;
  habits?: Habit[];
  focusSessions?: FocusSessionRecord[];
  addXP: (
    amount: number,
    meta?: {
      key?: string;
      reason?: string;
      source?: XPTransaction['source'];
      entityId?: string;
    }
  ) => boolean;
  showToast?: (message: string, type?: ToastType) => void;
}

export const ChallengesOverview: React.FC<ChallengesOverviewProps> = ({
  challenges,
  setChallenges,
  habits = [],
  focusSessions = [],
  addXP,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'joined' | 'created'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab =
        filterTab === 'all' ||
        (filterTab === 'joined' && c.isJoined) ||
        (filterTab === 'created' && c.createdByUserId === 'current-user');

      return matchesSearch && matchesTab;
    });
  }, [challenges, searchQuery, filterTab]);

  const handleSaveChallenge = (challenge: Challenge) => {
    const exists = challenges.some((c) => c.id === challenge.id);
    setChallenges((prev) => {
      if (exists) {
        return prev.map((c) => (c.id === challenge.id ? challenge : c));
      }
      return [challenge, ...prev];
    });
    if (!exists) {
      const awarded = addXP(15, {
        key: `challenge_create_${challenge.id}`,
        reason: `Created Challenge: ${challenge.title}`,
        source: 'challenge',
        entityId: challenge.id
      });
      showToast?.(
        awarded ? `Challenge created (+15 XP)` : `Challenge "${challenge.title}" created`,
        'success'
      );
    } else {
      showToast?.(`Updated "${challenge.title}"`, 'success');
    }
  };

  const handleDeleteChallenge = (id: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
    showToast?.('Challenge deleted', 'info');
  };

  const handleJoinChallenge = (id: string) => {
    const target = challenges.find((c) => c.id === id);
    if (!target || target.isJoined) return;
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isJoined: true, participantCount: c.participantCount + 1 } : c))
    );
    if (selectedChallenge?.id === id) {
      setSelectedChallenge((prev) =>
        prev ? { ...prev, isJoined: true, participantCount: prev.participantCount + 1 } : null
      );
    }
    const awarded = addXP(15, {
      key: `challenge_join_${id}`,
      reason: `Joined Challenge: ${target.title}`,
      source: 'challenge',
      entityId: id
    });
    showToast?.(
      awarded ? `Joined "${target.title}" (+15 XP)` : `Joined "${target.title}"`,
      'success'
    );
  };

  const handleLeaveChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === id && c.isJoined ? { ...c, isJoined: false, participantCount: Math.max(0, c.participantCount - 1) } : c
      )
    );
    if (selectedChallenge?.id === id) {
      setSelectedChallenge((prev) =>
        prev ? { ...prev, isJoined: false, participantCount: Math.max(0, prev.participantCount - 1) } : null
      );
    }
    showToast?.('Left challenge', 'info');
  };

  return (
    <div className="space-y-8 pb-32 lg:pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Challenges</h1>
          <p className="text-platinum/60 font-medium">Push your limits with community-driven discipline.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingChallenge(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="w-5 h-5" /> Create Challenge
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex p-1 bg-white/5 rounded-xl w-full md:w-auto">
          {(['all', 'joined', 'created'] as const).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={cn(
                'flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                filterTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-platinum/40 hover:text-platinum'
              )}
            >
              {tab === 'created' ? 'My Challenges' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
          <input
            type="text"
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-platinum/40">
              {filteredChallenges.length} results
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredChallenges.length > 0 ? (
            filteredChallenges.map((challenge) => {
              const progress = evaluateChallengeProgress(challenge, habits, focusSessions);

              return (
                <motion.div
                  key={challenge.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedChallenge(challenge)}
                  className="glass-panel p-8 rounded-2xl border border-border hover:border-primary/20 transition-all group relative overflow-hidden cursor-pointer"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${challenge.color}20`, color: challenge.color }}
                      >
                        <Trophy className="w-8 h-8" />
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {progress.isCompleted && (
                          <div className="px-3 py-1 rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </div>
                        )}
                        {challenge.isJoined && !progress.isCompleted && (
                          <div className="px-3 py-1 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-widest border border-primary/20">
                            Joined
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-platinum/40">
                          <Users className="w-3 h-3" /> {challenge.participantCount}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      {challenge.title}
                    </h3>
                    <p className="text-platinum/60 text-sm mb-6 leading-relaxed line-clamp-2">{challenge.description}</p>

                    {challenge.isJoined && (
                      <div className="mb-6 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-platinum/50">
                            Live Progress ({progress.current}/{progress.target})
                          </span>
                          <span className={progress.isCompleted ? 'text-emerald-400' : 'text-primary'}>
                            {progress.percent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress.percent}%`,
                              backgroundColor: progress.isCompleted ? '#10B981' : challenge.color
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-border">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-platinum/40 uppercase tracking-widest">Goal</span>
                          <span className="text-sm font-bold text-white capitalize">
                            {challenge.goalTarget} {challenge.goalType}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-platinum/40 uppercase tracking-widest">Time Left</span>
                          <span className="text-sm font-bold text-white">
                            {Math.max(
                              0,
                              Math.ceil((new Date(challenge.endAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            )}{' '}
                            Days
                          </span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute -bottom-20 -right-20 w-64 h-64 blur-[120px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: challenge.color }}
                  />
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:col-span-2 flex flex-col items-center justify-center py-20 text-center space-y-4 glass-panel rounded-2xl border border-border"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Trophy className="w-8 h-8 text-primary opacity-40" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">No challenges found</h3>
                <p className="text-platinum/40 max-w-xs mx-auto text-sm">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterTab('all');
                }}
                className="text-primary text-sm font-bold hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChallengeForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingChallenge(null);
        }}
        onSave={handleSaveChallenge}
        initialData={editingChallenge}
      />

      {selectedChallenge && (
        <ChallengeDetail
          challenge={selectedChallenge}
          habits={habits}
          focusSessions={focusSessions}
          onClose={() => setSelectedChallenge(null)}
          onJoin={handleJoinChallenge}
          onLeave={handleLeaveChallenge}
          onEdit={(c) => {
            setEditingChallenge(c);
            setSelectedChallenge(null);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteChallenge}
          isCreator={selectedChallenge.createdByUserId === 'current-user' || selectedChallenge.createdByUserId === 'system'}
          showToast={showToast}
        />
      )}
    </div>
  );
};
