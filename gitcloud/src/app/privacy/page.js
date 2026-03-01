'use client';

const sections = [
  {
    id: 'what-is-gitcloud',
    title: 'What is GitCloud?',
    content: `GitCloud is a web-based file manager that uses your GitHub account as cloud storage. It lets you upload, preview, organize, and share files stored in your GitHub repositories — without using Git commands or the GitHub interface directly.

GitCloud does not have its own storage. Every file you upload is stored in your GitHub repositories, subject to GitHub's own terms and limits.`,
  },
  {
    id: 'authentication',
    title: 'How Authentication Works',
    content: `GitCloud uses GitHub OAuth for sign-in. When you click "Continue with GitHub", you are redirected to GitHub's own login page. GitCloud never sees, handles, or stores your GitHub password.

After you authorize, GitHub provides GitCloud with an access token scoped to the permissions you granted. This token is stored only in your server-side session and is never exposed to the browser or saved to any database.`,
  },
  {
    id: 'permissions',
    title: 'What Permissions We Request',
    items: [
      {
        scope: 'repo',
        label: 'Repository access (read & write)',
        reason: 'Required to list your repositories, read file contents, upload new files, create folders, rename and delete files. This is the core functionality of GitCloud.',
      },
      {
        scope: 'user:email',
        label: 'Email address (read only)',
        reason: 'Used to display your profile information. We do not send emails or share your address with anyone.',
      },
    ],
  },
  {
    id: 'what-we-do',
    title: 'What GitCloud Does',
    list: [
      'Lists your repositories and their contents via the GitHub API',
      'Uploads files by creating commits in your repositories',
      'Creates folders using a .gitkeep placeholder file',
      'Previews images, audio, video, code, and markdown files',
      'Generates shareable public links for individual files',
      'Displays storage usage statistics from GitHub\'s reported repo sizes',
    ],
  },
  {
    id: 'what-we-dont',
    title: 'What GitCloud Does NOT Do',
    list: [
      'We do not store your GitHub password — ever',
      'We do not store your files on our servers — everything lives on GitHub',
      'We do not modify your code, branches, or commit history beyond file operations you initiate',
      'We do not access repositories belonging to other users',
      'We do not sell, share, or transfer your data to third parties',
      'We do not use your data for analytics, advertising, or training',
      'We do not run any background operations on your repos when you\'re not actively using GitCloud',
    ],
  },
  {
    id: 'data-storage',
    title: 'Data We Store',
    content: `GitCloud stores minimal data:

**Server session** — Your GitHub access token is kept in a server-side session for the duration of your login. It is deleted when you log out or the session expires.

**Share links** — When you create a shareable link, we store a record in a local SQLite database containing: the share ID, your username, repository name, file path, and creation date. No file content is stored — the file is fetched from GitHub when someone opens the link.

**That's it.** We do not maintain user accounts, profiles, usage logs, or any other persistent data about you.`,
  },
  {
    id: 'revoke',
    title: 'Revoking Access',
    content: `You can revoke GitCloud's access to your GitHub account at any time:

1. Go to [GitHub Settings → Applications](https://github.com/settings/applications)
2. Find GitCloud in the list
3. Click **Revoke**

Once revoked, GitCloud can no longer access any of your repositories. Any active sessions will stop working immediately.`,
  },
  {
    id: 'open-source',
    title: 'Open Source & Transparency',
    content: `GitCloud's source code is publicly available. You can inspect exactly what the application does, how tokens are handled, and what API calls are made. There is no hidden or obfuscated behavior.

If you find a security concern, please report it via GitHub issues.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `If you have questions about this policy or GitCloud's security practices, you can reach out via GitHub:

[github.com/SameerMatoria](https://github.com/SameerMatoria)`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-lg font-bold tracking-tight hover:text-blue-400 transition-colors">
            GitCloud
          </a>
          <a href="/login" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12] rounded-lg hover:bg-white/[0.03] transition-all">
            Sign in
          </a>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xs text-emerald-400 uppercase tracking-widest font-medium">Privacy & Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">How GitCloud handles your data</h1>
          <p className="text-zinc-500 leading-relaxed">
            We believe in full transparency. This page explains exactly what GitCloud accesses, what it does with your data, and what it doesn't.
          </p>
        </div>

        {/* Table of contents */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">On this page</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-zinc-400 hover:text-blue-400 py-1 transition-colors">
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 animate-fade-in" style={{ animationDelay: `${(i + 2) * 50}ms` }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                <span className="text-xs text-zinc-600 font-mono">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>

              {s.content && (
                <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
                  {s.content.split('\n\n').map((para, j) => (
                    <p key={j} className="whitespace-pre-line">
                      {para.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g).map((part, k) => {
                        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                        if (linkMatch) {
                          return <a key={k} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline transition-colors">{linkMatch[1]}</a>;
                        }
                        const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
                        if (boldMatch) {
                          return <span key={k} className="text-zinc-200 font-medium">{boldMatch[1]}</span>;
                        }
                        return part;
                      })}
                    </p>
                  ))}
                </div>
              )}

              {s.items && (
                <div className="space-y-4">
                  {s.items.map((item) => (
                    <div key={item.scope} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">{item.scope}</span>
                        <span className="text-sm text-zinc-200 font-medium">{item.label}</span>
                      </div>
                      <p className="text-sm text-zinc-500 leading-relaxed">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {s.list && (
                <div className="space-y-2.5">
                  {s.list.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full ${s.id === 'what-we-dont' ? 'bg-zinc-600' : 'bg-emerald-400'}`} />
                      <span className="text-sm text-zinc-400 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] text-center animate-fade-in">
          <p className="text-sm text-zinc-500 mb-6">Comfortable with how GitCloud works?</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/login" className="px-6 py-3 text-sm font-semibold bg-white text-black rounded-xl hover:bg-zinc-200 transition-all">
              Get Started
            </a>
            <a href="/" className="px-6 py-3 text-sm font-medium text-zinc-400 border border-white/[0.06] rounded-xl hover:bg-white/[0.03] hover:text-white transition-all">
              Back to Home
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8 mt-12">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-sm text-zinc-600">&copy; {new Date().getFullYear()} GitCloud</span>
          <a href="https://github.com/SameerMatoria" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-600 hover:text-zinc-300 transition-colors">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
