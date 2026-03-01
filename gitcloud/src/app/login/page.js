'use client';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Subtle background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 px-6 h-16 flex items-center">
        <a href="/" className="text-lg font-bold tracking-tight hover:text-blue-400 transition-colors">
          GitCloud
        </a>
      </nav>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm animate-fade-in">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
            <p className="text-sm text-zinc-500 text-center mb-8">
              Sign in with your GitHub account to continue
            </p>

            {/* GitHub Login Button */}
            <button
              onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/auth/github`; }}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all shadow-lg shadow-white/[0.03] group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Back to Home */}
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-zinc-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12] rounded-xl hover:bg-white/[0.03] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Home
            </a>
          </div>

          {/* Permissions & Security */}
          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-xs font-medium text-zinc-300">What GitCloud accesses</span>
            </div>

            <div className="space-y-3">
              {[
                { icon: '✓', text: 'Read & write files in your repos', why: 'To upload, download, and manage files' },
                { icon: '✓', text: 'Create & delete repositories', why: 'To create new cloud folders' },
                { icon: '✓', text: 'Your public profile info', why: 'To display your name and avatar' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 text-xs mt-0.5 shrink-0 font-bold">{item.icon}</span>
                  <div>
                    <p className="text-xs text-zinc-300">{item.text}</p>
                    <p className="text-[10px] text-zinc-600">{item.why}</p>
                  </div>
                </div>
              ))}

              <div className="h-px bg-white/[0.04] my-1" />

              {[
                { icon: '✗', text: 'We never store your GitHub password' },
                { icon: '✗', text: 'We never modify code or commit history' },
                { icon: '✗', text: 'We never access other users\' repos' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <span className="text-zinc-600 text-xs mt-0.5 shrink-0 font-bold">{item.icon}</span>
                  <p className="text-xs text-zinc-500">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
              <p className="text-[10px] text-zinc-600 leading-relaxed">
                <a href="https://github.com/settings/applications" target="_blank" rel="noopener noreferrer" className="text-zinc-400 underline hover:text-white transition-colors">
                  Revoke access
                </a>
              </p>
              <a href="/privacy" className="text-[10px] text-zinc-400 underline hover:text-white transition-colors">
                Full privacy policy
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
