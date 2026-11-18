import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Logo } from './Logo';
import { MethodologyGuide } from './MethodologyGuide';
import energoalsBanner from '../assets/images/energoals_banner_1786913655906.jpg';

export const LandingPage: React.FC<{ onStart: () => void, onNavigateToPricing: () => void }> = ({ onStart, onNavigateToPricing }) => {
  const [showMethodology, setShowMethodology] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-[#07070B] text-[#F5F4F8] selection:bg-primary/30 selection:text-white overflow-x-hidden relative">
      {/* Global Atmospheric Layer */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {/* Deep radial violet dome */}
        <div 
          className="absolute -top-[18%] left-1/2 -translate-x-1/2 w-[1100px] max-w-[140vw] h-[680px] rounded-full blur-[130px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(177, 74, 224, 0.22) 0%, rgba(109, 40, 217, 0.12) 45%, transparent 75%)'
          }}
        />
        {/* Subtle magenta side-glow for dimensional depth */}
        <div 
          className="absolute top-[12%] left-[58%] -translate-x-1/2 w-[560px] h-[420px] rounded-full blur-[120px] opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.11) 0%, rgba(138, 31, 200, 0.08) 55%, transparent 75%)',
            animation: shouldReduceMotion ? undefined : 'ambient-drift 11s ease-in-out infinite'
          }}
        />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07070B]/75 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          <a href="#" className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-xl">
            <Logo />
          </a>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#A9A6BA]">
            <a 
              href="#features" 
              className="hover:text-white transition-colors duration-200 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-primary hover:after:w-full after:transition-all after:duration-200"
            >
              Features
            </a>
            <button 
              type="button"
              onClick={() => setShowMethodology(true)} 
              className="hover:text-white transition-colors duration-200 py-1 cursor-pointer relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-primary hover:after:w-full after:transition-all after:duration-200"
            >
              How it works
            </button>
            <button 
              type="button"
              onClick={onNavigateToPricing} 
              className="hover:text-white transition-colors duration-200 py-1 cursor-pointer relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-primary hover:after:w-full after:transition-all after:duration-200"
            >
              Pricing
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowMethodology(true)}
              className="md:hidden text-xs font-medium text-[#A9A6BA] hover:text-white transition-colors px-2 py-2 cursor-pointer"
            >
              How it works
            </button>
            <button 
              type="button"
              onClick={onStart} 
              className="relative inline-flex items-center justify-center gap-1.5 rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 cursor-pointer bg-white/[0.08] hover:bg-white/[0.13] border border-white/[0.12] hover:border-primary/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Methodology Guide Modal */}
      <MethodologyGuide isOpen={showMethodology} onClose={() => setShowMethodology(false)} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-14 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 overflow-hidden">
          {/* Subtle Architectural Grid & Minimal Geometric Horizon Lines */}
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div 
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                maskImage: 'radial-gradient(ellipse 75% 60% at 50% 25%, #000 10%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 25%, #000 10%, transparent 80%)'
              }}
            />

            {/* Minimal geometric concentric rings behind hero focal anchor */}
            <svg
              className="absolute top-6 left-1/2 -translate-x-1/2 w-[900px] max-w-[150vw] h-[520px] opacity-35"
              viewBox="0 0 900 520"
              fill="none"
            >
              <defs>
                <linearGradient id="heroArcGrad" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#B14AE0" stopOpacity="0" />
                  <stop offset="35%" stopColor="#B14AE0" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#E879F9" stopOpacity="0.45" />
                  <stop offset="65%" stopColor="#8A1FC8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8A1FC8" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="heroBeamGrad" x1="450" y1="0" x2="450" y2="260" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#D9B6FF" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#B14AE0" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="450" cy="270" r="220" stroke="url(#heroArcGrad)" strokeWidth="1" />
              <circle cx="450" cy="270" r="335" stroke="url(#heroArcGrad)" strokeWidth="0.75" strokeDasharray="4 8" />
              <line x1="450" y1="0" x2="450" y2="220" stroke="url(#heroBeamGrad)" strokeWidth="1" />
            </svg>
          </div>

          <div className="max-w-5xl mx-auto text-center">
            {/* Editorial Kicker — clean unboxed typography */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center gap-3 mb-5 sm:mb-7"
            >
              <span className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#B14AE0]/70" aria-hidden="true" />
              <span className="text-[11px] sm:text-xs font-medium tracking-[0.2em] uppercase text-[#D9B6FF]/85">
                Self-Mastery Operating System
              </span>
              <span className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-[#B14AE0]/70" aria-hidden="true" />
            </motion.div>

            {/* Hero Main Headline */}
            <motion.h1
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold text-[2.5rem] sm:text-[3.75rem] md:text-[4.5rem] lg:text-[5rem] leading-[1.06] tracking-[-0.035em] text-balance mx-auto mb-6 sm:mb-7"
            >
              <span className="block text-white">Build habits.</span>
              <span className="block text-[#F3F1F8]/95 mt-0.5 sm:mt-1">Track progress.</span>
              <span
                className="block mt-1 sm:mt-1.5 bg-gradient-to-r from-[#E2C6FF] via-[#B14AE0] to-[#F472B6] bg-clip-text text-transparent pb-1"
                style={{
                  filter: 'drop-shadow(0 6px 28px rgba(177, 74, 224, 0.28))'
                }}
              >
                Become unstoppable.
              </span>
            </motion.h1>

            {/* Supporting Description */}
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="text-[15.5px] sm:text-lg md:text-[1.1875rem] text-[#B3B0C4] max-w-[56ch] mx-auto leading-[1.7] font-normal mb-8 sm:mb-10 px-1"
            >
              EnerGoals turns discipline into daily momentum. A premium self-mastery operating system designed for high-performance individuals.
            </motion.p>

            {/* Primary CTA + Clean Secondary Trigger */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
            >
              <button
                type="button"
                onClick={onStart}
                className="group relative inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 rounded-xl text-[15px] sm:text-base font-semibold text-white cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B6FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070B]"
                style={{
                  background: 'linear-gradient(135deg, #8A1FC8 0%, #B14AE0 52%, #D946EF 100%)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 0 0 1px rgba(217, 182, 255, 0.22), 0 14px 36px -8px rgba(177, 74, 224, 0.58)'
                }}
              >
                <span
                  className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    boxShadow: '0 0 42px -4px rgba(192, 38, 211, 0.68)'
                  }}
                  aria-hidden="true"
                />
                <span className="relative z-10">Start Your Transformation</span>
                <ArrowRight className="relative z-10 w-[18px] h-[18px] transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => setShowMethodology(true)}
                className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-[#B3B0C4] hover:text-white transition-colors duration-200 py-2.5 px-3 cursor-pointer group"
              >
                <span>See how it works</span>
                <ChevronRight className="w-4 h-4 text-[#B14AE0] transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            {/* Hero Product Showcase */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative mt-14 sm:mt-20 mx-auto max-w-5xl w-full"
            >
              {/* Soft backlight beneath showcase frame */}
              <div
                className="pointer-events-none absolute -inset-x-6 -top-8 bottom-8 rounded-[36px] blur-3xl -z-10 opacity-75"
                style={{
                  background: 'radial-gradient(ellipse at 50% 20%, rgba(177, 74, 224, 0.26), rgba(138, 31, 200, 0.08) 60%, transparent 80%)'
                }}
                aria-hidden="true"
              />

              <div className="relative rounded-2xl sm:rounded-3xl p-[1px] bg-gradient-to-b from-white/[0.16] via-white/[0.06] to-white/[0.02] shadow-[0_32px_90px_-20px_rgba(0,0,0,0.85)]">
                {/* Specular top highlight line */}
                <div
                  className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#E2C6FF]/65 to-transparent"
                  aria-hidden="true"
                />
                <div className="rounded-[15px] sm:rounded-[23px] overflow-hidden bg-[#0A0911]">
                  <img
                    src={energoalsBanner}
                    alt="EnerGoals self-mastery workspace preview"
                    className="w-full h-auto object-cover block"
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/energoals-banner.jpg';
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Three Pillars Section: Discipline, Progress, Mastery */}
        <section id="features" className="relative py-20 sm:py-28 px-4 sm:px-6 border-t border-white/[0.06]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
            aria-hidden="true"
          />

          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
              <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#D9B6FF]/80 mb-3">
                Core Architecture
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-display font-bold text-white tracking-[-0.025em] leading-[1.12] text-balance mb-4">
                Engineered for Excellence
              </h2>
              <p className="text-[15px] sm:text-base text-[#A9A6BA] leading-relaxed">
                Every workflow is tuned to eliminate friction, surface meaningful signals, and compound your daily consistency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PillarCard
                index="01"
                icon={Zap}
                title="Discipline"
                subtitle="Build better habits and stay consistent."
                description="Turn daily intentions into automatic execution with momentum scoring, 24-hour reset cycles, and distraction-free focus sprints."
                visual="rhythm"
              />
              <PillarCard
                index="02"
                icon={BarChart3}
                title="Progress"
                subtitle="Track measurable personal growth."
                description="Visualize your real consistency trends, pinpoint peak productivity windows, and audit every completed milestone over time."
                visual="curve"
              />
              <PillarCard
                index="03"
                icon={Shield}
                title="Mastery"
                subtitle="Become a more focused and capable individual."
                description="Connect daily actions to long-term identity goals, guided routines, and reflective insights built for sustained mastery."
                visual="ring"
              />
            </div>
          </div>
        </section>

        {/* Closing CTA Section */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden border-t border-white/[0.06]">
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] max-w-[120vw] h-[360px] rounded-full blur-[120px] -z-10"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(177, 74, 224, 0.2) 0%, rgba(236, 72, 153, 0.08) 50%, transparent 75%)'
            }}
            aria-hidden="true"
          />

          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-[-0.03em] leading-[1.1] text-balance">
              Ready to level up?
            </h2>
            <p className="text-base sm:text-lg text-[#B3B0C4] leading-relaxed max-w-xl mx-auto">
              Join 50,000+ high-performers turning daily discipline into measurable momentum with EnerGoals.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onStart}
                className="group relative inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-9 py-4 rounded-xl text-base font-semibold text-white cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.985]"
                style={{
                  background: 'linear-gradient(135deg, #8A1FC8 0%, #B14AE0 52%, #D946EF 100%)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 0 0 1px rgba(217, 182, 255, 0.22), 0 14px 36px -8px rgba(177, 74, 224, 0.55)'
                }}
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-[18px] h-[18px] transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 border-t border-white/[0.06] bg-[#07070B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-[#8C899D] text-xs sm:text-sm">
          <Logo showText={false} className="opacity-70" />
          <div className="flex items-center gap-7">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <button type="button" onClick={() => setShowMethodology(true)} className="hover:text-white transition-colors cursor-pointer">
              How it works
            </button>
            <button type="button" onClick={onNavigateToPricing} className="hover:text-white transition-colors cursor-pointer">
              Pricing
            </button>
          </div>
          <p>© 2026 EnerGoals Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

interface PillarCardProps {
  index: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
  visual: 'rhythm' | 'curve' | 'ring';
}

const PillarCard: React.FC<PillarCardProps> = ({ index, icon: Icon, title, subtitle, description, visual }) => (
  <div className="group relative rounded-2xl p-7 sm:p-8 bg-[#101018]/90 border border-white/[0.07] hover:border-[#B14AE0]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden">
    {/* Subtle hover top specular highlight */}
    <div
      className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D9B6FF]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      aria-hidden="true"
    />

    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#B14AE0]/20 to-[#8A1FC8]/10 border border-[#B14AE0]/25 flex items-center justify-center text-[#D9B6FF] group-hover:scale-105 transition-transform duration-300">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-mono tabular-nums text-[#8C899D]">{index}</span>
      </div>

      <h3 className="text-xl font-display font-bold text-white tracking-tight mb-1.5">{title}</h3>
      <p className="text-sm font-medium text-[#D9B6FF]/90 mb-3">{subtitle}</p>
      <p className="text-sm text-[#A9A6BA] leading-relaxed">{description}</p>
    </div>

    {/* Minimalist Architectural Micro-Visual */}
    <div className="mt-7 pt-5 border-t border-white/[0.06]" aria-hidden="true">
      {visual === 'rhythm' && (
        <div className="flex items-end gap-1.5 h-8">
          {[38, 52, 48, 68, 76, 88, 100].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-300"
              style={{
                height: `${h}%`,
                background: i >= 5
                  ? 'linear-gradient(to top, #8A1FC8, #E879F9)'
                  : 'rgba(177, 74, 224, 0.25)'
              }}
            />
          ))}
        </div>
      )}

      {visual === 'curve' && (
        <svg className="w-full h-8" viewBox="0 0 240 36" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pillarCurveStroke" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8A1FC8" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#B14AE0" />
              <stop offset="100%" stopColor="#F472B6" />
            </linearGradient>
          </defs>
          <path
            d="M2 30 C 48 28, 76 22, 114 18 C 152 14, 186 8, 238 4"
            stroke="url(#pillarCurveStroke)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="236" cy="4.5" r="2.75" fill="#F472B6" />
        </svg>
      )}

      {visual === 'ring' && (
        <div className="flex items-center gap-3 h-8">
          <div className="relative w-7 h-7 shrink-0">
            <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="11" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" fill="none" />
              <circle
                cx="14"
                cy="14"
                r="11"
                stroke="#B14AE0"
                strokeWidth="2.5"
                strokeDasharray="69.1"
                strokeDashoffset="14"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
            <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-[#8A1FC8] via-[#B14AE0] to-[#F472B6]" />
          </div>
        </div>
      )}
    </div>
  </div>
);
