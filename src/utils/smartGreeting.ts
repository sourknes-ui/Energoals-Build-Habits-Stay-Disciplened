import { useState, useEffect } from 'react';

export type TimeSlot = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';

export interface GreetingTemplate {
  id: string;
  before: string;
  after: string;
}

export const GREETINGS_BY_SLOT: Record<TimeSlot, GreetingTemplate[]> = {
  // 05:00 – 07:59 | Early Morning 🌅
  early_morning: [
    { id: 'em-1', before: 'Up this early,', after: '? Who are you?!' },
    { id: 'em-2', before: 'The world is asleep, but look at you,', after: '.' },
    { id: 'em-3', before: 'Rise and shine,', after: ' — productivity machine mode!' },
    { id: 'em-4', before: 'Early bird mode ACTIVATED,', after: '.' },
    { id: 'em-5', before: 'Winning before the sun even clocks in,', after: '.' },
    { id: 'em-6', before: 'Discipline before sunrise hits different,', after: '.' }
  ],

  // 08:00 – 11:59 | Morning ☀️
  morning: [
    { id: 'm-1', before: 'Coffee? Discipline? Both,', after: '?' },
    { id: 'm-2', before: 'Time to show today who is in charge,', after: '.' },
    { id: 'm-3', before: 'Another day, another streak to defend,', after: '!' },
    { id: 'm-4', before: 'Morning routine initiated,', after: '.' },
    { id: 'm-5', before: "Let's make today count, no excuses,", after: '!' },
    { id: 'm-6', before: "Sun's up, goals locked, let's execute,", after: '.' },
    { id: 'm-7', before: 'Good morning,', after: ' — momentum awaits.' }
  ],

  // 12:00 – 16:59 | Afternoon 🌤️
  afternoon: [
    { id: 'a-1', before: 'Midday check-in,', after: ": don't you dare slack off now." },
    { id: 'a-2', before: 'The afternoon slump is an illusion,', after: '. Keep pushing!' },
    { id: 'a-3', before: 'Halfway through the day,', after: '. Finish strong!' },
    { id: 'a-4', before: 'Peak performance hours,', after: ". Let's get to work." },
    { id: 'a-5', before: 'Consistency beats intensity every single time,', after: '.' },
    { id: 'a-6', before: 'Still here,', after: '? That is what discipline looks like.' }
  ],

  // 17:00 – 19:59 | Evening 🌆
  evening: [
    { id: 'e-1', before: 'Winding down, or just warming up,', after: '?' },
    { id: 'e-2', before: 'Evening warrior mode,', after: '. Lock in those habits.' },
    { id: 'e-3', before: 'The day is almost done,', after: ". How's your scorecard looking?" },
    { id: 'e-4', before: 'Golden hour focus,', after: ". Let's wrap today up right." },
    { id: 'e-5', before: "Discipline doesn't punch a clock at 5 PM,", after: '.' },
    { id: 'e-6', before: 'A strong finish beats an average start,', after: '!' }
  ],

  // 20:00 – 23:59 | Night 🌙
  night: [
    { id: 'n-1', before: 'Late night grind or winding down,', after: '?' },
    { id: 'n-2', before: 'Time to log those wins,', after: ', before the day resets.' },
    { id: 'n-3', before: 'Quiet hours are when champions reflect,', after: '.' },
    { id: 'n-4', before: 'Protect your sleep like your streak,', after: '.' },
    { id: 'n-5', before: 'One last disciplined push,', after: ', then rest well.' },
    { id: 'n-6', before: 'Another day conquered,', after: '. Review and recharge.' }
  ],

  // 00:00 – 04:59 | Midnight / Late Night 🦉
  late_night: [
    { id: 'ln-1', before: 'BRO, WHAT ARE YOU DOING AWAKE,', after: '?!' },
    { id: 'ln-2', before: 'Sleep is for the weak... but maybe go to bed soon,', after: '?' },
    { id: 'ln-3', before: 'Night owl mode is cool until 7:00 AM hits,', after: '!' },
    { id: 'ln-4', before: 'Burning the midnight oil, are we,', after: '?' },
    { id: 'ln-5', before: "Either you're building an empire or you lost track of time,", after: '.' },
    { id: 'ln-6', before: 'Go to bed,', after: ' — your streak needs you well-rested!' }
  ]
};

/**
 * Returns the current local time category based strictly on device local hours.
 */
export function getCurrentTimeSlot(date: Date = new Date()): TimeSlot {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'early_morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 24) return 'night';
  return 'late_night'; // 00:00 – 04:59
}

/**
 * Deterministically chooses a greeting for the slot so that within a session,
 * it stays stable without flickering on every re-render or minor state change,
 * but varies nicely over different days or slot changes.
 */
export function getSmartGreetingTemplate(slot: TimeSlot, date: Date = new Date()): GreetingTemplate {
  const pool = GREETINGS_BY_SLOT[slot];
  if (!pool || pool.length === 0) {
    return { id: 'fallback', before: 'Good day,', after: '!' };
  }

  // Check sessionStorage for stability during this active slot in this session
  const sessionKey = `energoals_greeting_${slot}`;
  try {
    const cachedId = sessionStorage.getItem(sessionKey);
    if (cachedId) {
      const found = pool.find(item => item.id === cachedId);
      if (found) return found;
    }
  } catch {
    // sessionStorage might be restricted in some iframe contexts
  }

  // Deterministically hash based on local date (YYYY-MM-DD) + slot
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  const selected = pool[index];

  try {
    sessionStorage.setItem(sessionKey, selected.id);
  } catch {
    // ignore
  }

  return selected;
}

/**
 * React hook that dynamically detects real-time device local clock changes.
 * Automatically switches the greeting when the time bracket changes.
 */
export function useSmartGreeting() {
  const [slot, setSlot] = useState<TimeSlot>(() => getCurrentTimeSlot());
  const [template, setTemplate] = useState<GreetingTemplate>(() => getSmartGreetingTemplate(getCurrentTimeSlot()));

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const currentSlot = getCurrentTimeSlot(now);
      if (currentSlot !== slot) {
        setSlot(currentSlot);
        setTemplate(getSmartGreetingTemplate(currentSlot, now));
      }
    };

    // Check device clock every 15 seconds so hour transitions happen immediately
    const interval = setInterval(checkTime, 15000);

    // Also check immediately when tab gains focus or device wakes from sleep
    const onFocus = () => checkTime();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTime();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [slot]);

  return { slot, template };
}
