export interface DailyWisdomItem {
  id: string;
  thought: string;
  explanation: string;
  author?: string;
  category: 
    | 'Discipline & Consistency'
    | 'Personal Growth'
    | 'Focus & Productivity'
    | 'Mindset & Resilience'
    | 'Confidence & Leadership'
    | 'Patience & Long-Term Success'
    | 'Learning & Knowledge'
    | 'Gratitude & Mindfulness'
    | 'Courage & Taking Action';
}

export const DAILY_WISDOM_POOL: DailyWisdomItem[] = [
  // 1. Discipline and Consistency
  {
    id: 'disc-1',
    thought: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    explanation: 'Grand achievements are forged in routine. Focus on showing up for your small daily commitments rather than waiting for sporadic bursts of inspiration.',
    author: 'Will Durant (on Aristotle)',
    category: 'Discipline & Consistency'
  },
  {
    id: 'disc-2',
    thought: 'Discipline is choosing between what you want now and what you want most.',
    explanation: 'Every temptation to procrastinate offers immediate gratification. Remind yourself that honoring your future self brings lasting fulfillment.',
    author: 'Abraham Lincoln',
    category: 'Discipline & Consistency'
  },
  {
    id: 'disc-3',
    thought: 'You do not rise to the level of your goals; you fall to the level of your systems.',
    explanation: 'Having lofty aspirations means little without frictionless daily routines. Build systems that make good habits inevitable and poor habits difficult.',
    author: 'James Clear',
    category: 'Discipline & Consistency'
  },
  {
    id: 'disc-4',
    thought: 'Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.',
    explanation: 'A 1% improvement each day compounds into exponential growth over a year. Never discount small progress.',
    author: 'John C. Maxwell',
    category: 'Discipline & Consistency'
  },
  {
    id: 'disc-5',
    thought: 'Mastery is not an overnight leap, but the steady compounding of ordinary daily choices.',
    explanation: 'Do not chase miraculous shortcuts. True mastery comes from executing the fundamentals day after day with undivided attention.',
    category: 'Discipline & Consistency'
  },

  // 2. Personal Growth and Self-Improvement
  {
    id: 'grow-1',
    thought: 'The only person you should strive to be better than is the person you were yesterday.',
    explanation: 'Measuring your journey against others creates anxiety. Measure only against your own previous standard and celebrate steady personal evolution.',
    category: 'Personal Growth'
  },
  {
    id: 'grow-2',
    thought: 'Every action you take is a vote for the type of person you wish to become.',
    explanation: 'No single act transforms you completely, but each completed habit casts a definitive vote for your highest identity.',
    author: 'James Clear',
    category: 'Personal Growth'
  },
  {
    id: 'grow-3',
    thought: 'Change is hardest at the beginning, messiest in the middle, and best at the end.',
    explanation: 'Initial friction and mid-journey chaos are natural milestones of transformation. Push through the messy middle to harvest the reward.',
    author: 'Robin Sharma',
    category: 'Personal Growth'
  },
  {
    id: 'grow-4',
    thought: 'What we fear doing most is usually what we most need to do.',
    explanation: 'Resistance is an internal compass pointing directly toward your next stage of personal evolution. Lean directly into the challenge.',
    author: 'Tim Ferriss',
    category: 'Personal Growth'
  },

  // 3. Focus and Productivity
  {
    id: 'focus-1',
    thought: 'The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy.',
    explanation: 'Ruthlessly eliminate trivial distractions. A ninety-minute sprint of high-concentration output will outperform an entire day of divided attention.',
    author: 'Cal Newport',
    category: 'Focus & Productivity'
  },
  {
    id: 'focus-2',
    thought: 'Energy flows where attention goes. Protect your focus with the same vigilance you protect your time.',
    explanation: 'Multitasking drains mental bandwidth. Choose one priority task, silence background notifications, and commit your full presence.',
    category: 'Focus & Productivity'
  },
  {
    id: 'focus-3',
    thought: 'Do less, but do it with supreme depth and uncompromising precision.',
    explanation: 'Productivity is not about filling every minute with busyness. It is about identifying the vital few tasks that create genuine leverage.',
    author: 'Marcus Aurelius',
    category: 'Focus & Productivity'
  },
  {
    id: 'focus-4',
    thought: 'It is not that we have a short time to live, but that we waste a great deal of it.',
    explanation: 'Time spent doomscrolling or reacting to urgency is time stolen from your core goals. Reclaim your hours by intentional scheduling.',
    author: 'Seneca',
    category: 'Focus & Productivity'
  },

  // 4. Mindset and Resilience
  {
    id: 'mind-1',
    thought: 'The impediment to action advances action. What stands in the way becomes the way.',
    explanation: 'Obstacles are not barricades stopping your journey; they are the training ground shaping your resilience and resourcefulness.',
    author: 'Marcus Aurelius',
    category: 'Mindset & Resilience'
  },
  {
    id: 'mind-2',
    thought: 'When we are no longer able to change a situation, we are challenged to change ourselves.',
    explanation: 'You cannot dictate external circumstances, but you have sovereign control over your reaction, attitude, and response.',
    author: 'Viktor E. Frankl',
    category: 'Mindset & Resilience'
  },
  {
    id: 'mind-3',
    thought: 'A smooth sea never made a skilled sailor.',
    explanation: 'Difficult days and unexpected setbacks are not evidence of failure—they are the exact experiences building your emotional resilience.',
    author: 'Franklin D. Roosevelt',
    category: 'Mindset & Resilience'
  },
  {
    id: 'mind-4',
    thought: 'He who has a why to live can bear almost any how.',
    explanation: 'Anchor your daily efforts to a deeply meaningful purpose. When your core reason is clear, external difficulties lose their power to stop you.',
    author: 'Friedrich Nietzsche',
    category: 'Mindset & Resilience'
  },

  // 5. Confidence and Leadership
  {
    id: 'conf-1',
    thought: 'Confidence comes not from always being right, but from not fearing to be wrong.',
    explanation: 'True self-assurance is the willingness to attempt, learn, and iterate without fear of judgment. Action precedes confidence.',
    author: 'Peter T. McIntyre',
    category: 'Confidence & Leadership'
  },
  {
    id: 'conf-2',
    thought: 'Leadership begins with self-mastery. You cannot lead others until you can govern your own impulses.',
    explanation: 'Lead by demonstration rather than proclamation. Your personal integrity and daily discipline set the gold standard.',
    category: 'Confidence & Leadership'
  },
  {
    id: 'conf-3',
    thought: 'Believe you can and you are halfway there.',
    explanation: 'Doubt kills more dreams than failure ever will. Adopt an optimistic bias toward your capacity to adapt and solve problems.',
    author: 'Theodore Roosevelt',
    category: 'Confidence & Leadership'
  },
  {
    id: 'conf-4',
    thought: 'Do not wait for extraordinary opportunities. Seize common occasions and make them great.',
    explanation: 'Leadership is found in doing unglamorous daily responsibilities with extraordinary commitment and care.',
    author: 'Orison Swett Marden',
    category: 'Confidence & Leadership'
  },

  // 6. Patience and Long-Term Success
  {
    id: 'pat-1',
    thought: 'The bamboo tree spends four years developing an invisible underground root system before shooting eighty feet high in six weeks.',
    explanation: 'Never confuse slow visible progress with lack of growth. Quiet foundation-building is essential for sustainable, towering success.',
    category: 'Patience & Long-Term Success'
  },
  {
    id: 'pat-2',
    thought: 'Most people overestimate what they can do in a day, and underestimate what they can do in a year.',
    explanation: 'Avoid burning out in an overambitious sprint. Pace yourself for the marathon of continuous compounding.',
    author: 'Bill Gates',
    category: 'Patience & Long-Term Success'
  },
  {
    id: 'pat-3',
    thought: 'Patience is not passive waiting; it is active persistence with complete trust in the process.',
    explanation: 'Keep planting seeds and watering them daily through your habits, even when the sprouts are not yet visible.',
    category: 'Patience & Long-Term Success'
  },
  {
    id: 'pat-4',
    thought: 'Nature does not hurry, yet everything is accomplished.',
    explanation: 'Align your rhythm with steady organic growth. Rushing creates mistakes; deliberate execution guarantees completion.',
    author: 'Lao Tzu',
    category: 'Patience & Long-Term Success'
  },

  // 7. Learning and Knowledge
  {
    id: 'learn-1',
    thought: 'Live as if you were to die tomorrow. Learn as if you were to live forever.',
    explanation: 'Approach every challenge with the humility of a beginner. Relentless curiosity transforms every experience into wisdom.',
    author: 'Mahatma Gandhi',
    category: 'Learning & Knowledge'
  },
  {
    id: 'learn-2',
    thought: 'Knowledge without execution is merely entertainment.',
    explanation: 'Reading books and collecting insights only matters when translated into practical action. Apply one new lesson today.',
    category: 'Learning & Knowledge'
  },
  {
    id: 'learn-3',
    thought: 'The mind is not a vessel to be filled, but a fire to be kindled.',
    explanation: 'Cultivate an active, questioning mind rather than passive consumption. Engage deeply with what you learn.',
    author: 'Plutarch',
    category: 'Learning & Knowledge'
  },
  {
    id: 'learn-4',
    thought: 'An investment in knowledge pays the best interest.',
    explanation: 'Time dedicated to sharpening your skills, reading, or mastering a domain yields dividends for decades to come.',
    author: 'Benjamin Franklin',
    category: 'Learning & Knowledge'
  },

  // 8. Gratitude and Mindfulness
  {
    id: 'grat-1',
    thought: 'He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.',
    explanation: 'Start your session by taking 30 seconds to acknowledge three simple blessings in your life. Gratitude resets your baseline toward abundance.',
    author: 'Epictetus',
    category: 'Gratitude & Mindfulness'
  },
  {
    id: 'grat-2',
    thought: 'Be present in this very moment; tomorrow is a concept, yesterday is a memory, and today is where your life is lived.',
    explanation: 'Bring your full awareness to whatever task is right in front of you. Single-tasking with mindful presence produces quiet serenity.',
    category: 'Gratitude & Mindfulness'
  },
  {
    id: 'grat-3',
    thought: 'When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.',
    explanation: 'Frame each new day as an extraordinary gift rather than an obligation. This mental pivot turns discipline into appreciation.',
    author: 'Marcus Aurelius',
    category: 'Gratitude & Mindfulness'
  },
  {
    id: 'grat-4',
    thought: 'Gratitude turns what we have into enough, and more. It turns denial into acceptance, chaos into order, and confusion into clarity.',
    explanation: 'Ground your ambition in deep contentment for the current step. Ambition powered by gratitude prevents burnout.',
    author: 'Melody Beattie',
    category: 'Gratitude & Mindfulness'
  },

  // 9. Courage and Taking Action
  {
    id: 'act-1',
    thought: 'Action cures fear. Indecision and delay fertilize it.',
    explanation: 'If you feel anxiety or hesitation about a goal, take one small physical step immediately. Action dissolves paralysis.',
    author: 'David J. Schwartz',
    category: 'Courage & Taking Action'
  },
  {
    id: 'act-2',
    thought: 'Whatever you can do, or dream you can, begin it. Boldness has genius, power, and magic in it.',
    explanation: 'Do not wait for perfect conditions to start. Initiate momentum today, and course-correct as you move forward.',
    author: 'Johann Wolfgang von Goethe',
    category: 'Courage & Taking Action'
  },
  {
    id: 'act-3',
    thought: 'Courage is resistance to fear, mastery of fear—not absence of fear.',
    explanation: 'Feeling nervous or uncertain is completely normal. True bravery is moving forward with clarity despite the flutter in your chest.',
    author: 'Mark Twain',
    category: 'Courage & Taking Action'
  },
  {
    id: 'act-4',
    thought: 'In any moment of decision, the best thing you can do is the right thing, the next best thing is the wrong thing, and the worst thing you can do is nothing.',
    explanation: 'Make a decisive choice and execute. Stagnation is the only true failure; errors provide data to improve.',
    author: 'Theodore Roosevelt',
    category: 'Courage & Taking Action'
  }
];

/**
 * Returns a stable, deterministic DailyWisdomItem for any given date string (YYYY-MM-DD in local time).
 * Uses a deterministic hash so that within any calendar day, all renders and reloads return the exact same wisdom.
 */
export function getWisdomForDate(dateKey: string): DailyWisdomItem {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_WISDOM_POOL.length;
  return DAILY_WISDOM_POOL[index];
}

/**
 * Gets the user's local date string formatted as YYYY-MM-DD using device local time.
 */
export function getLocalTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
