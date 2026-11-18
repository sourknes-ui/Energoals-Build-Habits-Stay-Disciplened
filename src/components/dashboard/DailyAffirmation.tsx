import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { 
  DailyWisdomItem, 
  DAILY_WISDOM_POOL, 
  getWisdomForDate, 
  getLocalTodayDateKey 
} from '../../data/dailyWisdomData';

const STORAGE_KEY = 'energoals_daily_wisdom';

export const DailyAffirmation: React.FC = () => {
  const [currentDateKey, setCurrentDateKey] = useState<string>(() => getLocalTodayDateKey());
  const [wisdom, setWisdom] = useState<DailyWisdomItem>(() => {
    const today = getLocalTodayDateKey();
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === today && parsed.wisdom?.thought) {
          return parsed.wisdom;
        }
      }
    } catch {
      // ignore
    }
    return getWisdomForDate(today);
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Sync with Firestore and ensure local persistence for today
  useEffect(() => {
    let isMounted = true;

    const syncDailyWisdom = async (todayKey: string) => {
      try {
        const fallbackWisdom = getWisdomForDate(todayKey);

        // Check localStorage first
        let localWisdom: DailyWisdomItem | null = null;
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.date === todayKey && parsed.wisdom?.thought) {
              localWisdom = parsed.wisdom;
            }
          }
        } catch {
          // ignore
        }

        const user = auth.currentUser;
        if (user) {
          try {
            const docRef = doc(db, 'users', user.uid, 'dailyAffirmations', todayKey);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data()?.thought) {
              const cloudWisdom = docSnap.data() as DailyWisdomItem;
              if (isMounted) {
                setWisdom(cloudWisdom);
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey, wisdom: cloudWisdom }));
                } catch {
                  // ignore
                }
              }
              return;
            }
          } catch {
            // Firestore error or offline
          }
        }

        const selectedWisdom = localWisdom || fallbackWisdom;

        if (isMounted) {
          setWisdom(selectedWisdom);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey, wisdom: selectedWisdom }));
          } catch {
            // ignore
          }
        }

        // Save to Firestore if user logged in
        if (user) {
          try {
            const docRef = doc(db, 'users', user.uid, 'dailyAffirmations', todayKey);
            await setDoc(docRef, {
              ...selectedWisdom,
              dateKey: todayKey,
              savedAt: new Date().toISOString()
            }, { merge: true });
          } catch {
            // ignore
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    syncDailyWisdom(currentDateKey);

    return () => {
      isMounted = false;
    };
  }, [currentDateKey]);

  // Interval check to detect when a new calendar day begins based on device local time
  useEffect(() => {
    const checkDayRollover = () => {
      const today = getLocalTodayDateKey();
      if (today !== currentDateKey) {
        setCurrentDateKey(today);
      }
    };

    // Check every 30 seconds for day transition
    const interval = setInterval(checkDayRollover, 30000);

    const handleFocus = () => checkDayRollover();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDayRollover();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentDateKey]);

  if (!wisdom || !wisdom.thought) return null;

  return (
    <motion.div 
      key={currentDateKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel p-6 rounded-2xl border border-white/5 mb-6 flex items-start gap-4"
    >
      <div className="bg-primary/20 p-3 rounded-full shrink-0">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Daily Wisdom</h3>
          {wisdom.category && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-platinum/50 border border-white/10 uppercase tracking-wider">
              {wisdom.category}
            </span>
          )}
        </div>
        <p className="text-base sm:text-lg font-medium text-white/95 leading-relaxed">
          "{wisdom.thought}"
        </p>
        {wisdom.explanation && (
          <p className="text-xs sm:text-sm text-platinum/70 mt-1.5 leading-relaxed">
            {wisdom.explanation}
          </p>
        )}
        {wisdom.author && (
          <p className="text-[11px] font-semibold text-primary/80 mt-1.5 uppercase tracking-wider font-mono">
            — {wisdom.author}
          </p>
        )}
      </div>
    </motion.div>
  );
};
