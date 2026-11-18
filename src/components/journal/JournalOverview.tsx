import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Plus, Search, Calendar, Smile, Zap, MessageSquare, Edit2, Trash2, X, Palette, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { JournalEntry, XPTransaction } from '../../types';
import { CreateJournalEntryModal } from './CreateJournalEntryModal';
import { getJournalColor, JOURNAL_COLORS } from '../../lib/journalColorData';
import { JournalColorSwatches } from './JournalColorSwatches';
import { ConfirmModal, ToastType } from '../ui/Feedback';

interface JournalOverviewProps {
  entries: JournalEntry[];
  setEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  addXP?: (
    amount: number,
    meta?: {
      key?: string;
      reason?: string;
      source?: XPTransaction['source'];
      entityId?: string;
    }
  ) => boolean;
  showToast?: (message: string, type?: ToastType) => void;
}

export const JournalOverview: React.FC<JournalOverviewProps> = ({ entries, setEntries, addXP, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<string>('All');
  const [colorFilter, setColorFilter] = useState<string>('All');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [colorPickerEntryId, setColorPickerEntryId] = useState<string | null>(null);
  const [isFullModalColorPickerOpen, setIsFullModalColorPickerOpen] = useState(false);

  // Close color picker on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setColorPickerEntryId(null);
        setIsFullModalColorPickerOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.journal-color-popover') && !target.closest('.journal-color-btn')) {
        setColorPickerEntryId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleSaveEntry = (entry: JournalEntry) => {
    if (editingEntry) {
      setEntries(prev => prev.map(e => e.id === editingEntry.id ? entry : e));
      if (selectedEntry?.id === editingEntry.id) {
        setSelectedEntry(entry);
      }
      showToast?.(`Updated "${entry.title}"`, 'success');
    } else {
      setEntries(prev => [entry, ...prev]);
      const awarded = addXP?.(15, {
        key: `journal_create_${entry.id}`,
        reason: `Journal Entry: ${entry.title}`,
        source: 'journal',
        entityId: entry.id
      });
      showToast?.(awarded ? `Journal saved (+15 XP)` : `Journal saved`, 'success');
    }
    setEditingEntry(null);
  };

  const handleConfirmDelete = () => {
    if (!entryToDelete) return;
    const id = entryToDelete.id;
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
    if (colorPickerEntryId === id) setColorPickerEntryId(null);
    showToast?.(`Deleted "${entryToDelete.title}"`, 'info');
    setEntryToDelete(null);
  };

  const handleEditEntry = (entry: JournalEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEntry(entry);
    setIsModalOpen(true);
    setColorPickerEntryId(null);
  };

  const handleChangeColor = (id: string, newColorId: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, color: newColorId } : e));
    if (selectedEntry?.id === id) {
      setSelectedEntry(prev => prev ? { ...prev, color: newColorId } : null);
    }
  };

  const filteredEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q));
      const matchesMood = moodFilter === 'All' || e.mood === moodFilter;
      const matchesColor =
        colorFilter === 'All' ||
        (colorFilter === 'Default' ? !e.color : e.color === colorFilter);
      return matchesQuery && matchesMood && matchesColor;
    });

  const selectedColorData = selectedEntry ? getJournalColor(selectedEntry.color) : null;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <ConfirmModal
        isOpen={!!entryToDelete}
        title="Delete Journal Entry?"
        description={`Are you sure you want to delete "${entryToDelete?.title || ''}"? This cannot be undone.`}
        confirmLabel="Delete Entry"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-1 sm:mb-2">Journal</h1>
          <p className="text-platinum/60 font-medium text-xs sm:text-sm">Reflect on your journey, capture daily insights, and customize note colors.</p>
        </div>
        <button 
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="btn-primary w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-5 h-5" /> New Entry
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / Filters */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-platinum/40">Search & Filters</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find entries..." 
                className="w-full bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-platinum/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-platinum/40">Mood</label>
              <select
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
              >
                {['All', 'Excellent', 'Great', 'Good', 'Neutral', 'Low', 'Tired'].map((m) => (
                  <option key={m} value={m} className="bg-surface">{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-platinum/40">Note Color</label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
              >
                <option value="All" className="bg-surface">All Colors</option>
                <option value="Default" className="bg-surface">Default Glass</option>
                {JOURNAL_COLORS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-platinum/40 mb-4">Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-platinum/60 text-sm">Total Entries</span>
                <span className="text-white font-bold">{entries.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-platinum/60 text-sm">Avg. Energy</span>
                <span className="text-white font-bold">
                  {entries.length > 0 
                    ? (entries.reduce((acc, e) => acc + e.energy, 0) / entries.length).toFixed(1) 
                    : "0.0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-platinum/60 text-sm">Custom Colors</span>
                <span className="text-white font-bold">
                  {entries.filter(e => !!e.color).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Entries List */}
        <div className="lg:col-span-3 space-y-6">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => {
              const colorData = getJournalColor(entry.color);
              const isColorPickerOpen = colorPickerEntryId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "p-5 sm:p-8 rounded-2xl border transition-all duration-300 group cursor-pointer relative",
                    colorData
                      ? `${colorData.cardBg} ${colorData.cardBorder} ${colorData.glow} backdrop-blur-md`
                      : "glass-panel border-white/5 hover:border-white/10"
                  )}
                  onClick={() => setSelectedEntry(entry)}
                >
                  {/* Decorative Color Bar on top of card */}
                  {colorData && (
                    <div 
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all duration-300"
                      style={{ backgroundColor: colorData.swatchHex }}
                    />
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          colorData ? `${colorData.accentBg} ${colorData.accentText}` : "bg-primary/10 text-primary"
                        )}
                      >
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                          {entry.title}
                          {colorData && (
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                              style={{ backgroundColor: colorData.swatchHex }}
                              title={`Color: ${colorData.name}`}
                            />
                          )}
                        </h3>
                        <p className={cn("text-xs font-bold uppercase tracking-widest", colorData ? colorData.accentText : "text-platinum/40")}>
                          {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-success">
                        <Smile className="w-3 h-3" /> {entry.mood}
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-warning">
                        <Zap className="w-3 h-3" /> {entry.energy}/10
                      </div>

                      {/* Action buttons (Always accessible, visible on hover/focus/touch) */}
                      <div className="flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity ml-2 relative">
                        {/* Note Color Button */}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setColorPickerEntryId(isColorPickerOpen ? null : entry.id);
                          }}
                          className={cn(
                            "journal-color-btn p-1.5 rounded-lg transition-colors cursor-pointer",
                            isColorPickerOpen
                              ? "bg-white/20 text-white"
                              : "hover:bg-white/10 text-platinum/50 hover:text-white"
                          )}
                          title="Choose Note Color"
                        >
                          <Palette className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEntry(entry);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-platinum/50 hover:text-primary transition-colors cursor-pointer"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEntryToDelete(entry);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-platinum/50 hover:text-error transition-colors cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Color Selection Popover */}
                        {isColorPickerOpen && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="journal-color-popover absolute right-0 top-full mt-2 z-40 p-4 bg-surface/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl w-64 md:w-72"
                          >
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                Choose Note Color
                              </span>
                              <button
                                type="button"
                                onClick={() => setColorPickerEntryId(null)}
                                className="text-platinum/40 hover:text-white transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <JournalColorSwatches
                              selectedColorId={entry.color}
                              onSelectColor={(newColor) => {
                                handleChangeColor(entry.id, newColor);
                                setColorPickerEntryId(null);
                              }}
                              showDefaultOption={true}
                              size="md"
                              showLabels={true}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-platinum/80 leading-relaxed mb-6 line-clamp-3 italic">
                    "{entry.content}"
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-platinum/50 bg-white/5 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <button className={cn("text-sm font-bold flex items-center gap-2 hover:underline cursor-pointer", colorData ? colorData.accentText : "text-primary")}>
                      Read Full Entry <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 glass-panel rounded-2xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <BookOpen className="w-8 h-8 text-primary opacity-40" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
                  {searchQuery ? "No entries match your search" : "Your journal is empty"}
                </h3>
                <p className="text-platinum/40 max-w-xs mx-auto text-sm">
                  {searchQuery ? "Try different keywords or clear your search." : "Start reflecting on your journey to gain clarity and track your mental growth."}
                </p>
              </div>
              {!searchQuery && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="btn-secondary py-2 px-6 text-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Write Your First Entry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateJournalEntryModal 
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingEntry(null);
            }}
            onSave={handleSaveEntry}
            editingEntry={editingEntry}
          />
        )}
      </AnimatePresence>

      {/* Full Entry Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedEntry(null);
                setIsFullModalColorPickerOpen(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative w-full max-w-3xl border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all duration-300",
                selectedColorData
                  ? `${selectedColorData.cardBg} ${selectedColorData.cardBorder} ${selectedColorData.glow} bg-surface/95 backdrop-blur-xl`
                  : "bg-surface border-white/10"
              )}
            >
              {/* Color Bar Accent on top */}
              {selectedColorData && (
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300"
                  style={{ backgroundColor: selectedColorData.swatchHex }}
                />
              )}

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", selectedColorData ? selectedColorData.accentText : "text-primary")}>
                      {new Date(selectedEntry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h2 className="text-3xl font-display font-bold text-white">{selectedEntry.title}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedEntry(null);
                      setIsFullModalColorPickerOpen(false);
                    }} 
                    className="p-2 hover:bg-white/5 rounded-full text-platinum/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm font-bold text-success">
                    <Smile className="w-4 h-4" /> Mood: {selectedEntry.mood}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm font-bold text-warning">
                    <Zap className="w-4 h-4" /> Energy: {selectedEntry.energy}/10
                  </div>
                  {selectedColorData && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm font-medium text-white/80">
                      <span 
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: selectedColorData.swatchHex }}
                      />
                      <span>Color: {selectedColorData.name}</span>
                    </div>
                  )}
                </div>

                <div className={cn(
                  "leading-relaxed text-lg whitespace-pre-wrap mb-10 italic border-l-4 pl-6",
                  selectedColorData 
                    ? `border-l-[${selectedColorData.swatchHex}] text-platinum/90` 
                    : "border-primary/20 text-platinum/80"
                )}
                style={{
                  borderLeftColor: selectedColorData ? selectedColorData.swatchHex : undefined
                }}
                >
                  {selectedEntry.content}
                </div>

                {selectedEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    {selectedEntry.tags.map((tag: string) => (
                      <span key={tag} className="text-xs font-bold uppercase tracking-widest text-platinum/40 bg-white/5 px-3 py-1.5 rounded-lg">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Inline Color Customizer inside Full View */}
                {isFullModalColorPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 p-5 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-widest text-platinum/70 mb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Choose Note Color
                    </h4>
                    <JournalColorSwatches
                      selectedColorId={selectedEntry.color}
                      onSelectColor={(newColor) => handleChangeColor(selectedEntry.id, newColor)}
                      showDefaultOption={true}
                      size="md"
                      showLabels={true}
                    />
                  </motion.div>
                )}
              </div>

              <div className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setIsFullModalColorPickerOpen(!isFullModalColorPickerOpen)}
                  className={cn(
                    "btn-secondary text-sm flex items-center gap-2 cursor-pointer",
                    isFullModalColorPickerOpen && "border-primary/40 bg-primary/10 text-white"
                  )}
                >
                  <Palette className="w-4 h-4" />
                  {isFullModalColorPickerOpen ? 'Hide Colors' : 'Change Color'}
                </button>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      handleEditEntry(selectedEntry);
                      setSelectedEntry(null);
                      setIsFullModalColorPickerOpen(false);
                    }}
                    className="btn-secondary cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setEntryToDelete(selectedEntry);
                    }}
                    className="btn-secondary text-error hover:bg-error/10 hover:border-error/20 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
