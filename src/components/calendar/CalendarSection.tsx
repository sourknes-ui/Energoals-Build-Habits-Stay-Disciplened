import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  Calendar as CalendarIcon,
  LayoutGrid,
  LayoutList,
  X,
  Clock,
  Flag,
  Star,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Circle,
  Repeat,
  Zap
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  isToday,
  parseISO,
  isAfter,
  differenceInDays
} from 'date-fns';
import { cn } from '../../lib/utils';
import {
  CalendarEntry,
  CalendarReminder,
  CalendarDeadline,
  CalendarHighlight,
  EntryType
} from '../../types/calendar';
import {
  Habit,
  Routine,
  Goal,
  FocusSessionRecord,
  AppSettings
} from '../../types';
import { getTodayKey, isHabitDueOnDate, isHabitValueCompleted } from '../../lib/habitUtils';

const formatTimeLabel = (time?: string, timeFormat: '12h' | '24h' = '12h') => {
  if (!time) return '';
  if (timeFormat === '24h') return time;
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr || '00'} ${suffix}`;
};

const NotificationBar = ({
  entries,
  onViewEntry
}: {
  entries: CalendarEntry[];
  onViewEntry: (entry: CalendarEntry) => void;
}) => {
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return entries
      .filter((e) => {
        const parsed = parseISO(e.date);
        return isAfter(parsed, today) || isSameDay(parsed, today);
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 1);
  }, [entries]);

  if (upcoming.length === 0) return null;

  const entry = upcoming[0];
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const daysLeft = differenceInDays(parseISO(entry.date), todayMidnight);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4 mb-8"
    >
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
        <Bell className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-1">Upcoming Alert</div>
        <div className="text-sm font-bold text-white truncate">
          {entry.title} {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} days`}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onViewEntry(entry)}
        className="text-xs font-bold text-primary hover:underline cursor-pointer shrink-0"
      >
        View
      </button>
    </motion.div>
  );
};

const CalendarHeader = ({
  currentDate,
  view,
  onPrev,
  onNext,
  onViewToggle,
  onToday
}: {
  currentDate: Date;
  view: 'month' | 'week';
  onPrev: () => void;
  onNext: () => void;
  onViewToggle: (view: 'month' | 'week') => void;
  onToday: () => void;
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
    <div>
      <h1 className="text-4xl font-display font-bold text-white mb-2">Calendar</h1>
      <p className="text-platinum/60 font-medium">Manage your fitness journey schedule.</p>
    </div>

    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center bg-surface border border-white/5 rounded-xl p-1">
        <button
          type="button"
          onClick={() => onViewToggle('month')}
          className={cn(
            'p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold',
            view === 'month' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-platinum/40 hover:text-white'
          )}
        >
          <LayoutGrid className="w-4 h-4" /> Month
        </button>
        <button
          type="button"
          onClick={() => onViewToggle('week')}
          className={cn(
            'p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold',
            view === 'week' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-platinum/40 hover:text-white'
          )}
        >
          <LayoutList className="w-4 h-4" /> Week
        </button>
      </div>

      <div className="flex items-center gap-2 bg-surface border border-white/5 rounded-xl p-1">
        <button type="button" onClick={onPrev} className="p-2 text-platinum/40 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="px-4 py-2 text-sm font-bold text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          {format(currentDate, 'MMMM yyyy')}
        </button>
        <button type="button" onClick={onNext} className="p-2 text-platinum/40 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
);

const MonthView = ({
  currentDate,
  selectedDate,
  entries,
  habits,
  weekStartsOn,
  onDateSelect
}: {
  currentDate: Date;
  selectedDate: Date;
  entries: CalendarEntry[];
  habits: Habit[];
  weekStartsOn: 0 | 1;
  onDateSelect: (date: Date) => void;
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn });
  const endDate = endOfWeek(monthEnd, { weekStartsOn });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays =
    weekStartsOn === 1
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayKey = getTodayKey();

  return (
    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/5">
        {weekDays.map((day) => (
          <div key={day} className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-platinum/40">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dayKey = getTodayKey(day);
          const dayEntries = entries.filter((e) => isSameDay(parseISO(e.date), day));
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDay = isToday(day);
          const highlight = dayEntries.find((e) => e.type === 'highlight') as CalendarHighlight | undefined;

          // Habit completion summary dot for past/today dates
          const dueHabits = habits.filter((h) => !h.isArchived && isHabitDueOnDate(h, day));
          const completedOnDay =
            dayKey === todayKey
              ? dueHabits.filter((h) => h.completedToday).length
              : dueHabits.filter((h) => isHabitValueCompleted(h, h.history?.[dayKey])).length;
          const isFutureDay = day > new Date() && !isTodayDay;

          return (
            <button
              type="button"
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                'h-16 sm:h-24 md:h-32 p-1 sm:p-2 border-r border-b border-white/5 relative transition-all group hover:bg-white/[0.02] touch-manipulation cursor-pointer text-left flex flex-col',
                !isCurrentMonth && 'opacity-20',
                isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary/50 z-10'
              )}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2 w-full">
                <span
                  className={cn(
                    'text-xs sm:text-sm font-bold w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-all',
                    isTodayDay ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/60',
                    isSelected && !isTodayDay && 'text-primary'
                  )}
                >
                  {format(day, 'd')}
                </span>

                <div className="flex items-center gap-1">
                  {!isFutureDay && dueHabits.length > 0 && completedOnDay > 0 && (
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        completedOnDay >= dueHabits.length ? 'bg-emerald-400' : 'bg-primary/60'
                      )}
                      title={`${completedOnDay}/${dueHabits.length} habits completed`}
                    />
                  )}
                  {highlight && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: highlight.color }} />
                  )}
                </div>
              </div>

              <div className="space-y-1 overflow-hidden w-full">
                {dayEntries.slice(0, 2).map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded truncate flex items-center gap-1',
                      entry.type === 'reminder'
                        ? 'bg-white/5 text-platinum/60'
                        : entry.type === 'deadline'
                        ? 'bg-error/10 text-error'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {entry.type === 'deadline' && <Flag className="w-2 h-2 shrink-0" />}
                    {entry.type === 'reminder' && <Bell className="w-2 h-2 shrink-0" />}
                    <span className="truncate">{entry.title}</span>
                  </div>
                ))}
                {dayEntries.length > 2 && (
                  <div className="text-[10px] font-bold text-platinum/30 pl-1">
                    +{dayEntries.length - 2} more
                  </div>
                )}
              </div>

              {highlight && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 opacity-50"
                  style={{ backgroundColor: highlight.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const WeekView = ({
  currentDate,
  selectedDate,
  entries,
  weekStartsOn,
  timeFormat,
  onDateSelect
}: {
  currentDate: Date;
  selectedDate: Date;
  entries: CalendarEntry[];
  weekStartsOn: 0 | 1;
  timeFormat: '12h' | '24h';
  onDateSelect: (date: Date) => void;
}) => {
  const startDate = startOfWeek(currentDate, { weekStartsOn });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="space-y-4">
      {weekDays.map((day) => {
        const dayEntries = entries.filter((e) => isSameDay(parseISO(e.date), day));
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDay = isToday(day);

        return (
          <motion.button
            type="button"
            key={day.toString()}
            onClick={() => onDateSelect(day)}
            whileHover={{ x: 5 }}
            className={cn(
              'w-full glass-panel p-6 rounded-2xl border transition-all flex items-center gap-8 text-left',
              isSelected ? 'border-primary/50 bg-primary/5' : 'border-white/5 hover:border-white/10'
            )}
          >
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-platinum/40 mb-1">
                {format(day, 'EEE')}
              </span>
              <span
                className={cn(
                  'text-2xl font-display font-bold w-12 h-12 flex items-center justify-center rounded-xl transition-all',
                  isTodayDay ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white',
                  isSelected && !isTodayDay && 'text-primary'
                )}
              >
                {format(day, 'd')}
              </span>
            </div>

            <div className="flex-1 flex flex-wrap gap-3">
              {dayEntries.length > 0 ? (
                dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold',
                      entry.type === 'reminder'
                        ? 'bg-white/5 border-white/5 text-platinum/60'
                        : entry.type === 'deadline'
                        ? 'bg-error/10 border-error/20 text-error'
                        : 'bg-primary/10 border-primary/20 text-primary'
                    )}
                  >
                    {entry.type === 'reminder' && <Bell className="w-3 h-3" />}
                    {entry.type === 'deadline' && <Flag className="w-3 h-3" />}
                    {entry.type === 'highlight' && <Star className="w-3 h-3" />}
                    {entry.title}
                    {entry.type === 'reminder' && (entry as CalendarReminder).time && (
                      <span className="opacity-50">{formatTimeLabel((entry as CalendarReminder).time, timeFormat)}</span>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-sm text-platinum/20 italic">No events scheduled</span>
              )}
            </div>

            <ChevronRight className="w-5 h-5 text-platinum/20" />
          </motion.button>
        );
      })}
    </div>
  );
};

const DayDetailView = ({
  date,
  entries,
  habits,
  routines,
  focusSessions,
  timeFormat,
  showCompleted,
  onToggleHabit,
  onClose,
  onAddEntry,
  onEditEntry,
  onDeleteEntry
}: {
  date: Date;
  entries: (CalendarEntry & { isGoalSynced?: boolean })[];
  habits: Habit[];
  routines: Routine[];
  focusSessions: FocusSessionRecord[];
  timeFormat: '12h' | '24h';
  showCompleted: boolean;
  onToggleHabit?: (id: string) => void;
  onClose: () => void;
  onAddEntry: () => void;
  onEditEntry: (entry: CalendarEntry) => void;
  onDeleteEntry: (id: string) => void;
}) => {
  const dayKey = getTodayKey(date);
  const isTodayDate = isToday(date);
  const dayEntries = entries.filter((e) => isSameDay(parseISO(e.date), date));
  const highlight = dayEntries.find((e) => e.type === 'highlight') as CalendarHighlight | undefined;

  const dueHabits = habits.filter((h) => !h.isArchived && isHabitDueOnDate(h, date));
  const visibleHabits = showCompleted
    ? dueHabits
    : dueHabits.filter((h) =>
        isTodayDate ? !h.completedToday : !isHabitValueCompleted(h, h.history?.[dayKey])
      );

  const daySessions = focusSessions.filter(
    (s) => s.mode === 'focus' && getTodayKey(new Date(s.completedAt)) === dayKey
  );

  const getCountdown = (deadlineDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = parseISO(deadlineDate);
    const diff = differenceInDays(deadline, today);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return 'Passed';
    return `${diff} days left`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {format(date, 'EEEE')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
            {format(date, 'MMMM d, yyyy')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-full text-platinum/40 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {highlight && (
        <div
          className="mb-6 p-4 rounded-xl border flex items-center gap-4 relative group"
          style={{ backgroundColor: `${highlight.color}10`, borderColor: `${highlight.color}20` }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${highlight.color}20`, color: highlight.color }}
          >
            <Star className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: highlight.color }}>
              {highlight.label}
            </div>
            <div className="text-lg font-bold text-white truncate">{highlight.title}</div>
          </div>
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEditEntry(highlight)}
              className="p-2 hover:bg-white/10 rounded-lg text-platinum/40 hover:text-primary transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteEntry(highlight.id)}
              className="p-2 hover:bg-white/10 rounded-lg text-platinum/40 hover:text-error transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {/* Scheduled Habits */}
        {visibleHabits.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-platinum/40">
              Scheduled Habits ({dueHabits.filter((h) => (isTodayDate ? h.completedToday : isHabitValueCompleted(h, h.history?.[dayKey]))).length}/{dueHabits.length})
            </h3>
            <div className="space-y-2">
              {visibleHabits.map((h) => {
                const done = isTodayDate ? h.completedToday : isHabitValueCompleted(h, h.history?.[dayKey]);
                return (
                  <button
                    type="button"
                    key={h.id}
                    disabled={!isTodayDate || !onToggleHabit}
                    onClick={() => isTodayDate && onToggleHabit?.(h.id)}
                    className={cn(
                      'w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all',
                      done
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-white/5 border-white/5 text-white',
                      isTodayDate && onToggleHabit && 'cursor-pointer hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span>{h.emoji || '✨'}</span>
                      <span className={cn('text-sm font-bold truncate', done && 'line-through opacity-75')}>
                        {h.name}
                      </span>
                    </div>
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-platinum/30 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Focus Sessions Logged */}
        {daySessions.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-platinum/40">Focus Sessions</h3>
            {daySessions.map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span>{s.habitName}</span>
                </div>
                <span className="text-primary font-bold">
                  {Math.round((s.actualSecondsCompleted || s.durationMinutes * 60) / 60)}m (+{s.xpEarned} XP)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reminders & Deadlines */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-platinum/40">Reminders & Deadlines</h3>
          {dayEntries.filter((e) => e.type !== 'highlight').length > 0 ? (
            dayEntries
              .filter((e) => e.type !== 'highlight')
              .map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        entry.type === 'reminder' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                      )}
                    >
                      {entry.type === 'reminder' ? <Bell className="w-5 h-5" /> : <Flag className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{entry.title}</div>
                      <div className="text-xs text-platinum/40 flex items-center gap-2 flex-wrap">
                        {entry.type === 'reminder' && (entry as CalendarReminder).time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{' '}
                            {formatTimeLabel((entry as CalendarReminder).time, timeFormat)}
                          </span>
                        )}
                        {entry.type === 'deadline' && (
                          <div className="flex items-center gap-3">
                            <span className="text-error font-bold uppercase tracking-tighter">
                              Priority: {(entry as CalendarDeadline).priority}
                            </span>
                            <span className="text-warning font-bold uppercase tracking-tighter flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {getCountdown(entry.date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!entry.isGoalSynced && (
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditEntry(entry)}
                        className="p-2 hover:bg-white/10 rounded-lg text-platinum/40 hover:text-primary transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-2 hover:bg-white/10 rounded-lg text-platinum/40 hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                <CalendarIcon className="w-6 h-6 text-platinum/15" />
              </div>
              <p className="text-platinum/30 text-sm italic">No custom reminders on this day.</p>
            </div>
          )}
        </div>

        {/* Daily Routines quick note */}
        {routines.length > 0 && isTodayDate && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-platinum/40">Daily Routines</h3>
            {routines.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Repeat className="w-3.5 h-3.5 text-primary" /> {r.name}
                </span>
                <span className="text-platinum/40">{r.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={onAddEntry} className="btn-primary w-full mt-6">
        <Plus className="w-5 h-5" /> Add New Item
      </button>
    </motion.div>
  );
};

const AddEntryModal = ({
  isOpen,
  onClose,
  onSave,
  date,
  editingEntry
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: CalendarEntry) => void;
  date: Date;
  editingEntry?: CalendarEntry | null;
}) => {
  const [type, setType] = useState<EntryType>(editingEntry?.type || 'reminder');
  const [title, setTitle] = useState(editingEntry?.title || '');
  const [time, setTime] = useState(editingEntry?.type === 'reminder' ? (editingEntry as CalendarReminder).time || '08:00' : '08:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(editingEntry?.type === 'deadline' ? (editingEntry as CalendarDeadline).priority : 'medium');
  const [label, setLabel] = useState(editingEntry?.type === 'highlight' ? (editingEntry as CalendarHighlight).label : 'Important');
  const [color, setColor] = useState(editingEntry?.type === 'deadline' || editingEntry?.type === 'highlight' ? (editingEntry as any).color : '#B14AE0');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>(editingEntry?.type === 'reminder' ? (editingEntry as CalendarReminder).repeat || 'none' : 'none');

  React.useEffect(() => {
    if (editingEntry) {
      setType(editingEntry.type);
      setTitle(editingEntry.title);
      if (editingEntry.type === 'reminder') {
        setTime((editingEntry as CalendarReminder).time || '08:00');
        setRepeat((editingEntry as CalendarReminder).repeat || 'none');
      } else if (editingEntry.type === 'deadline') {
        setPriority((editingEntry as CalendarDeadline).priority || 'medium');
        setColor((editingEntry as CalendarDeadline).color || '#B14AE0');
      } else if (editingEntry.type === 'highlight') {
        setLabel((editingEntry as CalendarHighlight).label || 'Important');
        setColor((editingEntry as CalendarHighlight).color || '#5FD4A7');
      }
    } else {
      setType('reminder');
      setTitle('');
      setTime('08:00');
      setPriority('medium');
      setLabel('Important');
      setColor('#B14AE0');
      setRepeat('none');
    }
  }, [editingEntry, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    const id = editingEntry?.id || `cal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    let newEntry: CalendarEntry;

    if (type === 'reminder') {
      newEntry = {
        id,
        type: 'reminder',
        title: title.trim(),
        date: format(date, 'yyyy-MM-dd'),
        time,
        category: 'Fitness',
        repeat
      };
    } else if (type === 'deadline') {
      newEntry = {
        id,
        type: 'deadline',
        title: title.trim(),
        date: format(date, 'yyyy-MM-dd'),
        color,
        priority
      };
    } else {
      newEntry = {
        id,
        type: 'highlight',
        title: title.trim(),
        date: format(date, 'yyyy-MM-dd'),
        color,
        label
      };
    }

    onSave(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold text-white">
              {editingEntry ? 'Edit Entry' : 'Add to Calendar'}
            </h2>
            <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-platinum/40 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex p-1 bg-white/5 rounded-xl mb-8">
            {(['reminder', 'deadline', 'highlight'] as EntryType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                  type === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-platinum/40 hover:text-platinum'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'reminder' ? 'Workout at 7 AM' : type === 'deadline' ? 'Challenge Deadline' : 'Rest Day'}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            {type === 'reminder' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Repeat</label>
                  <select
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="none" className="bg-surface">No Repeat</option>
                    <option value="daily" className="bg-surface">Daily</option>
                    <option value="weekly" className="bg-surface">Weekly</option>
                    <option value="monthly" className="bg-surface">Monthly</option>
                  </select>
                </div>
              </div>
            )}

            {type === 'deadline' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Priority</label>
                <div className="flex gap-3">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-bold capitalize border transition-all',
                        priority === p ? 'bg-error/10 border-error/50 text-error' : 'bg-white/5 border-white/5 text-platinum/40'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {type === 'highlight' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Label</label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                >
                  <option value="Important" className="bg-surface">Important</option>
                  <option value="Rest Day" className="bg-surface">Rest Day</option>
                  <option value="Race Day" className="bg-surface">Race Day</option>
                  <option value="Gym Day" className="bg-surface">Gym Day</option>
                  <option value="Recovery" className="bg-surface">Recovery</option>
                  <option value="Travel" className="bg-surface">Travel</option>
                </select>
              </div>
            )}

            {(type === 'deadline' || type === 'highlight') && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Theme Color</label>
                <div className="flex gap-4">
                  {['#B14AE0', '#5FD4A7', '#F5B971', '#3B82F6', '#EF4444'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-surface',
                        color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex gap-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim()}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              {editingEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface CalendarSectionProps {
  entries: CalendarEntry[];
  setEntries: React.Dispatch<React.SetStateAction<CalendarEntry[]>>;
  habits?: Habit[];
  routines?: Routine[];
  goals?: Goal[];
  focusSessions?: FocusSessionRecord[];
  calendarSettings?: AppSettings['calendar'];
  onToggleHabit?: (id: string) => void;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  entries,
  setEntries,
  habits = [],
  routines = [],
  goals = [],
  focusSessions = [],
  calendarSettings,
  onToggleHabit
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>(
    calendarSettings?.defaultView === 'week' ? 'week' : 'month'
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CalendarEntry | null>(null);

  const weekStartsOn: 0 | 1 = calendarSettings?.weekStartsOn === 1 ? 1 : 0;
  const timeFormat = calendarSettings?.timeFormat || '12h';
  const showCompleted = calendarSettings?.showCompleted ?? true;
  const showReminders = calendarSettings?.showReminders ?? true;
  const showDeadlines = calendarSettings?.showDeadlines ?? true;
  const highlightImportant = calendarSettings?.highlightImportant ?? true;

  // Merge user calendar entries with live goal targetDate deadlines respecting settings toggles
  const mergedEntries = useMemo(() => {
    const goalDeadlines: (CalendarEntry & { isGoalSynced?: boolean })[] = showDeadlines
      ? goals
          .filter((g) => g.targetDate && g.status !== 'archived' && /^\d{4}-\d{2}-\d{2}/.test(g.targetDate))
          .map((g) => ({
            id: `goal_dl_${g.id}`,
            type: 'deadline' as const,
            title: `Goal: ${g.title}`,
            date: g.targetDate.slice(0, 10),
            color: '#B14AE0',
            priority: g.priority || 'medium',
            isGoalSynced: true
          }))
      : [];

    const filteredUserEntries = entries.filter((e) => {
      if (e.type === 'reminder' && !showReminders) return false;
      if (e.type === 'deadline' && !showDeadlines) return false;
      if (e.type === 'highlight' && !highlightImportant) return false;
      return true;
    });

    return [...filteredUserEntries, ...goalDeadlines];
  }, [entries, goals, showReminders, showDeadlines, highlightImportant]);

  const handlePrev = () => {
    setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : addDays(currentDate, -7));
  };

  const handleNext = () => {
    setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 7));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDetailOpen(true);
  };

  const handleViewNotificationEntry = (entry: CalendarEntry) => {
    const d = parseISO(entry.date);
    setCurrentDate(d);
    setSelectedDate(d);
    setIsDetailOpen(true);
  };

  const handleAddEntry = (entry: CalendarEntry) => {
    if (editingEntry) {
      setEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? entry : e)));
    } else {
      setEntries((prev) => [...prev, entry]);
    }
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleEditEntry = (entry: CalendarEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEntry(entry);
    setIsAddModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8 py-2 sm:py-8 space-y-6 pb-20">
      <NotificationBar entries={mergedEntries} onViewEntry={handleViewNotificationEntry} />

      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onPrev={handlePrev}
        onNext={handleNext}
        onViewToggle={setView}
        onToday={handleToday}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className={cn('transition-all duration-500', isDetailOpen ? 'lg:col-span-8' : 'lg:col-span-12')}>
          {view === 'month' ? (
            <MonthView
              currentDate={currentDate}
              selectedDate={selectedDate}
              entries={mergedEntries}
              habits={habits}
              weekStartsOn={weekStartsOn}
              onDateSelect={handleDateSelect}
            />
          ) : (
            <WeekView
              currentDate={currentDate}
              selectedDate={selectedDate}
              entries={mergedEntries}
              weekStartsOn={weekStartsOn}
              timeFormat={timeFormat}
              onDateSelect={handleDateSelect}
            />
          )}
        </div>

        <AnimatePresence>
          {isDetailOpen && (
            <div className="lg:col-span-4 h-full">
              <DayDetailView
                date={selectedDate}
                entries={mergedEntries}
                habits={habits}
                routines={routines}
                focusSessions={focusSessions}
                timeFormat={timeFormat}
                showCompleted={showCompleted}
                onToggleHabit={onToggleHabit}
                onClose={() => setIsDetailOpen(false)}
                onAddEntry={() => {
                  setEditingEntry(null);
                  setIsAddModalOpen(true);
                }}
                onEditEntry={handleEditEntry}
                onDeleteEntry={handleDeleteEntry}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddEntryModal
            isOpen={isAddModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingEntry(null);
            }}
            onSave={handleAddEntry}
            date={selectedDate}
            editingEntry={editingEntry}
          />
        )}
      </AnimatePresence>

      {/* Floating Add Button (Positioned above mobile BottomNav) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          setEditingEntry(null);
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center z-40 cursor-pointer"
        aria-label="Add calendar item"
      >
        <Plus className="w-7 h-7 sm:w-8 sm:h-8" />
      </motion.button>
    </div>
  );
};
