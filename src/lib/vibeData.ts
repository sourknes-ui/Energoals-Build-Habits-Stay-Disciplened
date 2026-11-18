export interface VibeOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  colorName: string;
  badgeBg: string;
  cardActiveBorder: string;
  cardActiveBg: string;
  cardGlow: string;
}

export const VIBE_OPTIONS: VibeOption[] = [
  {
    id: 'diva',
    name: 'The Diva',
    emoji: '👑',
    description: 'Confident, ambitious, and born to stand out.',
    colorName: 'amber',
    badgeBg: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
    cardActiveBorder: 'border-amber-400',
    cardActiveBg: 'bg-amber-500/10',
    cardGlow: 'shadow-[0_0_25px_rgba(245,158,11,0.22)]'
  },
  {
    id: 'strategist',
    name: 'The Strategist',
    emoji: '🧠',
    description: 'Smart, organized, and always planning ahead.',
    colorName: 'purple',
    badgeBg: 'bg-purple-500/15 border-purple-500/35 text-purple-300',
    cardActiveBorder: 'border-purple-400',
    cardActiveBg: 'bg-purple-500/10',
    cardGlow: 'shadow-[0_0_25px_rgba(168,85,247,0.22)]'
  },
  {
    id: 'beast',
    name: 'The Beast',
    emoji: '🔥',
    description: 'Relentless, disciplined, and driven by challenges.',
    colorName: 'red',
    badgeBg: 'bg-red-500/15 border-red-500/35 text-red-300',
    cardActiveBorder: 'border-red-400',
    cardActiveBg: 'bg-red-500/10',
    cardGlow: 'shadow-[0_0_25px_rgba(239,68,68,0.22)]'
  },
  {
    id: 'zen_soul',
    name: 'The Zen Soul',
    emoji: '🧘',
    description: 'Calm, balanced, and focused on personal growth.',
    colorName: 'emerald',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
    cardActiveBorder: 'border-emerald-400',
    cardActiveBg: 'bg-emerald-500/10',
    cardGlow: 'shadow-[0_0_25px_rgba(16,185,129,0.22)]'
  },
  {
    id: 'high_performer',
    name: 'The High Performer',
    emoji: '⚡',
    description: 'Ambitious, productive, and always improving.',
    colorName: 'yellow',
    badgeBg: 'bg-yellow-500/15 border-yellow-500/35 text-yellow-300',
    cardActiveBorder: 'border-yellow-400',
    cardActiveBg: 'bg-yellow-500/10',
    cardGlow: 'shadow-[0_0_25px_rgba(234,179,8,0.22)]'
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    emoji: '🌱',
    description: 'Curious, adaptable, and always discovering new things.',
    colorName: 'teal',
    badgeBg: 'bg-teal-500/15 border-teal-500/35 text-teal-300',
    cardActiveBorder: 'border-teal-400',
    cardActiveBg: 'bg-teal-500/10',
    cardGlow: 'shadow-[0_0_25px_rgba(20,184,166,0.22)]'
  }
];

export function getVibeById(idOrName?: string): VibeOption | null {
  if (!idOrName) return null;
  const normalized = idOrName.trim().toLowerCase();
  const match = VIBE_OPTIONS.find(
    v => v.id.toLowerCase() === normalized ||
         v.name.toLowerCase() === normalized ||
         `${v.emoji} ${v.name}`.toLowerCase() === normalized
  );
  return match || null;
}
