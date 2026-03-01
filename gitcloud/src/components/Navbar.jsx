'use client';

import { useRouter } from 'next/navigation';

export default function Navbar({ user }) {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2.5 group"
        >
          <span className="text-lg font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
            GitCloud
          </span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all group"
            >
              <img
                src={user.avatar_url}
                alt=""
                className="w-7 h-7 rounded-full ring-2 ring-white/10 group-hover:ring-blue-500/30 transition-all"
              />
              <span className="text-sm text-zinc-400 group-hover:text-zinc-200 hidden sm:inline transition-colors">
                {user.login}
              </span>
            </button>
          )}
          <button
            onClick={() => { window.location.href = '/api/logout'; }}
            className="px-3.5 py-1.5 text-sm text-zinc-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
