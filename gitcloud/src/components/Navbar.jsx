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
          {/* Info tooltip */}
          <div className="relative group/info">
            <button className="w-7 h-7 flex items-center justify-center rounded-full border border-white/10 text-zinc-500 hover:text-white hover:border-white/20 transition-all text-xs font-bold">
              i
            </button>
            <div className="pointer-events-none opacity-0 group-hover/info:opacity-100 transition-opacity duration-200 absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl bg-zinc-900 border border-white/10 shadow-xl shadow-black/40 text-xs text-zinc-300 leading-relaxed z-50">
              <p className="font-semibold text-white mb-1.5">Storage tip</p>
              <p>Create new folders (repos) for large files instead of adding to ones that are already full. This avoids automatic overflow and keeps your storage organized.</p>
            </div>
          </div>
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
