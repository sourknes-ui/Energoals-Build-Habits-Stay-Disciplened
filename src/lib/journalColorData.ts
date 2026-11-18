export interface JournalColor {
  id: string;
  name: string;
  swatchHex: string;
  cardBg: string;
  cardBorder: string;
  accentText: string;
  accentBg: string;
  glow: string;
}

export const JOURNAL_COLORS: JournalColor[] = [
  {
    id: 'lavender',
    name: 'Lavender',
    swatchHex: '#B8A9FC',
    cardBg: 'bg-[#B8A9FC]/10',
    cardBorder: 'border-[#B8A9FC]/35 hover:border-[#B8A9FC]/55',
    accentText: 'text-[#C7BCFC]',
    accentBg: 'bg-[#B8A9FC]/15',
    glow: 'shadow-[0_0_25px_rgba(184,169,252,0.14)]'
  },
  {
    id: 'soft-purple',
    name: 'Soft Purple',
    swatchHex: '#C084FC',
    cardBg: 'bg-purple-500/10',
    cardBorder: 'border-purple-400/35 hover:border-purple-400/55',
    accentText: 'text-purple-300',
    accentBg: 'bg-purple-500/15',
    glow: 'shadow-[0_0_25px_rgba(192,132,252,0.14)]'
  },
  {
    id: 'pastel-pink',
    name: 'Pastel Pink',
    swatchHex: '#F9A8D4',
    cardBg: 'bg-pink-500/10',
    cardBorder: 'border-pink-400/35 hover:border-pink-400/55',
    accentText: 'text-pink-300',
    accentBg: 'bg-pink-500/15',
    glow: 'shadow-[0_0_25px_rgba(249,168,212,0.14)]'
  },
  {
    id: 'peach',
    name: 'Peach',
    swatchHex: '#FDBA74',
    cardBg: 'bg-orange-500/10',
    cardBorder: 'border-orange-400/35 hover:border-orange-400/55',
    accentText: 'text-orange-300',
    accentBg: 'bg-orange-500/15',
    glow: 'shadow-[0_0_25px_rgba(253,186,116,0.14)]'
  },
  {
    id: 'cream',
    name: 'Cream',
    swatchHex: '#FEF3C7',
    cardBg: 'bg-amber-100/10',
    cardBorder: 'border-amber-200/35 hover:border-amber-200/55',
    accentText: 'text-amber-200',
    accentBg: 'bg-amber-100/15',
    glow: 'shadow-[0_0_25px_rgba(254,243,199,0.12)]'
  },
  {
    id: 'sage-green',
    name: 'Sage Green',
    swatchHex: '#86EFAC',
    cardBg: 'bg-emerald-500/10',
    cardBorder: 'border-emerald-400/35 hover:border-emerald-400/55',
    accentText: 'text-emerald-300',
    accentBg: 'bg-emerald-500/15',
    glow: 'shadow-[0_0_25px_rgba(134,239,172,0.14)]'
  },
  {
    id: 'sky-blue',
    name: 'Sky Blue',
    swatchHex: '#7DD3FC',
    cardBg: 'bg-sky-500/10',
    cardBorder: 'border-sky-400/35 hover:border-sky-400/55',
    accentText: 'text-sky-300',
    accentBg: 'bg-sky-500/15',
    glow: 'shadow-[0_0_25px_rgba(125,211,252,0.14)]'
  },
  {
    id: 'soft-yellow',
    name: 'Soft Yellow',
    swatchHex: '#FDE047',
    cardBg: 'bg-yellow-500/10',
    cardBorder: 'border-yellow-400/35 hover:border-yellow-400/55',
    accentText: 'text-yellow-300',
    accentBg: 'bg-yellow-500/15',
    glow: 'shadow-[0_0_25px_rgba(253,224,71,0.14)]'
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    swatchHex: '#60A5FA',
    cardBg: 'bg-blue-600/12',
    cardBorder: 'border-blue-400/35 hover:border-blue-400/55',
    accentText: 'text-blue-300',
    accentBg: 'bg-blue-500/15',
    glow: 'shadow-[0_0_25px_rgba(96,165,250,0.16)]'
  },
  {
    id: 'classic-grey',
    name: 'Classic Grey',
    swatchHex: '#CBD5E1',
    cardBg: 'bg-slate-500/10',
    cardBorder: 'border-slate-400/30 hover:border-slate-400/50',
    accentText: 'text-slate-300',
    accentBg: 'bg-slate-500/15',
    glow: 'shadow-[0_0_25px_rgba(203,213,225,0.12)]'
  }
];

export function getJournalColor(colorId?: string): JournalColor | null {
  if (!colorId) return null;
  const normalized = colorId.trim().toLowerCase();
  const match = JOURNAL_COLORS.find(
    c => c.id.toLowerCase() === normalized ||
         c.name.toLowerCase() === normalized
  );
  return match || null;
}
