import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  Achievement,
  AppSettings,
  FocusSessionRecord,
  Goal,
  Habit,
  JournalEntry,
  Routine,
  RoutineCompletionRecord,
  UserProfile,
  XPTransaction
} from '../types';
import { CalendarEntry } from '../types/calendar';

let currentScope = 'guest';

export const getActiveStorageScope = (): string => currentScope;

export const setActiveStorageScope = (uid: string | null | undefined): string => {
  currentScope = uid && uid.trim() ? uid.trim() : 'guest';
  return currentScope;
};

export const scopedKey = (baseKey: string, scope: string = currentScope): string => {
  return `energoals_u_${scope}_${baseKey}`;
};

export const readScopedJSON = <T>(baseKey: string, fallback: T, scope: string = currentScope): T => {
  try {
    const raw = localStorage.getItem(scopedKey(baseKey, scope));
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
    if (scope === 'guest') {
      const legacyRaw = localStorage.getItem(`energoals_${baseKey}`);
      if (legacyRaw !== null) {
        const parsed = JSON.parse(legacyRaw) as T;
        localStorage.setItem(scopedKey(baseKey, scope), legacyRaw);
        return parsed;
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
};

export const writeScopedJSON = (baseKey: string, value: unknown, scope: string = currentScope): void => {
  try {
    localStorage.setItem(scopedKey(baseKey, scope), JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to write scoped storage key ${baseKey}:`, err);
  }
};

export const removeScopedKey = (baseKey: string, scope: string = currentScope): void => {
  try {
    localStorage.removeItem(scopedKey(baseKey, scope));
    if (scope === 'guest') {
      localStorage.removeItem(`energoals_${baseKey}`);
    }
  } catch {
    // ignore storage errors
  }
};

const ALL_SCOPED_BASE_KEYS = [
  'habits',
  'goals',
  'routines',
  'journal',
  'calendar',
  'challenges',
  'achievements',
  'profile',
  'settings',
  'pinned_habits',
  'focus_sessions',
  'completion_records',
  'xp_transactions',
  'routine_history',
  'active_focus_timer',
  'coach_history'
];

export const clearScopedStorage = (scope: string = currentScope): void => {
  try {
    ALL_SCOPED_BASE_KEYS.forEach((baseKey) => {
      localStorage.removeItem(scopedKey(baseKey, scope));
      if (scope === 'guest') {
        localStorage.removeItem(`energoals_${baseKey}`);
      }
    });
    // Clean any routine active timer keys
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(`energoals_u_${scope}_`) || (scope === 'guest' && k.startsWith('energoals_')))) {
        toDelete.push(k);
      }
    }
    toDelete.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Failed clearing scoped storage:', err);
  }
};

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = sanitizeForFirestore(v);
      }
    }
    return out as T;
  }
  return data;
}

export interface UserCloudBundle {
  profile?: UserProfile;
  settings?: AppSettings;
  habits: Habit[];
  goals: Goal[];
  routines: Routine[];
  journalEntries: JournalEntry[];
  focusSessions: FocusSessionRecord[];
  achievements?: Achievement[];
  pinnedHabitIds?: string[];
  calendarEntries?: CalendarEntry[];
  routineHistory?: RoutineCompletionRecord[];
  xpTransactions?: XPTransaction[];
}

export const loadUserBundleFromFirestore = async (uid: string): Promise<UserCloudBundle | null> => {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const [
      userSnap,
      habitsSnap,
      goalsSnap,
      routinesSnap,
      journalSnap,
      focusSnap
    ] = await Promise.all([
      getDoc(userDocRef),
      getDocs(collection(db, 'users', uid, 'habits')),
      getDocs(collection(db, 'users', uid, 'goals')),
      getDocs(collection(db, 'users', uid, 'routines')),
      getDocs(collection(db, 'users', uid, 'journal')),
      getDocs(collection(db, 'users', uid, 'focus_sessions'))
    ]);

    const userData = userSnap.exists() ? userSnap.data() : {};
    return {
      profile: userData.profile as UserProfile | undefined,
      settings: userData.settings as AppSettings | undefined,
      achievements: userData.achievements as Achievement[] | undefined,
      pinnedHabitIds: userData.pinnedHabitIds as string[] | undefined,
      calendarEntries: userData.calendarEntries as CalendarEntry[] | undefined,
      routineHistory: userData.routineHistory as RoutineCompletionRecord[] | undefined,
      xpTransactions: userData.xpTransactions as XPTransaction[] | undefined,
      habits: habitsSnap.docs.map((d) => d.data() as Habit),
      goals: goalsSnap.docs.map((d) => d.data() as Goal),
      routines: routinesSnap.docs.map((d) => d.data() as Routine),
      journalEntries: journalSnap.docs.map((d) => d.data() as JournalEntry),
      focusSessions: focusSnap.docs.map((d) => d.data() as FocusSessionRecord)
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
};

export const syncUserDocMetadataToFirestore = async (
  uid: string,
  payload: Partial<{
    profile: UserProfile;
    settings: AppSettings;
    achievements: Achievement[];
    pinnedHabitIds: string[];
    calendarEntries: CalendarEntry[];
    routineHistory: RoutineCompletionRecord[];
    xpTransactions: XPTransaction[];
  }>
): Promise<boolean> => {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return false;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, sanitizeForFirestore({ ...payload, updatedAt: new Date().toISOString() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    return false;
  }
};

export const syncCollectionToFirestore = async <T extends { id: string }>(
  uid: string,
  subcollection: 'habits' | 'goals' | 'routines' | 'journal' | 'focus_sessions' | 'completion_records',
  items: T[]
): Promise<boolean> => {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return false;
  try {
    const colRef = collection(db, 'users', uid, subcollection);
    const existingSnap = await getDocs(colRef);
    const desiredIds = new Set(items.map((item) => item.id));

    const batch = writeBatch(db);
    let ops = 0;

    existingSnap.docs.forEach((docSnap) => {
      if (!desiredIds.has(docSnap.id) && ops < 450) {
        batch.delete(docSnap.ref);
        ops++;
      }
    });

    items.forEach((item) => {
      if (ops < 450) {
        batch.set(doc(db, 'users', uid, subcollection, item.id), sanitizeForFirestore(item));
        ops++;
      }
    });

    if (ops > 0) {
      await batch.commit();
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/${subcollection}`);
    return false;
  }
};

export const deleteUserFirestoreData = async (uid: string): Promise<boolean> => {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return false;
  try {
    const subcols = ['habits', 'goals', 'routines', 'journal', 'focus_sessions', 'completion_records'] as const;
    for (const sub of subcols) {
      const snap = await getDocs(collection(db, 'users', uid, sub));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      if (!snap.empty) await batch.commit();
    }
    await deleteDoc(doc(db, 'users', uid));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    return false;
  }
};

export const triggerBrowserDownload = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
