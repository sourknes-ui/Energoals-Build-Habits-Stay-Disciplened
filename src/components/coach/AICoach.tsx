import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Zap, 
  Target, 
  Flame, 
  Plus, 
  Check, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Compass,
  Repeat,
  BarChart2,
  RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import {
  Habit,
  Goal,
  Routine,
  JournalEntry,
  UserProfile,
  Challenge,
  HabitCategory,
  FocusSessionRecord
} from '../../types';
import { readScopedJSON, writeScopedJSON } from '../../lib/storageSync';
import { ToastType } from '../ui/Feedback';
import { getTodayKey, isHabitValueCompleted } from '../../lib/habitUtils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

interface ActionPayload {
  type: 'add_habit' | 'add_routine' | 'add_goal' | 'navigate';
  data: any;
}

interface AICoachProps {
  habits: Habit[];
  goals: Goal[];
  routines: Routine[];
  journalEntries: JournalEntry[];
  focusSessions?: FocusSessionRecord[];
  userProfile: UserProfile;
  onSaveHabit?: (habitData: any) => void;
  setHabits?: React.Dispatch<React.SetStateAction<Habit[]>>;
  setGoals?: React.Dispatch<React.SetStateAction<Goal[]>>;
  setRoutines?: React.Dispatch<React.SetStateAction<Routine[]>>;
  setJournalEntries?: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  challenges?: Challenge[];
  setActiveTab?: (tab: string, category?: string) => void;
  showToast?: (message: string, type?: ToastType) => void;
}

const buildWelcomeMessage = (
  userProfile: UserProfile,
  habits: Habit[],
  goals: Goal[],
  routines: Routine[]
): Message => ({
  role: 'assistant',
  id: 'welcome',
  content: `Hello **${userProfile.name || 'Champion'}**! 👋 I am your AI Performance & Habit Coach.

I have direct visibility into your **${habits.length} habits**, **${goals.length} active goals**, **${routines.length} routines**, and your **${userProfile.momentumScore}% discipline score**.

Ask me anything like:
- *"Build me a 15-minute morning focus routine"*
- *"Analyze my habits and tell me what to improve"*
- *"Help me break down my top goal into daily actions"*
- *"Suggest 3 high-impact habits for better sleep"*`
});

const resolveTargetDateISO = (rawTargetDate?: string): string => {
  if (!rawTargetDate) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  const relMatch = rawTargetDate.match(/^(\d+)\s*(day|days|week|weeks|month|months)$/i);
  if (relMatch) {
    const amount = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();
    const daysToAdd = unit.startsWith('week') ? amount * 7 : unit.startsWith('month') ? amount * 30 : amount;
    return new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  const parsed = new Date(rawTargetDate);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
};

const generateLocalFallbackResponse = (
  userMessage: string,
  userProfile: UserProfile,
  habits: Habit[],
  goals: Goal[],
  routines: Routine[],
  focusSessions: FocusSessionRecord[]
): string => {
  const lower = userMessage.toLowerCase();
  const activeHabits = habits.filter((h) => !h.isArchived && !h.isPaused);
  const completedToday = activeHabits.filter((h) => h.completedToday);
  const incompleteToday = activeHabits.filter((h) => !h.completedToday);
  const topStreakHabit = [...activeHabits].sort((a, b) => b.streak - a.streak)[0];
  const topGoal = [...goals].sort((a, b) => b.progress - a.progress)[0];
  const totalFocusMins = focusSessions
    .filter((s) => s.mode === 'focus')
    .reduce((acc, s) => acc + Math.round((s.actualSecondsCompleted || s.durationMinutes * 60) / 60), 0);

  if (lower.includes('routine') || lower.includes('morning')) {
    const morningHabits = activeHabits
      .filter((h) => h.timeOfDay === 'Morning' || h.timeOfDay === 'Anytime')
      .slice(0, 3)
      .map((h) => h.name);
    const stepList = morningHabits.length > 0 ? morningHabits : ['Hydrate 500ml Water', 'Deep Focus Block (15m)', 'Daily Intention Review'];

    return `Here is a crisp, zero-friction **Morning Activation Routine** built around your current setup (${activeHabits.length} active habits, **${userProfile.momentumScore}%** today score):

### Recommended Morning Flow (25 min)
1. **Hydrate & Sunlight (5 min)** — Reset circadian alertness before checking notifications.
2. **Core Habit Anchor (${stepList[0]})** — Lock in your easiest early win to trigger momentum.
3. **Deep Work Sprint (15 min)** — Tackle your #1 priority before reactive tasks start.

Click below to add this routine in one tap:

\`\`\`json:action
{
  "type": "add_routine",
  "data": {
    "name": "Morning Focus Ignition",
    "description": "High-momentum 25-minute morning launch sequence",
    "time": "07:30 AM",
    "duration": "25 min",
    "habits": ${JSON.stringify(stepList)}
  }
}
\`\`\``;
  }

  if (lower.includes('sleep') || lower.includes('evening') || lower.includes('stress')) {
    return `Protecting recovery directly boosts tomorrow's discipline score (currently **${userProfile.momentumScore}%**).

### Evening Recovery Recommendations
- **Screen Curfew (30 min before bed):** Reduces cognitive stimulation and improves sleep latency.
- **Brain-Dump & Reading (10 min):** Clears open loops so your mind rests cleanly.

\`\`\`json:action
{
  "type": "add_habit",
  "data": {
    "name": "10-Min Evening Reading",
    "emoji": "📚",
    "category": "Mindfulness",
    "type": "timing",
    "targetValue": 10,
    "unit": "min"
  }
}
\`\`\`

\`\`\`json:action
{
  "type": "add_habit",
  "data": {
    "name": "Lights Out On Time",
    "emoji": "🌙",
    "category": "Health",
    "type": "binary",
    "targetValue": 1
  }
}
\`\`\``;
  }

  if (lower.includes('goal') || lower.includes('break down')) {
    const goalSummary = topGoal
      ? `Your top active goal is **"${topGoal.title}"** at **${topGoal.progress}%** progress.`
      : `You currently have **${goals.length} goals** tracked.`;

    return `### Goal Execution Breakdown
${goalSummary}

To convert intention into daily XP and measurable movement:
- Link **1–2 daily habits** directly to your primary goal inside Goals Overview.
- Use a dedicated **25-minute Focus Session** for deep milestones rather than multitasking.
- Keep daily friction low: a small completed step today preserves consistency far better than an skipped 2-hour sprint.

\`\`\`json:action
{
  "type": "add_goal",
  "data": {
    "title": "${topGoal ? `Milestone Push: ${topGoal.title}` : '30-Day Consistency Sprint'}",
    "description": "Complete 25 focused days with linked daily micro-habits",
    "category": "Productivity",
    "progress": 0,
    "targetDate": "30 days"
  }
}
\`\`\`

\`\`\`json:action
{
  "type": "navigate",
  "data": {
    "tab": "goals",
    "label": "Open Goals Overview"
  }
}
\`\`\``;
  }

  if (lower.includes('streak') || lower.includes('miss') || lower.includes('unmotivated')) {
    return `### Never Miss Twice Protocol
Missing one day does not erase your progress — your **${userProfile.totalLifetimeXP || userProfile.currentXP} total XP** and Level **${userProfile.currentLevel}** remain intact.

**What to do right now:**
- **Shrink the target for today:** Do a 2-minute version of one pending habit (${incompleteToday[0]?.name || 'your top priority habit'}).
- **Use Focus Timer:** Start a quick 15-minute focus sprint to regain a clean win today.
- **Protect your anchor:** ${topStreakHabit ? `Your strongest habit is **${topStreakHabit.name}** (${topStreakHabit.streak}-day streak) — keep that alive first.` : 'Focus on completing just one binary habit right now.'}

\`\`\`json:action
{
  "type": "navigate",
  "data": {
    "tab": "habits",
    "label": "Complete One Quick Habit"
  }
}
\`\`\``;
  }

  // Default data-driven discipline & performance analysis
  return `### Live Performance Diagnostic
- **Today's Discipline Score:** **${userProfile.momentumScore}%** (**${completedToday.length}/${activeHabits.length}** active habits completed today)
- **Top Streak:** ${topStreakHabit ? `**${topStreakHabit.name}** (${topStreakHabit.streak} days)` : 'No active streaks yet — complete your first habit today!'}
- **Focus Telemetry:** **${totalFocusMins} min** logged across **${focusSessions.length}** sessions
- **Active Goals & Routines:** **${goals.length}** goals • **${routines.length}** routines

**Top 3 Immediate Actions:**
1. ${incompleteToday.length > 0 ? `Knock out **"${incompleteToday[0].name}"** next to raise today's momentum.` : 'All active habits for today are done — lock in a quick Journal reflection for bonus XP.'}
2. Keep your Smart Widgets pinned to your top 3 daily non-negotiables.
3. Pair quantitative or timing habits with the **Focus Timer** so every minute counts toward Deep Work badges and XP.

\`\`\`json:action
{
  "type": "navigate",
  "data": {
    "tab": "dashboard",
    "label": "Back to Dashboard"
  }
}
\`\`\``;
};

export const AICoach: React.FC<AICoachProps> = ({ 
  habits, 
  goals, 
  routines, 
  journalEntries,
  focusSessions = [],
  userProfile,
  onSaveHabit,
  setHabits,
  setGoals,
  setRoutines,
  challenges = [],
  setActiveTab,
  showToast
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = readScopedJSON<Message[] | null>('coach_history', null);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return [buildWelcomeMessage(userProfile, habits, goals, routines)];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileInsights, setShowMobileInsights] = useState(false);
  const [actionSuccessMap, setActionSuccessMap] = useState<Record<string, boolean>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    writeScopedJSON('coach_history', messages.slice(-40));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleResetChat = () => {
    const fresh = [buildWelcomeMessage(userProfile, habits, goals, routines)];
    setMessages(fresh);
    setActionSuccessMap({});
    writeScopedJSON('coach_history', fresh);
    showToast?.('AI Coach conversation cleared', 'info');
  };

  const handleSend = async (overrideMessage?: string) => {
    const userMessage = overrideMessage || input.trim();
    if (!userMessage || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!overrideMessage) setInput('');
    const nextHistory: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(nextHistory);
    setIsLoading(true);

    try {
      const currentDateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Last 7 days consistency snapshot
      const last7Keys = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return getTodayKey(d);
      });
      const activeHabits = habits.filter((h) => !h.isArchived && !h.isPaused);
      let possible7d = activeHabits.length * 7;
      let done7d = 0;
      activeHabits.forEach((h) => {
        last7Keys.forEach((k) => {
          const val = h.history?.[k];
          if (isHabitValueCompleted(h, val)) done7d++;
        });
      });
      const weeklyConsistency = possible7d > 0 ? Math.round((done7d / possible7d) * 100) : 0;

      const totalFocusMinutes = focusSessions
        .filter((s) => s.mode === 'focus')
        .reduce((sum, s) => sum + Math.round((s.actualSecondsCompleted || s.durationMinutes * 60) / 60), 0);

      const habitsContext = habits.length > 0 
        ? habits.map(h => `- ${h.name} [Category: ${h.category}, Type: ${h.type}, Target: ${h.targetValue} ${h.unit || ''}, Current Streak: ${h.streak} days, Longest Streak: ${h.longestStreak || h.streak} days, Completed Today: ${h.completedToday ? 'Yes' : 'No'}]`).join('\n')
        : 'No habits created yet.';

      const goalsContext = goals.length > 0
        ? goals.map(g => `- ${g.title} [Category: ${g.category}, Progress: ${g.progress}%, Priority: ${g.priority || 'medium'}, Target Date: ${g.targetDate || 'Not set'}]`).join('\n')
        : 'No goals created yet.';

      const routinesContext = routines.length > 0
        ? routines.map(r => `- ${r.name} [Time: ${r.time}, Duration: ${r.duration}, Habits count: ${r.habits?.length || 0}]`).join('\n')
        : 'No routines created yet.';

      const journalContext = journalEntries.length > 0
        ? journalEntries.slice(0, 5).map(j => `- [${j.date}] Mood: ${j.mood}, Entry: "${j.content.slice(0, 80)}..."`).join('\n')
        : 'No recent journal entries.';

      const challengesContext = challenges.length > 0
        ? challenges.slice(0, 3).map(c => `- ${c.title} (${c.goalTarget} target, Joined: ${c.isJoined ? 'Yes' : 'No'})`).join('\n')
        : 'No active challenges.';

      const systemInstruction = `
You are CoachAI, an elite, highly intelligent performance, habit, and productivity coach built into EnerGoals.

CURRENT DATE & TIME:
${currentDateStr} at ${currentTimeStr}

USER PROFILE SNAPSHOT:
- Name: ${userProfile.name}
- Vibe: ${userProfile.vibe || 'Not selected'}
- Level: ${userProfile.currentLevel} (Total XP: ${userProfile.totalLifetimeXP ?? userProfile.currentXP})
- Today's Discipline/Momentum Score: ${userProfile.momentumScore}%
- 7-Day Habit Consistency: ${weeklyConsistency}%
- Total Deep Focus Logged: ${totalFocusMinutes} minutes across ${focusSessions.length} sessions
- Last Check-in: ${userProfile.lastCheckInDate || 'None'}

USER DATA REALITY:
[Habits (${habits.length})]
${habitsContext}

[Goals (${goals.length})]
${goalsContext}

[Routines (${routines.length})]
${routinesContext}

[Recent Journal Logs]
${journalContext}

[Challenges]
${challengesContext}

CORE COACHING RULES:
1. Speak as a supportive, smart, structured coach. Use bullet points, bold key metrics, and crisp markdown formatting.
2. ALWAYS ground advice in the user's REAL habits, goals, focus telemetry, and routines listed above. Never make up fake stats or non-existent habits.
3. If the user asks for a habit, routine, or goal recommendation, include an interactive ACTION CODE BLOCK so they can add it with 1-click!

ACTION CODE BLOCKS SCHEMA:
When proposing a habit, routine, goal, or navigation action, append a code block with language \`json:action\` at the end of your text response:

To suggest adding a Habit (Valid categories: Fitness, Productivity, Mindfulness, Learning, Health, Finance, Custom):
\`\`\`json:action
{
  "type": "add_habit",
  "data": {
    "name": "10-Min Evening Reading",
    "emoji": "📚",
    "category": "Mindfulness",
    "type": "timing",
    "targetValue": 10,
    "unit": "min"
  }
}
\`\`\`

To suggest adding a Routine:
\`\`\`json:action
{
  "type": "add_routine",
  "data": {
    "name": "Evening Unwind",
    "description": "30-min wind down routine for deep sleep",
    "time": "09:30 PM",
    "duration": "30 min",
    "habits": ["No screens after 9pm", "10-Min Evening Reading"]
  }
}
\`\`\`

To suggest adding a Goal (use YYYY-MM-DD or "<N> days"):
\`\`\`json:action
{
  "type": "add_goal",
  "data": {
    "title": "Master Morning Focus Routine",
    "description": "Establish a bulletproof morning start",
    "category": "Productivity",
    "progress": 0,
    "targetDate": "30 days"
  }
}
\`\`\`

To suggest Navigating to a screen:
\`\`\`json:action
{
  "type": "navigate",
  "data": {
    "tab": "habits",
    "label": "Go to Habits Overview"
  }
}
\`\`\`

Keep responses clear, inspiring, and actionable!
`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.slice(-12),
          systemInstruction
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503 || errorData.fallbackRecommended) {
          const localReply = generateLocalFallbackResponse(
            userMessage,
            userProfile,
            habits,
            goals,
            routines,
            focusSessions
          );
          setMessages((prev) => [...prev, { role: 'assistant', content: localReply }]);
          return;
        }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.text || "I'm here to support your journey. What would you like to focus on next?";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      console.error("AI Coach Error:", error);
      if (error.message?.includes('429')) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "AI rate limit reached. Please wait a moment and send your request again." }
        ]);
      } else {
        const localReply = generateLocalFallbackResponse(
          userMessage,
          userProfile,
          habits,
          goals,
          routines,
          focusSessions
        );
        setMessages(prev => [...prev, { role: 'assistant', content: localReply }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleExecuteAction = (action: ActionPayload, actionId: string) => {
    try {
      if (action.type === 'add_habit') {
        const categoryMap: Record<string, HabitCategory> = {
          'Fitness': 'Fitness',
          'Productivity': 'Productivity',
          'Mindfulness': 'Mindfulness',
          'Learning': 'Learning',
          'Health': 'Health',
          'Finance': 'Finance'
        };

        const validCat: HabitCategory = categoryMap[action.data.category] || 'Custom';
        const habitPayload = {
          name: action.data.name || 'New Habit',
          emoji: action.data.emoji || '✨',
          icon: 'Activity',
          category: validCat,
          type: action.data.type || 'binary',
          frequency: 'daily' as const,
          timeOfDay: 'Anytime' as const,
          targetValue: Math.max(1, Number(action.data.targetValue) || 1),
          unit: action.data.unit || '',
          color: '#B14AE0'
        };

        if (onSaveHabit) {
          onSaveHabit(habitPayload);
        } else if (setHabits) {
          const newHabitObj: Habit = {
            id: `habit_${Date.now()}`,
            ...habitPayload,
            currentValue: 0,
            streak: 0,
            longestStreak: 0,
            completedToday: false,
            history: {},
            events: [],
            createdAt: new Date().toISOString()
          };
          setHabits(prev => [newHabitObj, ...prev]);
          showToast?.(`Added habit "${newHabitObj.name}"`, 'success');
        }
        setActionSuccessMap(prev => ({ ...prev, [actionId]: true }));
      } else if (action.type === 'add_routine' && setRoutines) {
        const newRoutineObj: Routine = {
          id: `routine_${Date.now()}`,
          name: action.data.name || 'New Routine',
          description: action.data.description || '',
          time: action.data.time || '08:00 AM',
          duration: action.data.duration || '30 min',
          habits: Array.isArray(action.data.habits) ? action.data.habits : [],
          color: '#5FD4A7'
        };
        setRoutines(prev => [...prev, newRoutineObj]);
        setActionSuccessMap(prev => ({ ...prev, [actionId]: true }));
        showToast?.(`Added routine "${newRoutineObj.name}"`, 'success');
      } else if (action.type === 'add_goal' && setGoals) {
        const categoryMap: Record<string, HabitCategory> = {
          'Fitness': 'Fitness',
          'Productivity': 'Productivity',
          'Mindfulness': 'Mindfulness',
          'Learning': 'Learning',
          'Health': 'Health',
          'Finance': 'Finance'
        };

        const validCat: HabitCategory = categoryMap[action.data.category] || 'Custom';

        const newGoalObj: Goal = {
          id: `goal_${Date.now()}`,
          title: action.data.title || 'New Goal',
          description: action.data.description || '',
          category: validCat,
          progress: 0,
          targetDate: resolveTargetDateISO(action.data.targetDate),
          linkedHabits: [],
          priority: 'medium',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        setGoals(prev => [...prev, newGoalObj]);
        setActionSuccessMap(prev => ({ ...prev, [actionId]: true }));
        showToast?.(`Added goal "${newGoalObj.title}"`, 'success');
      } else if (action.type === 'navigate' && setActiveTab) {
        setActiveTab(action.data.tab || 'habits');
      }
    } catch (e) {
      console.error('Failed to execute action', e);
      showToast?.('Could not apply coach action', 'error');
    }
  };

  // Helper to render message content with action buttons parsed
  const renderMessageContent = (content: string, messageIndex: number) => {
    const actionRegex = /```json:action\n([\s\S]*?)\n```/g;
    const actions: { payload: ActionPayload; id: string }[] = [];
    
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        actions.push({ payload: parsed, id: `action_${messageIndex}_${actions.length}` });
      } catch {
        // ignore invalid json in block
      }
    }

    const cleanText = content.replace(actionRegex, '').trim();

    return (
      <div className="space-y-4">
        <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-2">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>,
              li: ({ children }) => <li className="text-platinum/90">{children}</li>,
              strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
              h3: ({ children }) => <h3 className="text-base font-bold text-white mt-3 mb-1">{children}</h3>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-3 italic my-2 text-platinum/70">{children}</blockquote>
            }}
          >
            {cleanText}
          </ReactMarkdown>
        </div>

        {actions.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2 border-t border-white/10 mt-3">
            {actions.map(({ payload, id }) => {
              const isDone = actionSuccessMap[id];
              if (payload.type === 'add_habit') {
                return (
                  <button
                    key={id}
                    onClick={() => handleExecuteAction(payload, id)}
                    disabled={isDone}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md",
                      isDone 
                        ? "bg-success/20 text-success border border-success/30 cursor-default" 
                        : "bg-primary text-white hover:bg-primary/80 active:scale-95"
                    )}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isDone ? `Added Habit: ${payload.data.name}` : `Add Habit "${payload.data.name}"`}
                  </button>
                );
              }
              if (payload.type === 'add_routine') {
                return (
                  <button
                    key={id}
                    onClick={() => handleExecuteAction(payload, id)}
                    disabled={isDone}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md",
                      isDone 
                        ? "bg-success/20 text-success border border-success/30 cursor-default" 
                        : "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95"
                    )}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                    {isDone ? `Added Routine: ${payload.data.name}` : `Add Routine "${payload.data.name}"`}
                  </button>
                );
              }
              if (payload.type === 'add_goal') {
                return (
                  <button
                    key={id}
                    onClick={() => handleExecuteAction(payload, id)}
                    disabled={isDone}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md",
                      isDone 
                        ? "bg-success/20 text-success border border-success/30 cursor-default" 
                        : "bg-sky-600 text-white hover:bg-sky-500 active:scale-95"
                    )}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                    {isDone ? `Added Goal: ${payload.data.title}` : `Add Goal "${payload.data.title}"`}
                  </button>
                );
              }
              if (payload.type === 'navigate') {
                return (
                  <button
                    key={id}
                    onClick={() => handleExecuteAction(payload, id)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10"
                  >
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    {payload.data.label || `Open ${payload.data.tab}`}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  const quickPrompts = [
    { label: "⚡ Build Morning Routine", prompt: "Build me a high-productivity 30-minute morning routine tailored to my active habits." },
    { label: "📊 Analyze My Discipline", prompt: "Analyze my discipline score and habits completion, and give me 3 specific recommendations." },
    { label: "🔥 Fix Broken Streak", prompt: "I missed my habit today and feel unmotivated. How do I bounce back without losing momentum?" },
    { label: "🎯 Break Down Top Goal", prompt: "Take my highest progress goal and break down the remaining steps into daily micro-habits." },
    { label: "🧘 Mindful Sleep Habit", prompt: "Propose 2 simple evening habits to improve my sleep quality and stress levels." },
  ];

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] min-h-[500px] flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <header className="flex items-center justify-between shrink-0 gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-4xl font-display font-bold text-white flex items-center gap-2 md:gap-3">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary" /> AI Coach
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Gemini Coach
            </span>
          </div>
          <p className="text-xs md:text-sm text-platinum/60 font-medium mt-1">
            Intelligent performance & habit guidance powered by your live data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-platinum/70 hover:text-white transition-all"
            title="Clear chat history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>

          {/* Mobile Insights Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileInsights(prev => !prev)}
            className="xl:hidden flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all"
          >
            <BarChart2 className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Live Insights</span>
            {showMobileInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Collapsible Insights Drawer */}
      <AnimatePresence>
        {showMobileInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="xl:hidden shrink-0 glass-panel p-4 rounded-2xl border border-white/10 overflow-hidden space-y-4"
          >
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-platinum/60 font-medium">Discipline Score</div>
                <div className="text-lg font-bold text-primary mt-1">{userProfile.momentumScore}%</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-platinum/60 font-medium">Active Items</div>
                <div className="text-lg font-bold text-white mt-1">
                  {habits.length} Habits • {goals.length} Goals
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden border border-white/5">
          {/* Scrollable Messages List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3 md:gap-4 max-w-[92%] md:max-w-[85%]",
                  m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md",
                  m.role === 'assistant' ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/10 text-white"
                )}>
                  {m.role === 'assistant' ? <Bot className="w-5 h-5 md:w-6 md:h-6" /> : <User className="w-5 h-5 md:w-6 md:h-6" />}
                </div>

                <div className={cn(
                  "p-4 rounded-2xl shadow-sm",
                  m.role === 'assistant' 
                    ? "bg-white/5 text-platinum/90 border border-white/10" 
                    : "bg-primary text-white font-medium"
                )}>
                  {m.role === 'assistant' 
                    ? renderMessageContent(m.content, i) 
                    : <p className="text-sm leading-relaxed">{m.content}</p>
                  }
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shrink-0">
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-platinum/50 text-sm italic flex items-center gap-2">
                  <span>CoachAI is processing your data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-platinum/80 hover:text-white whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-4 md:p-6 bg-white/[0.02] border-t border-white/5 shrink-0">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask your coach about habits, routines, or performance strategy..."
                className="w-full bg-surface border border-white/10 rounded-2xl pl-4 pr-12 md:pl-6 md:pr-14 py-3.5 md:py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner placeholder:text-platinum/30"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 w-9 h-9 md:w-10 md:h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                title="Send Message"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Context Sidebar */}
        <div className="w-80 space-y-6 hidden xl:block shrink-0">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-platinum/40 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Live Data Context
              </span>
              <span className="text-[10px] text-platinum/40">Realtime</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-platinum/60">
                  <span>Discipline Score</span>
                  <span className="text-primary">{userProfile.momentumScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${userProfile.momentumScore}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] font-bold uppercase text-platinum/40">Active Habits</div>
                  <div className="text-base font-bold text-white mt-0.5">{habits.length}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] font-bold uppercase text-platinum/40">Active Goals</div>
                  <div className="text-base font-bold text-white mt-0.5">{goals.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-platinum/40 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> Focus Goals
            </h3>
            <div className="space-y-3">
              {goals.length === 0 ? (
                <div className="text-xs text-platinum/40 italic">No goals set yet. Ask the coach to generate one!</div>
              ) : (
                goals.slice(0, 3).map(goal => (
                  <div key={goal.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-xs font-bold text-white mb-1 truncate">{goal.title}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 transition-all" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-platinum/40">{goal.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-primary/5">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Coach Principle</span>
            </div>
            <p className="text-xs text-platinum/80 leading-relaxed italic">
              "Consistency over intensity. Small daily micro-habits compound into extraordinary long-term transformations."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
