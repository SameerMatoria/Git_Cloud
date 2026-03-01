'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const Icons = {
  download: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  error: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  file: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    </svg>
  ),
  image: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  music: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  video: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  pdf: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

export default function SharePage() {
  const { id } = useParams();
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchShare = async () => {
      try {
        const res = await fetch(`/api/share/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Share not found');
        }
        setShare(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchShare();
  }, [id]);

  const ext = share?.fileName?.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isPdf = ext === 'pdf';
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext);
  const isVideo = ['mp4', 'webm', 'mov'].includes(ext);

  const downloadUrl = `/api/share/${id}/download`;

  const getIcon = () => {
    if (isImage) return { icon: Icons.image, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (isPdf) return { icon: Icons.pdf, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' };
    if (isAudio) return { icon: Icons.music, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' };
    if (isVideo) return { icon: Icons.video, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    return { icon: Icons.file, color: 'text-zinc-400', bg: 'bg-white/[0.04] border-white/[0.08]' };
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-white/[0.06] bg-black/60 backdrop-blur-xl shrink-0">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 h-14">
          <a href="/" className="text-lg font-bold tracking-tight hover:text-blue-400 transition-colors">
            GitCloud
          </a>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {loading && (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-sm text-zinc-400">Loading shared file...</span>
          </div>
        )}

        {error && (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              {Icons.error}
            </div>
            <h1 className="text-xl font-semibold mb-2">Link Not Found</h1>
            <p className="text-zinc-500 text-sm mb-6">{error}</p>
            <a href="/" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Go to GitCloud
            </a>
          </div>
        )}

        {share && (
          <div className="w-full max-w-3xl animate-slide-up">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              {/* File header */}
              <div className="p-6 border-b border-white/[0.04]">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${getIcon().bg} ${getIcon().color}`}>
                    {getIcon().icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-semibold truncate">{share.fileName}</h1>
                    <p className="text-zinc-500 text-sm">
                      Shared by <span className="text-zinc-300">@{share.username}</span>
                      {share.fileSize > 0 && <> · {formatBytes(share.fileSize)}</>}
                    </p>
                  </div>
                  <a
                    href={downloadUrl}
                    download={share.fileName}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all shrink-0"
                  >
                    {Icons.download} Download
                  </a>
                </div>
              </div>

              {/* Preview */}
              <div className="p-6">
                {isImage && (
                  <img
                    src={downloadUrl}
                    alt={share.fileName}
                    className="w-full max-h-[70vh] object-contain rounded-xl bg-zinc-900"
                  />
                )}

                {isPdf && (
                  <iframe
                    src={downloadUrl}
                    className="w-full rounded-xl bg-white"
                    style={{ height: '70vh' }}
                    title={share.fileName}
                  />
                )}

                {isVideo && (
                  <video
                    controls
                    src={downloadUrl}
                    className="w-full max-h-[70vh] rounded-xl bg-black"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}

                {isAudio && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      {Icons.music}
                    </div>
                    <audio controls src={downloadUrl} className="w-full max-w-md" preload="metadata" />
                  </div>
                )}

                {!isImage && !isPdf && !isVideo && !isAudio && (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500">
                      {Icons.file}
                    </div>
                    <div>
                      <p className="text-zinc-300 text-sm mb-1">Preview not available for this file type</p>
                      <p className="text-zinc-600 text-xs">Click the download button above to save this file</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-4 text-center text-xs text-zinc-600 shrink-0">
        Shared via <a href="/" className="text-zinc-400 hover:text-white transition-colors">GitCloud</a>
      </footer>
    </div>
  );
}
