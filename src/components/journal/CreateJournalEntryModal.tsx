import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smile, Zap, Tag, Palette, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { JournalEntry } from '../../types';
import { JournalColorSwatches } from './JournalColorSwatches';
import { getJournalColor } from '../../lib/journalColorData';
import { readScopedJSON, writeScopedJSON, removeScopedKey } from '../../lib/storageSync';

interface CreateJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
  editingEntry?: JournalEntry | null;
}

export const CreateJournalEntryModal: React.FC<CreateJournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEntry
}) => {
  const [step, setStep] = useState<'write' | 'choose-color'>('write');
  const [title, setTitle] = useState(editingEntry?.title || '');
  const [content, setContent] = useState(editingEntry?.content || '');
  const [mood, setMood] = useState(editingEntry?.mood || 'Excellent');
  const [energy, setEnergy] = useState(editingEntry?.energy || 8);
  const [tags, setTags] = useState<string[]>(editingEntry?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(editingEntry?.color || '');

  useEffect(() => {
    if (!isOpen) return;
    if (editingEntry) {
      setTitle(editingEntry.title || '');
      setContent(editingEntry.content || '');
      setMood(editingEntry.mood || 'Excellent');
      setEnergy(editingEntry.energy || 8);
      setTags(editingEntry.tags || []);
      setSelectedColor(editingEntry.color || '');
    } else {
      const draft = readScopedJSON<Partial<JournalEntry> | null>('journal_draft', null);
      setTitle(draft?.title || '');
      setContent(draft?.content || '');
      setMood(draft?.mood || 'Excellent');
      setEnergy(draft?.energy || 8);
      setTags(Array.isArray(draft?.tags) ? draft!.tags! : []);
      setSelectedColor(draft?.color || '');
    }
    setStep('write');
  }, [editingEntry, isOpen]);

  // Persist unsaved new entry draft
  useEffect(() => {
    if (!isOpen || editingEntry) return;
    if (title || content || tags.length > 0 || selectedColor) {
      writeScopedJSON('journal_draft', {
        title,
        content,
        mood,
        energy,
        tags,
        color: selectedColor
      });
    }
  }, [isOpen, editingEntry, title, content, mood, energy, tags, selectedColor]);

  if (!isOpen) return null;

  // Called when user clicks "Save" from the write step
  const handleProceedToColor = () => {
    if (!title.trim() || !content.trim()) return;
    setStep('choose-color');
  };

  // Called to finalize save with chosen color (or skip)
  const finalizeSave = (colorToApply?: string) => {
    if (!title.trim() || !content.trim()) return;

    const entry: JournalEntry = {
      id: editingEntry?.id || `journal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: editingEntry?.date || new Date().toISOString(),
      title: title.trim(),
      content: content.trim(),
      mood,
      energy,
      tags,
      color: colorToApply !== undefined ? colorToApply : selectedColor,
      updatedAt: editingEntry ? new Date().toISOString() : undefined
    };

    if (!editingEntry) {
      removeScopedKey('journal_draft');
    }
    onSave(entry);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const previewColorData = getJournalColor(selectedColor);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
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
        className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto z-10"
      >
        <AnimatePresence mode="wait">
          {step === 'write' ? (
            <motion.div
              key="step-write"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-display font-bold text-white">
                      {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-platinum/50">Capture your reflection and track your state</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-platinum/40 hover:text-white transition-colors cursor-pointer touch-manipulation">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5 sm:space-y-6 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="How was your day?"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-platinum/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Mood</label>
                    <select 
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Excellent" className="bg-surface text-white">Excellent</option>
                      <option value="Great" className="bg-surface text-white">Great</option>
                      <option value="Good" className="bg-surface text-white">Good</option>
                      <option value="Neutral" className="bg-surface text-white">Neutral</option>
                      <option value="Low" className="bg-surface text-white">Low</option>
                      <option value="Tired" className="bg-surface text-white">Tired</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Energy Level ({energy}/10)</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={energy}
                      onChange={(e) => setEnergy(parseInt(e.target.value))}
                      className="w-full accent-primary mt-2 h-8 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Content</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your thoughts here..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all h-44 resize-none leading-relaxed placeholder:text-platinum/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">Tags</label>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add a tag..."
                      className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-platinum/30"
                    />
                    <button 
                      onClick={addTag}
                      className="px-4 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-all text-sm cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <div 
                        key={t}
                        className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-platinum/40"
                      >
                        #{t}
                        <button onClick={() => removeTag(t)} className="hover:text-error transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-white/5 flex gap-3 sm:gap-4 bg-white/5 shrink-0">
                <button onClick={onClose} className="btn-secondary flex-1 cursor-pointer">
                  Cancel
                </button>
                <button 
                  onClick={handleProceedToColor} 
                  disabled={!title.trim() || !content.trim()}
                  className={cn(
                    "btn-primary flex-1 cursor-pointer flex items-center justify-center gap-2",
                    (!title.trim() || !content.trim()) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Check className="w-4 h-4" />
                  {editingEntry ? 'Save Changes' : 'Save Entry'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-color"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <button 
                    onClick={() => setStep('write')}
                    className="p-2 hover:bg-white/10 rounded-full text-platinum/60 hover:text-white transition-colors cursor-pointer"
                    title="Back to entry"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2">
                      Choose Note Color ✨
                    </h2>
                    <p className="text-xs text-platinum/50">Personalize this note's appearance or keep default</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-platinum/40 hover:text-white transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                {/* Live Preview Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-platinum/40">
                      Live Preview
                    </label>
                    <span className="text-xs text-platinum/40">
                      {previewColorData ? previewColorData.name : 'Default Glass'}
                    </span>
                  </div>

                  <motion.div
                    layout
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                      previewColorData
                        ? `${previewColorData.cardBg} ${previewColorData.cardBorder} ${previewColorData.glow} backdrop-blur-md`
                        : "glass-panel border-white/10"
                    )}
                  >
                    {/* Color Accent Indicator Strip */}
                    {previewColorData && (
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: previewColorData.swatchHex }}
                      />
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-tight">{title}</h4>
                        <p className={cn("text-[11px] font-bold uppercase tracking-wider", previewColorData ? previewColorData.accentText : "text-platinum/40")}>
                          Today • {mood}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white/90">
                          {energy}/10 Energy
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-platinum/70 line-clamp-2 italic mb-3">
                      "{content}"
                    </p>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                        {tags.map((t) => (
                          <span key={t} className="text-[9px] font-bold uppercase tracking-wider text-platinum/50 bg-white/5 px-2 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Swatches Section */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Select a Palette Color
                    </h3>
                    <p className="text-xs text-platinum/50">
                      10 soft, premium colors designed for high contrast and readability.
                    </p>
                  </div>

                  <JournalColorSwatches
                    selectedColorId={selectedColor}
                    onSelectColor={(id) => setSelectedColor(id)}
                    showDefaultOption={true}
                    size="lg"
                    showLabels={true}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 bg-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => finalizeSave('')}
                  className="btn-secondary flex-1 py-3 text-sm cursor-pointer"
                >
                  Skip & Keep Default
                </button>
                <button
                  type="button"
                  onClick={() => finalizeSave(selectedColor)}
                  className="btn-primary flex-1 py-3 text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save with Color
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
