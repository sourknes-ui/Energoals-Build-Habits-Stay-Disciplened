import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Camera, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserProfile } from '../../types';
import { ChooseYourVibe } from './ChooseYourVibe';
import { getVibeById } from '../../lib/vibeData';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  setActiveTab: (tab: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  profile, 
  onSave, 
  setActiveTab 
}) => {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [vibe, setVibe] = useState(profile.vibe || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when profile or modal open state updates
  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setAvatar(profile.avatar || '');
      setVibe(profile.vibe || '');
    }
  }, [profile, isOpen]);

  const currentVibeInfo = getVibeById(vibe);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      ...profile, 
      name, 
      avatar, 
      vibe: vibe || undefined 
    });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-bg-dark/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-y-auto z-10 my-auto"
          >
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold text-white">Edit Profile</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-platinum/50 font-medium">Personality:</span>
                    {currentVibeInfo ? (
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 shadow-sm",
                        currentVibeInfo.badgeBg
                      )}>
                        <span>{currentVibeInfo.emoji}</span>
                        <span>{currentVibeInfo.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-platinum/50 italic inline-flex items-center gap-1">
                        <span>✨</span>
                        <span>Choose your vibe</span>
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full text-platinum/40 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 pt-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-inner">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-10 h-10 text-primary" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      capture="user"
                      className="hidden" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      title="Upload profile picture"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-platinum/40 font-bold uppercase tracking-widest">Profile Picture</p>
                </div>

                {/* Basic Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-base sm:text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Avatar URL (Optional)</label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-base sm:text-sm"
                    />
                  </div>
                </div>

                {/* FEATURE UPDATE: Choose Your Vibe Section */}
                <div className="pt-6 border-t border-white/10">
                  <ChooseYourVibe 
                    selectedVibe={vibe}
                    onSelectVibe={(v) => setVibe(v || '')}
                  />
                </div>

                {/* Advanced Profile Settings link */}
                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      onClose();
                      setActiveTab('settings');
                    }}
                    className="w-full py-3 text-xs font-bold text-primary uppercase tracking-widest border border-primary/20 rounded-xl hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    Advanced Profile Settings
                  </button>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 pt-4 border-t border-white/10 sticky bottom-0 bg-[#16161D]/90 backdrop-blur-md -mx-6 -mb-6 p-6 sm:-mx-8 sm:-mb-8 sm:p-8 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 btn-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
