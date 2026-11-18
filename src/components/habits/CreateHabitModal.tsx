import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  X, 
  Target, 
  Calendar, 
  Bell, 
  ChevronRight,
  Activity,
  Brain,
  Zap,
  Moon,
  Coffee,
  Book,
  Smile,
  Type,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Search,
  Check,
  Trash2,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { HabitCategory, HabitType, HabitFrequency, HabitDifficulty } from '../../types';
import { suggestEmoji, CATEGORY_EMOJI_MAP } from '../../lib/habitUtils';
import { DIFFICULTY_XP_MAP, DIFFICULTY_COLORS } from '../../lib/progressionEngine';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: any) => void;
  onDelete?: (id: string) => void;
  editingHabit?: any;
}

const categories: { id: HabitCategory; icon: any; color: string }[] = [
  { id: 'Fitness', icon: Activity, color: '#5FD4A7' },
  { id: 'Productivity', icon: Zap, color: '#B14AE0' },
  { id: 'Mindfulness', icon: Brain, color: '#D9B6FF' },
  { id: 'Learning', icon: Book, color: '#F5B971' },
  { id: 'Health', icon: Coffee, color: '#3B82F6' },
  { id: 'Finance', icon: Target, color: '#C8C6D1' },
  { id: 'Custom', icon: Sparkles, color: '#B14AE0' },
];

const difficulties: { id: HabitDifficulty; label: string; xp: number; desc: string }[] = [
  { id: 'Easy', label: 'Easy', xp: 10, desc: 'Quick & accessible daily win' },
  { id: 'Medium', label: 'Medium', xp: 20, desc: 'Balanced focus & commitment' },
  { id: 'Hard', label: 'Hard', xp: 35, desc: 'Demanding, high-discipline effort' },
  { id: 'Very Hard', label: 'Very Hard', xp: 50, desc: 'Peak milestone achievement' },
];

const frequencies: { id: HabitFrequency; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'custom', label: 'Custom' },
];

const targetTypes: { id: HabitType; label: string; icon: any }[] = [
  { id: 'binary', label: 'Yes/No', icon: CheckCircle2 },
  { id: 'quantitative', label: 'Count', icon: Target },
  { id: 'timing', label: 'Time', icon: Clock },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  onDelete,
  editingHabit 
}) => {
  const [step, setStep] = useState(1);
  const [habitData, setHabitData] = useState({
    name: '',
    emoji: '',
    category: 'Productivity' as HabitCategory,
    type: 'binary' as HabitType,
    difficulty: 'Medium' as HabitDifficulty,
    frequency: 'daily' as HabitFrequency,
    schedule: [] as string[],
    timeOfDay: 'Anytime',
    reminder: true,
    reminderTime: '08:00',
    targetValue: 1,
    unit: '',
    color: '#B14AE0',
    note: ''
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');

  useEffect(() => {
    if (editingHabit) {
      setHabitData({
        ...habitData,
        ...editingHabit,
        difficulty: editingHabit.difficulty || 'Medium',
        emoji: editingHabit.emoji || suggestEmoji(editingHabit.name) || '✨'
      });
    } else {
      setHabitData({
        name: '',
        emoji: '✨',
        category: 'Productivity',
        type: 'binary',
        difficulty: 'Medium',
        frequency: 'daily',
        schedule: [],
        timeOfDay: 'Anytime',
        reminder: true,
        reminderTime: '08:00',
        targetValue: 1,
        unit: '',
        color: '#B14AE0',
        note: ''
      });
    }
    setStep(1);
  }, [editingHabit, isOpen]);

  // Auto-suggest emoji
  useEffect(() => {
    if (!editingHabit && habitData.name.length > 2) {
      const suggested = suggestEmoji(habitData.name);
      if (suggested) {
        setHabitData(prev => ({ ...prev, emoji: suggested }));
      }
    }
  }, [habitData.name]);

  const handleSave = () => {
    if (!habitData.name.trim()) return;
    
    const selectedCategory = categories.find(c => c.id === habitData.category);
    const targetVal = habitData.type === 'binary' ? 1 : Math.max(1, habitData.targetValue || (habitData.type === 'timing' ? 15 : 10));
    const unitVal = habitData.type === 'binary' ? '' : (habitData.unit || (habitData.type === 'timing' ? 'min' : 'times'));

    onSave({
      ...habitData,
      targetValue: targetVal,
      unit: unitVal,
      color: selectedCategory?.color || habitData.color,
      icon: 'Activity'
    });
  };

  const currentCategoryEmojis = useMemo(() => {
    return CATEGORY_EMOJI_MAP[habitData.category] || [];
  }, [habitData.category]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-bg-dark/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_100px_-20px_rgba(177,74,224,0.3)] flex flex-col max-h-[85vh] my-auto z-10"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-xl sm:text-2xl shrink-0">
              {habitData.emoji || '✨'}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-white">
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              <p className="text-[10px] sm:text-xs text-platinum/40 font-bold uppercase tracking-widest">Step {step} of 2: {step === 1 ? 'Fundamentals' : 'Schedule & Targets'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-platinum/40 hover:text-white cursor-pointer touch-manipulation">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Habit Name & Emoji */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40 ml-1">Habit Name</label>
                    <div className="relative">
                      <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/20" />
                      <input 
                        type="text" 
                        placeholder="e.g. Morning Meditation"
                        className="w-full bg-surface border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-lg font-bold text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-platinum/10"
                        value={habitData.name}
                        onChange={(e) => setHabitData({ ...habitData, name: e.target.value })}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40 ml-1">Emoji</label>
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-full h-[60px] bg-surface border border-white/5 rounded-2xl flex items-center justify-center text-3xl hover:bg-white/5 transition-all"
                    >
                      {habitData.emoji}
                    </button>
                  </div>
                </div>

                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-surface border border-white/10 rounded-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Quick Select</span>
                      <div className="flex gap-1">
                        {currentCategoryEmojis.map(e => (
                          <button 
                            key={e}
                            onClick={() => {
                              setHabitData({ ...habitData, emoji: e });
                              setShowEmojiPicker(false);
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-xl"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-8 gap-2">
                      {['💧', '🏋️', '🏃', '😴', '📚', '🤸', '🧘', '🥗', '🚶', '✍️', '💊', '🚫', '💪', '🌅', '🍎', '✨'].map(e => (
                        <button 
                          key={e}
                          onClick={() => {
                            setHabitData({ ...habitData, emoji: e });
                            setShowEmojiPicker(false);
                          }}
                          className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-2xl"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Category */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40 ml-1">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setHabitData({ ...habitData, category: cat.id })}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border transition-all group",
                          habitData.category === cat.id 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-surface border-white/5 text-platinum/40 hover:border-white/20 hover:text-platinum"
                        )}
                      >
                        <cat.icon className={cn("w-5 h-5", habitData.category === cat.id ? "text-primary" : "text-platinum/20 group-hover:text-platinum/40")} />
                        <span className="font-bold text-sm">{cat.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Type */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40 ml-1">Completion Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {targetTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          const newType = type.id;
                          let defaultTarget = habitData.targetValue;
                          let defaultUnit = habitData.unit;
                          if (newType === 'quantitative') {
                            defaultTarget = habitData.targetValue > 1 ? habitData.targetValue : 8;
                            defaultUnit = habitData.unit || 'glasses';
                          } else if (newType === 'timing') {
                            defaultTarget = habitData.targetValue > 1 ? habitData.targetValue : 15;
                            defaultUnit = habitData.unit || 'min';
                          } else {
                            defaultTarget = 1;
                            defaultUnit = '';
                          }
                          setHabitData({ 
                            ...habitData, 
                            type: newType,
                            targetValue: defaultTarget,
                            unit: defaultUnit
                          });
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                          habitData.type === type.id 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-surface border-white/5 text-platinum/40 hover:border-white/20"
                        )}
                      >
                        <type.icon className="w-5 h-5" />
                        <span className="font-bold text-xs">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty & XP Reward Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40">Difficulty & XP Reward</label>
                    <span className="text-[11px] font-bold text-primary">
                      +{DIFFICULTY_XP_MAP[habitData.difficulty]} XP per completion
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {difficulties.map((diff) => (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => setHabitData({ ...habitData, difficulty: diff.id })}
                        className={cn(
                          "p-3 rounded-2xl border flex flex-col items-center text-center gap-1 transition-all cursor-pointer",
                          habitData.difficulty === diff.id
                            ? "bg-primary/15 border-primary text-white shadow-lg shadow-primary/10"
                            : "bg-surface border-white/5 text-platinum/40 hover:border-white/20 hover:text-platinum"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs">{diff.label}</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                          habitData.difficulty === diff.id
                            ? "bg-primary text-white"
                            : "bg-white/5 text-platinum/50"
                        )}>
                          +{diff.xp} XP
                        </span>
                        <span className="text-[9px] text-platinum/40 leading-tight line-clamp-1 mt-0.5">
                          {diff.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {habitData.type !== 'binary' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-2 gap-4 pt-2"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40 ml-1">
                        {habitData.type === 'timing' ? 'Target Time (Minutes)' : 'Target Count'}
                      </label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full bg-surface border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                        value={habitData.targetValue}
                        onChange={(e) => setHabitData({ ...habitData, targetValue: Math.max(1, parseInt(e.target.value) || 1) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40 ml-1">Unit</label>
                      <input 
                        type="text" 
                        placeholder={habitData.type === 'timing' ? 'e.g. min, hrs' : 'e.g. glasses, push-ups, pages'}
                        className="w-full bg-surface border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                        value={habitData.unit}
                        onChange={(e) => setHabitData({ ...habitData, unit: e.target.value })}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Frequency */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40 ml-1">Frequency</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {frequencies.map((freq) => (
                      <button
                        key={freq.id}
                        onClick={() => setHabitData({ ...habitData, frequency: freq.id })}
                        className={cn(
                          "py-3 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
                          habitData.frequency === freq.id 
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                            : "bg-surface border-white/5 text-platinum/40 hover:border-white/20"
                        )}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>

                {habitData.frequency === 'custom' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between gap-2"
                  >
                    {weekDays.map(day => (
                      <button
                        key={day}
                        onClick={() => {
                          const newSchedule = habitData.schedule.includes(day)
                            ? habitData.schedule.filter(d => d !== day)
                            : [...habitData.schedule, day];
                          setHabitData({ ...habitData, schedule: newSchedule });
                        }}
                        className={cn(
                          "w-10 h-10 rounded-xl border font-bold text-xs transition-all",
                          habitData.schedule.includes(day)
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-surface border-white/5 text-platinum/40 hover:border-white/20"
                        )}
                      >
                        {day[0]}
                      </button>
                    ))}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Time of Day */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40 ml-1">Time of Day</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Anytime', 'Morning', 'Afternoon', 'Evening'].map(time => (
                        <button
                          key={time}
                          onClick={() => setHabitData({ ...habitData, timeOfDay: time })}
                          className={cn(
                            "py-3 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
                            habitData.timeOfDay === time 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-surface border-white/5 text-platinum/40 hover:border-white/20"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reminder */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40">Reminder</label>
                      <button 
                        onClick={() => setHabitData({ ...habitData, reminder: !habitData.reminder })}
                        className={cn(
                          "w-10 h-5 rounded-full transition-all relative",
                          habitData.reminder ? "bg-primary" : "bg-white/10"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                          habitData.reminder ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                    <div className={cn(
                      "flex items-center gap-4 bg-surface border border-white/5 rounded-2xl p-4 transition-all",
                      !habitData.reminder && "opacity-40 pointer-events-none"
                    )}>
                      <Bell className="w-5 h-5 text-primary" />
                      <input 
                        type="time" 
                        className="bg-transparent text-white font-bold focus:outline-none flex-1"
                        value={habitData.reminderTime}
                        onChange={(e) => setHabitData({ ...habitData, reminderTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-platinum/40 ml-1">Optional Note</label>
                  <textarea 
                    placeholder="Add a motivating note or specific instructions..."
                    className="w-full bg-surface border border-white/5 rounded-2xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all min-h-[100px] resize-none"
                    value={habitData.note}
                    onChange={(e) => setHabitData({ ...habitData, note: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/5 flex flex-wrap items-center justify-between bg-white/5 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => step === 1 ? onClose() : setStep(1)}
              className="flex items-center gap-2 text-platinum/40 hover:text-platinum transition-colors font-bold text-xs uppercase tracking-widest"
            >
              {step === 1 ? <X className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {editingHabit && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(editingHabit.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-error hover:bg-error/10 active:scale-95 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Habit
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => step === 1 ? setStep(2) : handleSave()}
              disabled={!habitData.name.trim()}
              className={cn(
                "btn-primary py-3 px-8 min-w-[160px]",
                !habitData.name.trim() && "opacity-50 cursor-not-allowed"
              )}
            >
              {step === 1 ? 'Next Step' : (editingHabit ? 'Save Changes' : 'Create Habit')}
              {step === 1 ? <ChevronRight className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
