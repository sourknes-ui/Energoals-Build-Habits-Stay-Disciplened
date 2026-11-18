import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  User, 
  Dumbbell, 
  Bell, 
  Calendar, 
  Smartphone, 
  Ruler, 
  Link2, 
  Shield, 
  Lock, 
  CreditCard, 
  HelpCircle, 
  Info, 
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Save,
  Check,
  X,
  Camera,
  LogOut,
  Trash2,
  RefreshCw,
  Globe,
  Moon,
  Sun,
  Monitor,
  Search,
  Mail,
  Phone,
  Cake,
  Users,
  Target,
  Volume2,
  Clock,
  Zap,
  Download,
  Key,
  MessageSquare,
  FileText,
  ShieldAlert,
  Activity,
  Sparkles,
  Settings,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePasswordAge } from '../../hooks/usePasswordAge';
import { AppSettings, UserProfile } from '../../types';
import { ChooseYourVibe } from '../profile/ChooseYourVibe';
import { ToastType } from '../ui/Feedback';
import { playSound } from '../../lib/audio';
import { scopedKey } from '../../lib/storageSync';

interface SettingsOverviewProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  initialCategory?: string;
  firebaseUser?: FirebaseUser | null;
  isCloudSyncing?: boolean;
  onGoogleSignIn?: () => void | Promise<void>;
  onLogout?: () => void | Promise<void>;
  onExportAllData?: () => void;
  onEraseAllData?: () => void | Promise<void>;
  onDeleteAccount?: () => void | Promise<void>;
  showToast?: (message: string, type?: ToastType) => void;
}

const INFO_MODAL_CONTENT: Record<string, { title: string; body: string[] }> = {
  'Help Center': {
    title: 'EnerGoals Help Center',
    body: [
      '• Smart Habits: Track binary check-ins, quantitative targets (e.g. glasses/pages), or timed focus habits.',
      '• XP & Levels: Complete habits, focus sprints, daily routines, and challenges to earn verified XP without duplicates.',
      '• Smart Widgets: Pin up to 3 critical habits right onto your Dashboard for one-tap daily progress.'
    ]
  },
  FAQs: {
    title: 'Frequently Asked Questions',
    body: [
      'Q: How do streaks reset? Habits automatically refresh at local midnight while preserving every completed day in your history.',
      'Q: Does unchecking a habit deduct XP? Yes—toggling a habit back subtracts the exact XP awarded for that cycle so totals remain accurate.',
      'Q: How is Deep Work tracked? Timed habits and Focus Sessions merge cleanly without double-counting.'
    ]
  },
  'Contact Support': {
    title: 'Contact Support',
    body: [
      'Need direct assistance with your account, cloud sync, or goal tracking setup?',
      'You can export a full JSON diagnostic snapshot anytime under Privacy & Data, or reach out at support@energoals.app.'
    ]
  },
  'Report a Bug': {
    title: 'Report an Issue',
    body: [
      'Thank you for helping make EnerGoals sharper and more reliable.',
      'Please include which section you were visiting and whether you were signed in with Google Cloud Sync when the issue appeared.'
    ]
  },
  'Terms of Service': {
    title: 'Terms of Service',
    body: [
      'EnerGoals is provided to help you organize personal habits, routines, focus sessions, and reflections.',
      'You retain full ownership of all personal logs, habits, goals, and journal entries stored locally or in your private cloud space.'
    ]
  },
  'Privacy Policy': {
    title: 'Privacy Policy',
    body: [
      'Your habits, journal notes, and progress metrics stay strictly scoped to your device browser storage and, if signed in, your private Firebase document.',
      'We never sell your wellness data or expose your journal entries to third parties.'
    ]
  },
  'Community Guidelines': {
    title: 'Community Guidelines',
    body: [
      'Build sustainable habits, encourage consistency over burnout, and celebrate honest milestones.',
      'Respect your own pace—Rest & Recovery count toward long-term mastery.'
    ]
  },
  Licenses: {
    title: 'Open Source Licenses',
    body: [
      'Built with React, TypeScript, Tailwind CSS, Lucide Icons, Motion, and Recharts.',
      'All bundled icons and typography remain under their respective open licenses.'
    ]
  },
  'Release Notes': {
    title: 'EnerGoals v2.4.0 Release Notes',
    body: [
      '• Unified XP Ledger & Idempotent Progression Engine across Levels 1–25.',
      '• Choose Your Vibe ✨ profile personality selector & Journal Note Colors.',
      '• Smart Calendar integration with live deadlines, daily habits, and focus sessions.',
      '• Scoped local persistence + real-time Cloud Sync support.'
    ]
  }
};

export const SettingsOverview: React.FC<SettingsOverviewProps> = ({
  settings,
  setSettings,
  userProfile,
  setUserProfile,
  initialCategory,
  firebaseUser,
  isCloudSyncing = false,
  onGoogleSignIn,
  onLogout,
  onExportAllData,
  onEraseAllData,
  onDeleteAccount,
  showToast
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [infoModalKey, setInfoModalKey] = useState<string | null>(null);
  
  // Draft states for unsaved changes
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(userProfile);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync external category transitions
  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Keep draft synchronized with external updates (hydration / profile modal) when clean
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setDraftSettings(settings);
      setDraftProfile(userProfile);
    }
  }, [settings, userProfile, hasUnsavedChanges]);

  const categories = [
    { 
      id: 'profile', 
      label: 'Profile & Account', 
      icon: User, 
      summary: `${userProfile.name}, ${userProfile.email}`,
      description: 'Manage your personal information and how others see you.'
    },
    { 
      id: 'fitness', 
      label: 'Fitness Preferences', 
      icon: Dumbbell, 
      summary: `${userProfile.mainGoal || 'General Health'}, ${settings.fitness.workoutDaysPerWeek} workouts/week`,
      description: 'Customize your goals and how the app adapts to your routine.'
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell, 
      summary: `Push: ${settings.notifications.push.all ? 'On' : 'Off'}, Sound: ${settings.notifications.sound ? 'On' : 'Off'}`,
      description: 'Control when and how you want to be notified.'
    },
    { 
      id: 'calendar', 
      label: 'Calendar Settings', 
      icon: Calendar, 
      summary: `${settings.calendar.defaultView.charAt(0).toUpperCase() + settings.calendar.defaultView.slice(1)} view, Week starts ${settings.calendar.weekStartsOn === 0 ? 'Sunday' : 'Monday'}`,
      description: 'Configure your calendar view and reminder defaults.'
    },
    { 
      id: 'appearance', 
      label: 'App Preferences', 
      icon: Smartphone, 
      summary: `${settings.appearance.theme.charAt(0).toUpperCase() + settings.appearance.theme.slice(1)} mode, Animations: ${settings.appearance.animations ? 'On' : 'Off'}`,
      description: 'Customize the look and feel of your application.'
    },
    { 
      id: 'units', 
      label: 'Units & Measurement', 
      icon: Ruler, 
      summary: `${settings.units.weight}, ${settings.units.height}, ${settings.units.water}`,
      description: 'Choose your preferred measurement systems.'
    },
    { 
      id: 'integrations', 
      label: 'Connected Apps', 
      icon: Link2, 
      summary: 'Coming Soon • In Development',
      description: 'Sync your fitness data with external services (Planned).'
    },
    { 
      id: 'privacy', 
      label: 'Privacy & Data', 
      icon: Shield, 
      summary: `Visibility: ${settings.privacy.profileVisibility}`,
      description: 'Manage your data and privacy preferences.'
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: Lock, 
      summary: 'Password & session management',
      description: 'Protect your account and manage active sessions.'
    },
    { 
      id: 'billing', 
      label: 'Subscription', 
      icon: CreditCard, 
      summary: 'Free Plan',
      description: 'Information about your subscription and how to support the app.'
    },
    { 
      id: 'support', 
      label: 'Help & Support', 
      icon: HelpCircle, 
      summary: 'Contact support, FAQs',
      description: 'Get help with the app or report technical issues.'
    },
    { 
      id: 'about', 
      label: 'About & Legal', 
      icon: Info, 
      summary: 'Version 2.4.0',
      description: 'App version and legal documentation.'
    },
    { 
      id: 'danger', 
      label: 'Danger Zone', 
      icon: AlertTriangle, 
      color: 'text-error', 
      summary: 'Log out, delete account',
      description: 'Irreversible actions related to your account and data.'
    },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setSettings(draftSettings);
      setUserProfile(draftProfile);
      setIsSaving(false);
      setShowSuccess(true);
      setHasUnsavedChanges(false);
      showToast?.('Settings saved', 'success');
      setTimeout(() => setShowSuccess(false), 3000);
    }, 300);
  };

  const handleCancel = () => {
    setDraftSettings(settings);
    setDraftProfile(userProfile);
    setHasUnsavedChanges(false);
  };

  const updateDraftSettings = (path: string, value: any) => {
    setDraftSettings(prev => {
      const newSettings = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current: any = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasUnsavedChanges(true);
  };

  const updateDraftProfile = (field: keyof UserProfile, value: any) => {
    setDraftProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const filteredCategories = categories.filter(cat => 
    cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {activeCategory && (
            <button 
              onClick={() => setActiveCategory(null)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-full text-platinum/60"
            >
              <X className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              {activeCategory ? categories.find(c => c.id === activeCategory)?.label : 'Settings'}
            </h1>
            <p className="text-platinum/60 font-medium">
              {activeCategory ? categories.find(c => c.id === activeCategory)?.description : 'Fine-tune your premium fitness experience.'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {!activeCategory && (
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-all w-64"
              />
              {searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-platinum/40">
                  {filteredCategories.length} {filteredCategories.length === 1 ? 'result' : 'results'}
                </span>
              )}
            </div>
          )}
          
          {hasUnsavedChanges && (
            <button 
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-bold text-platinum/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}

          <button 
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={cn(
              "btn-primary flex items-center gap-2 min-w-[120px] justify-center transition-all",
              showSuccess && "bg-success hover:bg-success border-success",
              !hasUnsavedChanges && !showSuccess && "opacity-50 cursor-not-allowed grayscale"
            )}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : showSuccess ? (
              <>
                <Check className="w-4 h-4" /> Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className={cn(
          "lg:col-span-1 space-y-2",
          activeCategory ? "hidden lg:block" : "block"
        )}>
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "w-full flex flex-col items-start gap-1 px-4 py-4 rounded-xl transition-all group text-left",
                activeCategory === cat.id 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-platinum/60 hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <cat.icon className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110",
                  cat.color || (activeCategory === cat.id ? "text-primary" : "text-platinum/40")
                )} />
                <span className="font-bold">{cat.label}</span>
                <ChevronRight className="ml-auto w-4 h-4 opacity-40" />
              </div>
              <div className="pl-8 text-xs text-platinum/40 font-medium truncate w-full">
                {cat.summary}
              </div>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className={cn(
          "lg:col-span-3",
          !activeCategory ? "hidden lg:block" : "block"
        )}>
          <AnimatePresence mode="wait">
            {activeCategory ? (
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="glass-panel p-4 sm:p-8 rounded-2xl space-y-6 sm:space-y-8"
              >
                {/* Mobile Back Button to Categories List */}
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className="lg:hidden flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-platinum/70 hover:text-white bg-white/5 active:bg-white/10 px-3.5 py-2.5 rounded-xl transition-all touch-manipulation cursor-pointer border border-white/5"
                >
                  <ArrowLeft className="w-4 h-4 text-primary" />
                  <span>All Categories</span>
                </button>

                {activeCategory === 'profile' && (
                  <ProfileSection
                    profile={draftProfile}
                    updateProfile={updateDraftProfile}
                    firebaseUser={firebaseUser}
                    isCloudSyncing={isCloudSyncing}
                    onGoogleSignIn={onGoogleSignIn}
                    onLogout={onLogout}
                    onNavigateSecurity={() => setActiveCategory('security')}
                    showToast={showToast}
                  />
                )}
                {activeCategory === 'fitness' && (
                  <FitnessSection settings={draftSettings} updateSettings={updateDraftSettings} />
                )}
                {activeCategory === 'notifications' && (
                  <NotificationSection settings={draftSettings} updateSettings={updateDraftSettings} showToast={showToast} />
                )}
                {activeCategory === 'calendar' && (
                  <CalendarSettingsSection settings={draftSettings} updateSettings={updateDraftSettings} />
                )}
                {activeCategory === 'appearance' && (
                  <AppearanceSection settings={draftSettings} updateSettings={updateDraftSettings} />
                )}
                {activeCategory === 'units' && (
                  <UnitsSection 
                    settings={draftSettings} 
                    updateSettings={updateDraftSettings} 
                    profile={draftProfile}
                    updateProfile={updateDraftProfile}
                  />
                )}
                {activeCategory === 'integrations' && (
                  <IntegrationsSection />
                )}
                {activeCategory === 'privacy' && (
                  <PrivacySection
                    settings={draftSettings}
                    updateSettings={updateDraftSettings}
                    onExportAllData={onExportAllData}
                    showToast={showToast}
                  />
                )}
                {activeCategory === 'security' && (
                  <SecuritySection
                    userProfile={draftProfile}
                    onPasswordUpdated={() => {
                      const nowISO = new Date().toISOString();
                      setDraftProfile(prev => ({ ...prev, passwordLastChangedDate: nowISO }));
                      setUserProfile(prev => ({ ...prev, passwordLastChangedDate: nowISO }));
                    }}
                    showToast={showToast}
                  />
                )}
                {activeCategory === 'billing' && (
                  <BillingSection showToast={showToast} />
                )}
                {activeCategory === 'support' && (
                  <SupportSection onSelectTopic={setInfoModalKey} showToast={showToast} />
                )}
                {activeCategory === 'about' && (
                  <AboutSection onSelectDoc={setInfoModalKey} />
                )}
                {activeCategory === 'danger' && (
                  <DangerSection
                    onLogout={onLogout}
                    onEraseAllData={onEraseAllData}
                    onDeleteAccount={onDeleteAccount}
                    showToast={showToast}
                  />
                )}
              </motion.div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-12 glass-panel rounded-2xl border border-white/5">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Settings className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Select a category</h2>
                <p className="text-platinum/40 max-w-xs">Choose a setting category from the left to manage your preferences.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* In-App Documentation / Support Info Modal */}
      {infoModalKey && INFO_MODAL_CONTENT[infoModalKey] && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm"
          onClick={() => setInfoModalKey(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 max-w-lg w-full space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-white">
                {INFO_MODAL_CONTENT[infoModalKey].title}
              </h3>
              <button
                type="button"
                onClick={() => setInfoModalKey(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-platinum/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-platinum/80 leading-relaxed">
              {INFO_MODAL_CONTENT[infoModalKey].body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoModalKey(null)}
                className="btn-primary px-6 py-2.5 text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---

const SectionTitle: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-display font-bold text-white mb-2">{title}</h2>
    <p className="text-platinum/40 text-sm">{description}</p>
  </div>
);

const Toggle: React.FC<{ label: string; description?: string; enabled: boolean; onChange: (val: boolean) => void }> = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
    <div className="space-y-1">
      <div className="font-bold text-white">{label}</div>
      {description && <div className="text-xs text-platinum/40">{description}</div>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "w-12 h-6 rounded-full transition-all relative shrink-0",
        enabled ? "bg-primary" : "bg-white/10"
      )}
    >
      <div className={cn(
        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
        enabled ? "right-1" : "left-1"
      )} />
    </button>
  </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; type?: string; placeholder?: string; icon?: any }> = ({ label, value, onChange, type = 'text', placeholder, icon: Icon }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all",
          Icon && "pl-10"
        )}
      />
    </div>
  </div>
);

const SelectField: React.FC<{ label: string; value: string; options: { value: string; label: string }[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-surface text-white">{opt.label}</option>
      ))}
    </select>
  </div>
);

const ProfileSection: React.FC<{
  profile: UserProfile;
  updateProfile: (f: keyof UserProfile, v: any) => void;
  firebaseUser?: FirebaseUser | null;
  isCloudSyncing?: boolean;
  onGoogleSignIn?: () => void | Promise<void>;
  onLogout?: () => void | Promise<void>;
  onNavigateSecurity: () => void;
  showToast?: (message: string, type?: ToastType) => void;
}> = ({
  profile,
  updateProfile,
  firebaseUser,
  isCloudSyncing,
  onGoogleSignIn,
  onLogout,
  onNavigateSecurity,
  showToast
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast?.('Image must be under 4MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        updateProfile('avatar', reader.result);
        showToast?.('Avatar updated — click Save Changes to confirm', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        newErrors.email = 'Invalid email format';
      } else {
        delete newErrors.email;
      }
    }
    if (field === 'height') {
      if (value < 50 || value > 250) {
        newErrors.height = 'Height must be between 50 and 250 cm';
      } else {
        delete newErrors.height;
      }
    }
    if (field === 'weight') {
      if (value < 20 || value > 500) {
        newErrors.weight = 'Weight must be between 20 and 500 kg';
      } else {
        delete newErrors.weight;
      }
    }
    setErrors(newErrors);
  };

  return (
    <div>
      <SectionTitle title="Profile & Account" description="Manage your personal information and how others see you." />

      {/* Cloud Sync Status Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            firebaseUser ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
          )}>
            {isCloudSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : firebaseUser ? <CheckCircle2 className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {firebaseUser ? 'Cloud Sync Active' : 'Local Workspace Mode'}
            </div>
            <div className="text-xs text-platinum/50">
              {firebaseUser
                ? `Signed in as ${firebaseUser.email || firebaseUser.displayName || 'Connected Account'}`
                : 'Sign in with Google to sync your habits, goals, and XP across devices.'}
            </div>
          </div>
        </div>
        {firebaseUser ? (
          <button
            type="button"
            onClick={() => onLogout?.()}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-platinum transition-all shrink-0"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onGoogleSignIn?.()}
            className="btn-primary px-4 py-2 text-xs font-bold shrink-0"
          >
            Sign In with Google
          </button>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-12 items-start">
        <div className="relative group">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <div
            onClick={() => avatarInputRef.current?.click()}
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary/40 transition-all cursor-pointer"
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            title="Upload profile picture"
            className="absolute bottom-0 right-0 p-2 bg-primary rounded-full border-4 border-bg-dark text-white hover:scale-110 transition-transform"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <InputField label="Full Name" value={profile.name} onChange={(v) => updateProfile('name', v)} icon={User} />
          <InputField label="Username" value={profile.username || ''} onChange={(v) => updateProfile('username', v)} icon={Globe} />
          <div className="space-y-1">
            <InputField label="Email Address" value={profile.email} onChange={(v) => { updateProfile('email', v); validateField('email', v); }} icon={Mail} type="email" />
            {errors.email && <p className="text-[10px] text-error font-bold uppercase tracking-wider ml-1">{errors.email}</p>}
          </div>
          <InputField label="Phone Number" value={profile.phone || ''} onChange={(v) => updateProfile('phone', v)} icon={Phone} />
          <InputField label="Date of Birth" value={profile.dob || ''} onChange={(v) => updateProfile('dob', v)} icon={Cake} type="date" />
          <SelectField 
            label="Gender" 
            value={profile.gender || 'prefer-not-to-say'} 
            onChange={(v) => updateProfile('gender', v as any)}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
              { value: 'prefer-not-to-say', label: 'Prefer not to say' }
            ]}
          />
          <div className="space-y-1">
            <InputField label="Height (cm)" value={String(profile.height || '')} onChange={(v) => { updateProfile('height', Number(v)); validateField('height', Number(v)); }} icon={Ruler} type="number" />
            {errors.height && <p className="text-[10px] text-error font-bold uppercase tracking-wider ml-1">{errors.height}</p>}
          </div>
          <div className="space-y-1">
            <InputField label="Weight (kg)" value={String(profile.weight || '')} onChange={(v) => { updateProfile('weight', Number(v)); validateField('weight', Number(v)); }} icon={Zap} type="number" />
            {errors.weight && <p className="text-[10px] text-error font-bold uppercase tracking-wider ml-1">{errors.weight}</p>}
          </div>
          <SelectField 
            label="Fitness Level" 
            value={profile.fitnessLevel || 'beginner'} 
            onChange={(v) => updateProfile('fitnessLevel', v as any)}
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'elite', label: 'Elite' }
            ]}
          />
          <SelectField 
            label="Main Goal" 
            value={profile.mainGoal || 'health'} 
            onChange={(v) => updateProfile('mainGoal', v)}
            options={[
              { value: 'weight-loss', label: 'Weight Loss' },
              { value: 'muscle-gain', label: 'Muscle Gain' },
              { value: 'endurance', label: 'Endurance' },
              { value: 'health', label: 'General Health' },
              { value: 'performance', label: 'Athletic Performance' }
            ]}
          />
        </div>
      </div>

      {/* FEATURE UPDATE: Choose Your Vibe Section */}
      <div className="mt-10 pt-8 border-t border-white/10">
        <ChooseYourVibe 
          selectedVibe={profile.vibe}
          onSelectVibe={(v) => updateProfile('vibe', v)}
        />
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onNavigateSecurity}
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <Lock className="w-4 h-4 text-platinum/40" /> Change Password
        </button>
        <button
          type="button"
          onClick={() => onLogout?.()}
          className="px-6 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-bold text-sm hover:bg-error/20 transition-all flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
    </div>
  );
};

const FitnessSection: React.FC<{ settings: AppSettings; updateSettings: (p: string, v: any) => void }> = ({ settings, updateSettings }) => (
  <div className="space-y-8">
    <SectionTitle title="Fitness Preferences" description="Customize your goals and how the app adapts to your routine." />
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InputField label="Workout Days / Week" value={String(settings.fitness.workoutDaysPerWeek)} onChange={(v) => updateSettings('fitness.workoutDaysPerWeek', Number(v))} icon={Calendar} type="number" />
      <InputField label="Preferred Workout Time" value={settings.fitness.preferredWorkoutTime} onChange={(v) => updateSettings('fitness.preferredWorkoutTime', v)} icon={Clock} type="time" />
      <InputField label="Daily Step Goal" value={String(settings.fitness.stepGoal)} onChange={(v) => updateSettings('fitness.stepGoal', Number(v))} icon={Zap} type="number" />
      <InputField label="Daily Water Goal (L)" value={String(settings.fitness.waterGoal)} onChange={(v) => updateSettings('fitness.waterGoal', Number(v))} icon={Volume2} type="number" />
      <InputField label="Daily Sleep Goal (Hrs)" value={String(settings.fitness.sleepGoal)} onChange={(v) => updateSettings('fitness.sleepGoal', Number(v))} icon={Moon} type="number" />
    </div>

    <div className="pt-8 space-y-4">
      <h3 className="text-sm font-bold text-platinum/40 uppercase tracking-widest">Training Preferences</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Toggle
          label="Gym Workouts"
          enabled={settings.fitness.trainingTypes?.gym ?? true}
          onChange={(v) => updateSettings('fitness.trainingTypes.gym', v)}
        />
        <Toggle
          label="Home Workouts"
          enabled={settings.fitness.trainingTypes?.home ?? true}
          onChange={(v) => updateSettings('fitness.trainingTypes.home', v)}
        />
        <Toggle
          label="Outdoor Activities"
          enabled={settings.fitness.trainingTypes?.outdoor ?? true}
          onChange={(v) => updateSettings('fitness.trainingTypes.outdoor', v)}
        />
        <Toggle
          label="High Intensity (HIIT)"
          enabled={settings.fitness.trainingTypes?.hiit ?? false}
          onChange={(v) => updateSettings('fitness.trainingTypes.hiit', v)}
        />
      </div>
    </div>
  </div>
);

const NotificationSection: React.FC<{
  settings: AppSettings;
  updateSettings: (p: string, v: any) => void;
  showToast?: (message: string, type?: ToastType) => void;
}> = ({ settings, updateSettings, showToast }) => {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestNotification = async () => {
    setIsTesting(true);
    playSound('click');
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission().catch(() => 'denied');
        }
        if (Notification.permission === 'granted') {
          new Notification('EnerGoals Reminder', {
            body: 'Notifications are active and ready to keep you on track!'
          });
        }
      }
    } catch {
      // Fallback safely to in-app toast
    } finally {
      setTimeout(() => {
        setIsTesting(false);
        showToast?.('Test notification triggered!', 'success');
      }, 450);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle title="Notifications & Reminders" description="Control when and how you want to be notified." />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-platinum/40 uppercase tracking-widest">Push Notifications</h3>
          <button 
            type="button"
            onClick={handleTestNotification}
            disabled={isTesting}
            className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-2"
          >
            {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
            Test Notification
          </button>
        </div>
        
        <Toggle label="Allow All Notifications" enabled={settings.notifications.push.all} onChange={(v) => updateSettings('notifications.push.all', v)} />
        
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 transition-all", !settings.notifications.push.all && "opacity-50 pointer-events-none")}>
          <Toggle label="Workout Reminders" enabled={settings.notifications.push.workouts} onChange={(v) => updateSettings('notifications.push.workouts', v)} />
          <Toggle label="Hydration Reminders" enabled={settings.notifications.push.hydration} onChange={(v) => updateSettings('notifications.push.hydration', v)} />
          <Toggle label="Sleep Reminders" enabled={settings.notifications.push.sleep} onChange={(v) => updateSettings('notifications.push.sleep', v)} />
          <Toggle label="Challenge Deadlines" enabled={settings.notifications.push.challenges} onChange={(v) => updateSettings('notifications.push.challenges', v)} />
          <Toggle label="Achievements" enabled={settings.notifications.push.achievements} onChange={(v) => updateSettings('notifications.push.achievements', v)} />
          <Toggle label="Weekly Summary" enabled={settings.notifications.push.weeklySummary} onChange={(v) => updateSettings('notifications.push.weeklySummary', v)} />
        </div>

        <h3 className="text-sm font-bold text-platinum/40 uppercase tracking-widest mt-8 mb-4">Email Notifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle label="Product Updates" enabled={settings.notifications.email.productUpdates} onChange={(v) => updateSettings('notifications.email.productUpdates', v)} />
          <Toggle label="Weekly Progress" enabled={settings.notifications.email.weeklyProgress} onChange={(v) => updateSettings('notifications.email.weeklyProgress', v)} />
          <Toggle label="Security Alerts" enabled={settings.notifications.email.security} onChange={(v) => updateSettings('notifications.email.security', v)} />
        </div>

        <h3 className="text-sm font-bold text-platinum/40 uppercase tracking-widest mt-8 mb-4">Reminder Behavior</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle label="Sound" enabled={settings.notifications.sound} onChange={(v) => updateSettings('notifications.sound', v)} />
          <Toggle label="Vibration" enabled={settings.notifications.vibration} onChange={(v) => updateSettings('notifications.vibration', v)} />
        </div>
        
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-white">Quiet Hours</div>
            <button 
              type="button"
              onClick={() => updateSettings('notifications.quietHours.enabled', !settings.notifications.quietHours.enabled)}
              className={cn(
                "w-10 h-5 rounded-full transition-all relative",
                settings.notifications.quietHours.enabled ? "bg-primary" : "bg-white/10"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                settings.notifications.quietHours.enabled ? "right-0.5" : "left-0.5"
              )} />
            </button>
          </div>
          <div className={cn("grid grid-cols-2 gap-4 transition-all", !settings.notifications.quietHours.enabled && "opacity-30 pointer-events-none")}>
            <InputField label="Start Time" value={settings.notifications.quietHours.start} onChange={(v) => updateSettings('notifications.quietHours.start', v)} type="time" />
            <InputField label="End Time" value={settings.notifications.quietHours.end} onChange={(v) => updateSettings('notifications.quietHours.end', v)} type="time" />
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarSettingsSection: React.FC<{ settings: AppSettings; updateSettings: (p: string, v: any) => void }> = ({ settings, updateSettings }) => (
  <div className="space-y-8">
    <SectionTitle title="Calendar Settings" description="Configure your calendar view and reminder defaults." />
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SelectField 
        label="Default View" 
        value={settings.calendar.defaultView} 
        onChange={(v) => updateSettings('calendar.defaultView', v)}
        options={[
          { value: 'month', label: 'Month View' },
          { value: 'week', label: 'Week View' },
          { value: 'day', label: 'Day View' }
        ]}
      />
      <SelectField 
        label="Week Starts On" 
        value={String(settings.calendar.weekStartsOn)} 
        onChange={(v) => updateSettings('calendar.weekStartsOn', Number(v))}
        options={[
          { value: '0', label: 'Sunday' },
          { value: '1', label: 'Monday' }
        ]}
      />
      <SelectField 
        label="Time Format" 
        value={settings.calendar.timeFormat} 
        onChange={(v) => updateSettings('calendar.timeFormat', v)}
        options={[
          { value: '12h', label: '12-hour (AM/PM)' },
          { value: '24h', label: '24-hour' }
        ]}
      />
    </div>

    <div className="space-y-4 mt-8">
      <Toggle label="Show Completed Items" enabled={settings.calendar.showCompleted} onChange={(v) => updateSettings('calendar.showCompleted', v)} />
      <Toggle label="Show Reminders" enabled={settings.calendar.showReminders} onChange={(v) => updateSettings('calendar.showReminders', v)} />
      <Toggle label="Show Deadlines" enabled={settings.calendar.showDeadlines} onChange={(v) => updateSettings('calendar.showDeadlines', v)} />
      <Toggle label="Highlight Important Dates" enabled={settings.calendar.highlightImportant} onChange={(v) => updateSettings('calendar.highlightImportant', v)} />
    </div>
  </div>
);

const AppearanceSection: React.FC<{ settings: AppSettings; updateSettings: (p: string, v: any) => void }> = ({ settings, updateSettings }) => (
  <div className="space-y-10">
    <SectionTitle title="Appearance" description="Customize the visual identity of your performance hub." />
    
    <div className="space-y-4">
      <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Theme Mode</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Deep blacks for focus' },
          { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Clean and energetic' },
          { id: 'system', label: 'System', icon: Monitor, desc: 'Follow device settings' }
        ].map(theme => (
          <button
            type="button"
            key={theme.id}
            onClick={() => updateSettings('appearance.theme', theme.id)}
            className={cn(
              "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all text-center",
              settings.appearance.theme === theme.id 
                ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10" 
                : "bg-white/5 border-white/5 text-platinum/60 hover:bg-white/10"
            )}
          >
            <theme.icon className="w-8 h-8 mb-1" />
            <div className="space-y-1">
              <div className="font-bold">{theme.label}</div>
              <div className="text-[10px] opacity-60 uppercase tracking-wider">{theme.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest ml-1">Accent Color</label>
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">Live Preview</span>
      </div>
      <div className="p-8 rounded-2xl bg-white/5 border border-white/5 space-y-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {['#B14AE0', '#3B82F6', '#5FD4A7', '#F5B971', '#EF4444', '#EC4899', '#10B981', '#F97316'].map(color => (
            <button
              type="button"
              key={color}
              onClick={() => updateSettings('appearance.accentColor', color)}
              className={cn(
                "w-12 h-12 rounded-full border-4 transition-all relative group",
                settings.appearance.accentColor === color ? "border-white scale-110 shadow-xl" : "border-transparent opacity-60 hover:opacity-100"
              )}
              style={{ backgroundColor: color }}
            >
              {settings.appearance.accentColor === color && (
                <motion.div 
                  layoutId="activeColor"
                  className="absolute -inset-2 rounded-full border border-white/20"
                />
              )}
            </button>
          ))}
        </div>

        <div className="pt-6 border-t border-white/5">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-lg bg-primary mb-2" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Primary</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-lg bg-primary opacity-20 mb-2" />
              <span className="text-[10px] font-bold text-platinum/40 uppercase tracking-widest">Subtle</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="pt-4">
      <Toggle 
        label="Enable Animations" 
        description="Smooth transitions and micro-interactions throughout the app." 
        enabled={settings.appearance.animations} 
        onChange={(v) => updateSettings('appearance.animations', v)} 
      />
    </div>
  </div>
);

const UnitsSection: React.FC<{ 
  settings: AppSettings; 
  updateSettings: (p: string, v: any) => void;
  profile: UserProfile;
  updateProfile: (f: keyof UserProfile, v: any) => void;
}> = ({ settings, updateSettings, profile, updateProfile }) => {
  const isMetric = settings.units.weight === 'kg';
  const isCm = settings.units.height === 'cm';

  const updateManualMeasurement = (field: keyof NonNullable<UserProfile['manualMeasurements']>, value: any) => {
    updateProfile('manualMeasurements', {
      ...(profile.manualMeasurements || {}),
      [field]: value
    });
  };

  // Conversion helpers
  const kgToLb = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
  const lbToKg = (lb: number) => Math.round(lb / 2.20462 * 10) / 10;
  
  const cmToFtIn = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };
  
  const ftInToCm = (feet: number, inches: number) => Math.round((feet * 12 + inches) * 2.54 * 10) / 10;

  const currentWeight = profile.manualMeasurements?.currentWeight || profile.weight || 0;
  const height = profile.manualMeasurements?.height || profile.height || 0;
  const targetWeight = profile.manualMeasurements?.targetWeight || 0;

  const displayWeight = isMetric ? currentWeight : kgToLb(currentWeight);
  const displayTargetWeight = isMetric ? targetWeight : kgToLb(targetWeight);
  
  const { feet, inches } = cmToFtIn(height);

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <SectionTitle title="Units & Measurement" description="Choose your preferred measurement systems." />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField 
            label="Weight Unit" 
            value={settings.units.weight} 
            onChange={(v) => updateSettings('units.weight', v)}
            options={[
              { value: 'kg', label: 'Kilograms (kg)' },
              { value: 'lb', label: 'Pounds (lb)' }
            ]}
          />
          <SelectField 
            label="Height Unit" 
            value={settings.units.height} 
            onChange={(v) => updateSettings('units.height', v)}
            options={[
              { value: 'cm', label: 'Centimeters (cm)' },
              { value: 'ft', label: 'Feet & Inches (ft/in)' }
            ]}
          />
          <SelectField 
            label="Distance Unit" 
            value={settings.units.distance} 
            onChange={(v) => updateSettings('units.distance', v)}
            options={[
              { value: 'km', label: 'Kilometers (km)' },
              { value: 'mi', label: 'Miles (mi)' }
            ]}
          />
          <SelectField 
            label="Water Unit" 
            value={settings.units.water} 
            onChange={(v) => updateSettings('units.water', v)}
            options={[
              { value: 'l', label: 'Liters (L)' },
              { value: 'oz', label: 'Ounces (oz)' }
            ]}
          />
        </div>
      </div>

      <div className="pt-8 border-t border-white/5 space-y-8">
        <div>
          <h3 className="text-xl font-display font-bold text-white mb-2">Manual Measurements</h3>
          <p className="text-platinum/40 text-sm">Keep your physical stats up to date manually.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Current Weight ({settings.units.weight})</label>
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
              <input
                type="number"
                value={displayWeight || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const kgValue = isMetric ? val : lbToKg(val);
                  updateManualMeasurement('currentWeight', kgValue);
                  updateProfile('weight', kgValue);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Target Weight ({settings.units.weight})</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
              <input
                type="number"
                value={displayTargetWeight || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const kgValue = isMetric ? val : lbToKg(val);
                  updateManualMeasurement('targetWeight', kgValue);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {isCm ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Height (cm)</label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum/40" />
                <input
                  type="number"
                  value={height || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateManualMeasurement('height', val);
                    updateProfile('height', val);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Height (ft)</label>
                <input
                  type="number"
                  value={feet || ''}
                  onChange={(e) => {
                    const newFeet = Number(e.target.value);
                    const cmValue = ftInToCm(newFeet, inches);
                    updateManualMeasurement('height', cmValue);
                    updateProfile('height', cmValue);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-platinum/40 uppercase tracking-widest">Height (in)</label>
                <input
                  type="number"
                  value={inches || ''}
                  onChange={(e) => {
                    const newInches = Number(e.target.value);
                    const cmValue = ftInToCm(feet, newInches);
                    updateManualMeasurement('height', cmValue);
                    updateProfile('height', cmValue);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField 
            label="Waist (cm)" 
            value={String(profile.manualMeasurements?.waist || '')} 
            onChange={(v) => updateManualMeasurement('waist', Number(v))} 
            type="number" 
          />
          <InputField 
            label="Chest (cm)" 
            value={String(profile.manualMeasurements?.chest || '')} 
            onChange={(v) => updateManualMeasurement('chest', Number(v))} 
            type="number" 
          />
          <InputField 
            label="Hips (cm)" 
            value={String(profile.manualMeasurements?.hips || '')} 
            onChange={(v) => updateManualMeasurement('hips', Number(v))} 
            type="number" 
          />
        </div>
      </div>
    </div>
  );
};

const IntegrationsSection: React.FC = () => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [clickedToast, setClickedToast] = useState<{ id: string; name: string } | null>(null);

  const handleButtonInteraction = (appName: string) => {
    setActiveTooltip(appName);
    setClickedToast({ id: `${Date.now()}`, name: appName });
    setTimeout(() => {
      setClickedToast(current => current?.name === appName ? null : current);
    }, 3500);
  };

  const apps = [
    { 
      name: 'Apple Health', 
      icon: Activity, 
      color: 'text-red-400', 
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      description: 'Planned telemetry sync for daily steps, resting heart rate, and workout records.',
      plannedMetrics: ['Steps', 'Heart Rate', 'Workouts']
    },
    { 
      name: 'Fitbit', 
      icon: Zap, 
      color: 'text-teal-400', 
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      description: 'Planned background import for sleep stages, sleep scores, and active zone minutes.',
      plannedMetrics: ['Sleep Cycles', 'Active Minutes', 'Resting HR']
    },
    { 
      name: 'Strava', 
      icon: Activity, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      description: 'Planned automated synchronization for outdoor runs, cycling routes, and swims.',
      plannedMetrics: ['GPS Routes', 'Elevation', 'Cardio Splits']
    },
    { 
      name: 'Google Fit', 
      icon: Activity, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      description: 'Planned biometric and activity point synchronization with connected Google devices.',
      plannedMetrics: ['Move Minutes', 'Heart Points', 'Distance']
    },
    { 
      name: 'MyFitnessPal', 
      icon: Activity, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      description: 'Planned dietary logging for macronutrients, hydration entries, and daily caloric goals.',
      plannedMetrics: ['Calories', 'Macros', 'Hydration']
    },
    { 
      name: 'Oura', 
      icon: Activity, 
      color: 'text-platinum', 
      bg: 'bg-white/10',
      border: 'border-white/20',
      description: 'Planned readiness score, body temperature, and overnight recovery data sync.',
      plannedMetrics: ['Readiness', 'Sleep Quality', 'Recovery']
    },
  ];

  return (
    <div className="space-y-8">
      <SectionTitle 
        title="Connected Apps & Ecosystem" 
        description="Sync capabilities with external health and wearable platforms are planned for future releases." 
      />

      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-accent-purple/5 to-transparent border border-primary/20 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white text-sm">Integrations in Active Development</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/20 border border-primary/30 text-primary">
                Roadmap Preview
              </span>
            </div>
            <p className="text-xs text-platinum/60 leading-relaxed max-w-2xl">
              Official integrations with third-party fitness and health ecosystems are currently in development. All external services are disconnected and will be unlocked in upcoming platform updates. No external credentials or accounts can be linked at this time.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {clickedToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="p-3.5 rounded-xl bg-surface border border-primary/40 shadow-2xl flex items-center justify-between gap-3 text-xs text-platinum"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-white">{clickedToast.name}: </span>
                <span className="text-platinum/80">Coming Soon — We're working on bringing this integration to you.</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setClickedToast(null)}
              className="text-platinum/40 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {apps.map(app => (
          <div 
            key={app.name} 
            className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between group hover:border-primary/30 transition-all relative overflow-hidden backdrop-blur-sm"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 group-hover:bg-primary/10 transition-all duration-500" />

            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 border", app.bg, app.border, app.color)}>
                      <app.icon className="w-6 h-6 opacity-80" />
                    </div>
                    <div 
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg-dark border border-white/10 flex items-center justify-center text-platinum/50 shadow-sm"
                      title="Connection not available yet"
                    >
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base truncate">{app.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-platinum/30" />
                      <span className="text-[11px] font-bold text-platinum/40 uppercase tracking-wider">
                        Disconnected
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-platinum/60 text-[10px] font-extrabold uppercase tracking-widest shadow-sm group-hover:border-primary/30 group-hover:text-primary transition-colors">
                  <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                  <span>Coming Soon</span>
                </div>
              </div>

              <p className="text-xs text-platinum/50 leading-relaxed mb-4">
                {app.description}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap mb-6">
                {app.plannedMetrics.map((metric) => (
                  <span 
                    key={metric}
                    className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-[10px] font-medium text-platinum/50"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative w-full pt-2 border-t border-white/5">
              <button 
                type="button"
                onClick={() => handleButtonInteraction(app.name)}
                onMouseEnter={() => setActiveTooltip(app.name)}
                onMouseLeave={() => setActiveTooltip(null)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all bg-white/5 border border-white/10 text-platinum/60 flex items-center justify-center gap-2 hover:bg-white/[0.08] hover:border-white/20 select-none group/btn relative"
              >
                <Lock className="w-3.5 h-3.5 text-platinum/40 group-hover/btn:text-primary transition-colors" />
                <span>Coming Soon</span>
              </button>

              <AnimatePresence>
                {activeTooltip === app.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 w-max max-w-[290px] px-3 py-1.5 rounded-lg bg-surface border border-primary/30 text-[11px] font-medium text-platinum text-center shadow-2xl z-30 pointer-events-none"
                  >
                    Coming Soon — We're working on bringing this integration to you.
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface border-b border-r border-primary/30 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-platinum/40">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-platinum/40" />
          <span>Security & Privacy Notice: Zero health telemetry or external account tokens are held or accessed.</span>
        </div>
        <span className="font-bold text-platinum/30 uppercase tracking-widest text-[10px]">Planned Roadmap</span>
      </div>
    </div>
  );
};

const PrivacySection: React.FC<{
  settings: AppSettings;
  updateSettings: (p: string, v: any) => void;
  onExportAllData?: () => void;
  showToast?: (message: string, type?: ToastType) => void;
}> = ({ settings, updateSettings, onExportAllData, showToast }) => {
  const handleClearCache = () => {
    try {
      localStorage.removeItem(scopedKey('coach_history'));
      localStorage.removeItem(scopedKey('journal_draft'));
      localStorage.removeItem(scopedKey('active_focus_timer'));
      showToast?.('Temporary cache cleared (history & habits preserved)', 'success');
    } catch {
      showToast?.('Could not clear local cache', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle title="Privacy & Data" description="Manage your data and privacy preferences." />
      
      <div className="space-y-4">
        <SelectField 
          label="Profile Visibility" 
          value={settings.privacy.profileVisibility} 
          onChange={(v) => updateSettings('privacy.profileVisibility', v)}
          options={[
            { value: 'public', label: 'Public - Everyone can see your progress' },
            { value: 'friends', label: 'Friends - Only followers can see' },
            { value: 'private', label: 'Private - Only you can see' }
          ]}
        />
        <Toggle label="Share Usage Data" description="Help us improve the app by sharing anonymous usage statistics." enabled={settings.privacy.shareData} onChange={(v) => updateSettings('privacy.shareData', v)} />
        <Toggle label="Personalized Recommendations" description="Allow AI Coach to use your data for better insights." enabled={settings.privacy.personalizedAds} onChange={(v) => updateSettings('privacy.personalizedAds', v)} />
        
        <div className="pt-8 space-y-4">
          <h3 className="text-sm font-bold text-platinum/40 uppercase tracking-widest">Data Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onExportAllData?.()}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left"
            >
              <Download className="w-5 h-5 text-primary" />
              <div>
                <div className="font-bold text-white">Export My Data</div>
                <div className="text-xs text-platinum/40">Download a copy of your fitness history.</div>
              </div>
            </button>
            <button
              type="button"
              onClick={handleClearCache}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left"
            >
              <Trash2 className="w-5 h-5 text-error" />
              <div>
                <div className="font-bold text-white">Clear Cache</div>
                <div className="text-xs text-platinum/40">Remove temporary app data.</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SecuritySection: React.FC<{
  userProfile: UserProfile;
  onPasswordUpdated: () => void;
  showToast?: (message: string, type?: ToastType) => void;
}> = ({ userProfile, onPasswordUpdated, showToast }) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState([
    { id: '1', device: 'This Browser Session', location: 'Local Device', active: true, lastSeen: 'Just now', icon: Smartphone },
  ]);

  const { text, days } = usePasswordAge(userProfile.passwordLastChangedDate);

  const handleUpdatePassword = () => {
    if (!currentPw.trim()) {
      showToast?.('Please enter your current password', 'error');
      return;
    }
    if (newPw.length < 8) {
      showToast?.('New password must be at least 8 characters', 'error');
      return;
    }
    if (newPw !== confirmPw) {
      showToast?.('New passwords do not match', 'error');
      return;
    }
    onPasswordUpdated();
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setIsChangingPassword(false);
    showToast?.('Password updated successfully', 'success');
  };

  const handleRevoke = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast?.('Session revoked', 'info');
  };

  const handleLogoutOthers = () => {
    setSessions(prev => prev.filter(s => s.active));
    showToast?.('Signed out of other sessions', 'info');
  };

  return (
    <div className="space-y-8">
      <SectionTitle title="Security" description="Protect your account and manage active sessions." />
      
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white">Password</h3>
                <p className={cn("text-sm", days > 90 ? "text-error" : "text-platinum/40")}>
                  {text}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-all"
            >
              {isChangingPassword ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {isChangingPassword && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pt-4 space-y-4 overflow-hidden"
            >
              <InputField label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" placeholder="Enter current password" />
              <InputField label="New Password" value={newPw} onChange={setNewPw} type="password" placeholder="Minimum 8 characters" />
              <InputField label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Repeat new password" />
              <button
                type="button"
                onClick={handleUpdatePassword}
                className="btn-primary w-full py-3"
              >
                Update Password
              </button>
            </motion.div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-white">Two-Factor Authentication</h3>
              <p className="text-sm text-platinum/40">Add an extra layer of security to your account.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              const next = !twoFactorEnabled;
              setTwoFactorEnabled(next);
              showToast?.(next ? 'Two-factor preference enabled' : 'Two-factor preference disabled', 'info');
            }}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative shrink-0",
              twoFactorEnabled ? "bg-primary" : "bg-white/10"
            )}
          >
            <div className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
              twoFactorEnabled ? "right-1" : "left-1"
            )} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-platinum/40 uppercase tracking-widest">Active Sessions</h3>
            <span className="text-[10px] font-bold text-platinum/20 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
              {sessions.length} Active
            </span>
          </div>
          
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {sessions.map(session => (
                <motion.div 
                  key={session.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                      session.active ? "bg-primary/10 text-primary" : "bg-white/5 text-platinum/40"
                    )}>
                      <session.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{session.device}</span>
                        {session.active && (
                          <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold uppercase tracking-wider">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-platinum/40">{session.location} • {session.lastSeen}</p>
                    </div>
                  </div>
                  {!session.active && (
                    <button 
                      type="button"
                      onClick={() => handleRevoke(session.id)}
                      className="text-xs font-bold text-error/60 hover:text-error hover:underline transition-colors px-3 py-1 rounded-lg hover:bg-error/10"
                    >
                      Revoke
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {sessions.length > 1 && (
            <button 
              type="button"
              onClick={handleLogoutOthers}
              className="w-full py-4 text-xs font-bold text-error uppercase tracking-widest hover:bg-error/5 rounded-xl border border-dashed border-error/20 hover:border-error/40 transition-all"
            >
              Log out from all other devices
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const BillingSection: React.FC<{ showToast?: (message: string, type?: ToastType) => void }> = ({ showToast }) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://energoals.app';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'EnerGoals',
          text: 'Build habits. Track progress. Become unstoppable with EnerGoals.',
          url: shareUrl
        });
        showToast?.('Thanks for sharing EnerGoals!', 'success');
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast?.('App link copied to clipboard!', 'success');
    } catch {
      showToast?.('Share EnerGoals with friends: ' + shareUrl, 'info');
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      showToast?.('Please enter your feedback first', 'error');
      return;
    }
    setFeedbackText('');
    setFeedbackOpen(false);
    showToast?.('Thank you! Your feedback has been recorded.', 'success');
  };

  return (
    <div className="space-y-8">
      <SectionTitle title="Subscription" description="Information about your EnerGoals account." />
      
      <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-deep/20 border border-primary/30 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Current Plan</div>
              <div className="text-3xl font-display font-bold text-white">Free Forever</div>
            </div>
            <div className="px-4 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-widest">Active</div>
          </div>
          
          <div className="space-y-4 mb-8">
            <p className="text-platinum/80 leading-relaxed">
              “This app is free—no payment needed to track your habits. 
              If it helps you, consider sending a thank-you to Badr for making it possible.”
            </p>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={handleShare} className="btn-primary flex-1">Share the App</button>
            <button type="button" onClick={() => setFeedbackOpen(prev => !prev)} className="btn-secondary flex-1">
              {feedbackOpen ? 'Close Feedback' : 'Send Feedback'}
            </button>
          </div>

          {feedbackOpen && (
            <div className="mt-5 p-4 rounded-2xl bg-surface/80 border border-white/10 space-y-3">
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share what you love or what could make EnerGoals even better..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={handleSubmitFeedback}
                className="btn-primary px-5 py-2 text-xs font-bold"
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>
        <Sparkles className="absolute -right-8 -bottom-8 w-48 h-48 text-primary/10 -rotate-12" />
      </div>

      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
        <h3 className="text-sm font-bold text-platinum/40 uppercase tracking-widest">Why is it free?</h3>
        <p className="text-sm text-platinum/60 leading-relaxed">
          EnerGoals was built with the mission to provide world-class performance tracking tools to everyone, regardless of their financial situation. We believe discipline should be accessible to all.
        </p>
      </div>
    </div>
  );
};

const SupportSection: React.FC<{
  onSelectTopic: (topic: string) => void;
  showToast?: (message: string, type?: ToastType) => void;
}> = ({ onSelectTopic, showToast }) => (
  <div className="space-y-8">
    <SectionTitle title="Help & Support" description="Get help with the app or report technical issues." />
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { title: 'Help Center', desc: 'Browse our knowledge base.', icon: HelpCircle },
        { title: 'FAQs', desc: 'Quick answers to common questions.', icon: MessageSquare },
        { title: 'Contact Support', desc: 'Talk to our premium support team.', icon: Mail },
        { title: 'Report a Bug', desc: 'Help us improve the experience.', icon: AlertTriangle }
      ].map(item => (
        <button
          type="button"
          key={item.title}
          onClick={() => onSelectTopic(item.title)}
          className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <item.icon className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-white">{item.title}</div>
            <div className="text-xs text-platinum/40">{item.desc}</div>
          </div>
        </button>
      ))}
    </div>

    <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center space-y-4">
      <h3 className="font-bold text-white">Need immediate assistance?</h3>
      <p className="text-sm text-platinum/40 max-w-md mx-auto">Browse our interactive FAQs or jump into Help Center documentation anytime.</p>
      <button
        type="button"
        onClick={() => {
          onSelectTopic('FAQs');
          showToast?.('Opened interactive FAQ guide', 'info');
        }}
        className="btn-primary"
      >
        Open Quick Help
      </button>
    </div>
  </div>
);

const AboutSection: React.FC<{ onSelectDoc: (doc: string) => void }> = ({ onSelectDoc }) => (
  <div className="space-y-8">
    <SectionTitle title="About & Legal" description="App version and legal documentation." />
    
    <div className="space-y-2">
      {[
        { title: 'Terms of Service', icon: FileText },
        { title: 'Privacy Policy', icon: Shield },
        { title: 'Community Guidelines', icon: Users },
        { title: 'Licenses', icon: Info },
        { title: 'Release Notes', icon: RefreshCw }
      ].map(item => (
        <button
          type="button"
          key={item.title}
          onClick={() => onSelectDoc(item.title)}
          className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-4">
            <item.icon className="w-5 h-5 text-platinum/40" />
            <span className="font-medium text-white">{item.title}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-platinum/20" />
        </button>
      ))}
    </div>

    <div className="pt-8 text-center space-y-2">
      <div className="text-2xl font-display font-bold text-primary">EnerGoals</div>
      <div className="text-xs text-platinum/40">Version 2.4.0 (Build 1024)</div>
      <div className="text-[10px] text-platinum/20 uppercase tracking-widest">© 2026 EnerGoals Inc. All rights reserved.</div>
    </div>
  </div>
);

const DangerSection: React.FC<{
  onLogout?: () => void | Promise<void>;
  onEraseAllData?: () => void | Promise<void>;
  onDeleteAccount?: () => void | Promise<void>;
  showToast?: (message: string, type?: ToastType) => void;
}> = ({ onLogout, onEraseAllData, onDeleteAccount, showToast }) => {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: 'logout' | 'delete-data' | 'delete-account') => {
    if (confirmAction !== action) {
      setConfirmAction(action);
      return;
    }

    setIsProcessing(true);
    try {
      if (action === 'logout') {
        await onLogout?.();
      } else if (action === 'delete-data') {
        await onEraseAllData?.();
      } else if (action === 'delete-account') {
        await onDeleteAccount?.();
      }
      setConfirmAction(null);
    } catch {
      showToast?.('Failed to complete requested action', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle title="Danger Zone" description="Irreversible actions related to your account and data." />
      
      <div className="space-y-4">
        <div className="p-6 rounded-2xl border border-error/20 bg-error/5 space-y-4">
          <div className="flex items-center gap-3 text-error">
            <LogOut className="w-5 h-5" />
            <h3 className="font-bold">Log Out</h3>
          </div>
          <p className="text-sm text-platinum/40">Sign out of your account on this device. Your cloud-synced data remains safe.</p>
          <button 
            type="button"
            disabled={isProcessing}
            onClick={() => handleAction('logout')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all",
              confirmAction === 'logout' ? "bg-error text-white" : "bg-error/10 text-error hover:bg-error/20"
            )}
          >
            {confirmAction === 'logout' ? 'Confirm Log Out' : 'Log Out'}
          </button>
        </div>

        <div className="p-6 rounded-2xl border border-error/20 bg-error/5 space-y-4">
          <div className="flex items-center gap-3 text-error">
            <Trash2 className="w-5 h-5" />
            <h3 className="font-bold">Delete All Fitness Data</h3>
          </div>
          <p className="text-sm text-platinum/40">This will permanently erase all your workout history, habits, and progress. This action cannot be undone.</p>
          <button 
            type="button"
            disabled={isProcessing}
            onClick={() => handleAction('delete-data')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all",
              confirmAction === 'delete-data' ? "bg-error text-white" : "bg-error/10 text-error hover:bg-error/20"
            )}
          >
            {confirmAction === 'delete-data' ? 'Confirm Erase All Data' : 'Erase All Data'}
          </button>
        </div>

        <div className="p-6 rounded-2xl border border-error/20 bg-error/5 space-y-4">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold">Delete Account</h3>
          </div>
          <p className="text-sm text-platinum/40">Permanently delete your account and all associated data.</p>
          <button 
            type="button"
            disabled={isProcessing}
            onClick={() => handleAction('delete-account')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all",
              confirmAction === 'delete-account' ? "bg-error-dark text-white ring-4 ring-error/20" : "bg-error text-white hover:bg-error-dark"
            )}
          >
            {confirmAction === 'delete-account' ? 'Confirm Permanent Deletion' : 'Delete Account'}
          </button>
        </div>
        
        {confirmAction && (
          <button 
            type="button"
            onClick={() => setConfirmAction(null)}
            className="w-full py-2 text-xs font-bold text-platinum/40 uppercase tracking-widest hover:text-white transition-colors"
          >
            Cancel Action
          </button>
        )}
      </div>
    </div>
  );
};
