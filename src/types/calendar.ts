import { HabitCategory } from '../types';

export type EntryType = 'reminder' | 'deadline' | 'highlight';

export interface CalendarReminder {
  id: string;
  type: 'reminder';
  title: string;
  date: string; // ISO string
  time?: string; // HH:mm
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  note?: string;
  icon?: string;
  category: HabitCategory;
  notificationTime?: number; // minutes before
}

export interface CalendarDeadline {
  id: string;
  type: 'deadline';
  title: string;
  date: string; // ISO string
  time?: string; // HH:mm
  color: string;
  note?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface CalendarHighlight {
  id: string;
  type: 'highlight';
  title: string;
  date: string; // ISO string
  color: string;
  icon?: string;
  note?: string;
  label: string;
}

export type CalendarEntry = CalendarReminder | CalendarDeadline | CalendarHighlight;

export interface CalendarState {
  entries: CalendarEntry[];
}
