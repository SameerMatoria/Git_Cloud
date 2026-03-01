'use client';

import React, { useState, useEffect, useRef } from 'react';
import './globals.css';
import Background from '@/components/Background';

const FeatureIcon = ({ children }) => (
  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-blue-400 mb-5 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 group-hover:text-blue-300 transition-all duration-300">
    {children}
  </div>
);

const features = [
  {
    title: 'Cloud File Manager',
    desc: 'Browse your GitHub repos like a traditional cloud drive. Navigate folders, view files, and manage everything visually.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Media Preview',
    desc: 'Instantly preview images, videos, audio, and code files with a built-in viewer. Fullscreen gallery and syntax highlighting included.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    title: 'Drag & Drop Upload',
    desc: 'Upload files with drag-and-drop or click-to-browse. Auto-committed to GitHub with zero config. Supports up to 25 MB per file.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    title: 'Shareable Links',
    desc: 'Generate public links for any file. Anyone can view or download without a GitHub account. Perfect for sharing media.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    title: 'Code & Markdown',
    desc: 'View markdown files rendered with full formatting. Syntax-highlight any code file with one click — 50+ languages supported.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'Storage Analytics',
    desc: 'See how much storage each repository uses. Visual progress bars and percentage breakdowns across all your folders.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
];

const steps = [
  { num: '01', title: 'Sign in with GitHub', desc: 'One-click OAuth login — no passwords, no setup.' },
  { num: '02', title: 'Pick a repository', desc: 'Choose any repo or create a new one as your cloud folder.' },
  { num: '03', title: 'Manage your files', desc: 'Upload, preview, organize, share — all from one interface.' },
];

function useInView(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const featRef = useRef(null);
  const stepsRef = useRef(null);
  const featVisible = useInView(featRef);
  const stepsVisible = useInView(stepsRef);

  return (
    <div className="bg-black text-white scroll-smooth overflow-x-hidden">
      <Background />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#home" className="text-lg font-bold tracking-tight hover:text-blue-400 transition-colors">
            GitCloud
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">How it Works</a>
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-all"
            >
              Get Started
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-black/90 backdrop-blur-xl px-6 py-4 space-y-3 animate-slide-down">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-400 hover:text-white py-2">Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-400 hover:text-white py-2">How it Works</a>
            <a href="/login" className="block text-center px-4 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-all">Get Started</a>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section id="home" className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-16">
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Powered by GitHub API
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Your GitHub,{' '}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              now a Cloud Drive
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '200ms' }}>
            Turn your GitHub repositories into a sleek file manager. Upload, preview, organize, and share — all without touching the command line.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <a
              href="/login"
              className="group flex items-center gap-2 px-7 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 shadow-xl shadow-white/[0.05] transition-all text-sm"
            >
              Launch GitCloud
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <a
              href="#features"
              className="px-7 py-3.5 text-sm font-medium text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-xl hover:bg-white/[0.03] transition-all"
            >
              See Features
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-16 animate-fade-in" style={{ animationDelay: '500ms' }}>
            {[
              { val: '25 MB', label: 'per file' },
              { val: '100 TB', label: 'theoretical max' },
              { val: 'Free', label: 'forever' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{s.val}</p>
                <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-zinc-500 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-32 px-6">
        <div ref={featRef} className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-blue-400 uppercase tracking-widest font-medium mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need in a cloud drive</h2>
            <p className="text-zinc-500 mt-4 max-w-xl mx-auto">Built on top of GitHub's infrastructure — reliable, versioned, and free.</p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${featVisible ? 'stagger-children' : ''}`}>
            {features.map((f) => (
              <div
                key={f.title}
                className={`group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 ${
                  featVisible ? 'animate-fade-in' : 'opacity-0'
                }`}
              >
                <FeatureIcon>{f.icon}</FeatureIcon>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative py-32 px-6">
        <div ref={stepsRef} className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">How it Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Up and running in minutes</h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-violet-500/50 to-transparent hidden sm:block" />

            <div className="space-y-8 sm:space-y-12">
              {steps.map((step, i) => (
                <div
                  key={step.num}
                  className={`flex items-start gap-5 sm:gap-8 ${stepsVisible ? 'animate-fade-in' : 'opacity-0'}`}
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#0c0c1a] border border-white/[0.08] flex items-center justify-center">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{step.num}</span>
                    </div>
                  </div>
                  <div className="pt-1 sm:pt-3">
                    <h3 className="text-lg sm:text-xl font-semibold mb-1.5">{step.title}</h3>
                    <p className="text-sm sm:text-base text-zinc-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-12 sm:p-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Git Cloud?</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">
              Join developers using GitHub as their personal cloud drive. Free, unlimited, and version-controlled.
            </p>
            <a
              href="/login"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 shadow-xl shadow-white/[0.05] transition-all"
            >
              Get Started — It's Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-500">&copy; {new Date().getFullYear()} GitCloud</span>
          <div className="flex items-center gap-6">
            <a href="https://github.com/SameerMatoria" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-600 hover:text-zinc-300 transition-colors flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <a href="/privacy" className="text-sm text-zinc-600 hover:text-zinc-300 transition-colors">Privacy</a>
            <span className="text-xs text-zinc-700">Powered by GitHub API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
