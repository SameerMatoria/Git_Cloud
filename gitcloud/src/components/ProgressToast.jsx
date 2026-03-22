'use client';

import { useEffect, useState } from 'react';

const LABELS = {
  upload: { active: 'Uploading files...', done: 'Upload complete!', failed: 'Upload failed', partial: 'Upload finished with errors', past: 'uploaded' },
  delete: { active: 'Deleting files...', done: 'Deleted successfully!', failed: 'Delete failed', partial: 'Delete finished with errors', past: 'deleted' },
  download: { active: 'Downloading...', done: 'Download complete!', failed: 'Download failed', partial: 'Download finished with errors', past: 'downloaded' },
};

const COLORS = {
  upload: { accent: 'blue', spinner: 'text-blue-400' },
  delete: { accent: 'red', spinner: 'text-red-400' },
  download: { accent: 'purple', spinner: 'text-purple-400' },
};

function SingleToast({ state, onClose, action = 'upload' }) {
  const [show, setShow] = useState(false);

  const { status, currentFile, completedCount, totalCount, failedCount, percent } = state || {};
  const label = LABELS[action] || LABELS.upload;
  const color = COLORS[action] || COLORS.upload;

  useEffect(() => {
    if (status === 'active' || status === 'success' || status === 'error') {
      requestAnimationFrame(() => setShow(true));
    }

    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!status) return null;

  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isActive = status === 'active';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const accentColor = color.accent;

  const borderColor = isSuccess ? 'border-emerald-500/30' : isError ? 'border-red-500/30' : `border-${accentColor}-500/30`;
  const bgColor = isSuccess ? 'bg-emerald-500/10' : isError ? 'bg-red-500/10' : `bg-${accentColor}-500/10`;
  const barColor = isSuccess ? 'bg-emerald-500' : isError ? 'bg-red-500' : `bg-${accentColor}-500`;
  const textColor = isSuccess ? 'text-emerald-300' : isError ? 'text-red-300' : `text-${accentColor}-300`;

  // Tailwind safelist: border-blue-500/30 bg-blue-500/10 bg-blue-500 text-blue-300 border-red-500/30 bg-red-500/10 bg-red-500 text-red-300 border-purple-500/30 bg-purple-500/10 bg-purple-500 text-purple-300 text-purple-400

  return (
    <div
      className={`border rounded-xl px-4 py-3 shadow-2xl backdrop-blur-xl w-80 transition-all duration-300 ${borderColor} ${bgColor} ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isActive && (
            <svg className={`animate-spin w-4 h-4 ${color.spinner}`} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isSuccess && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
          {isError && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span className={`text-sm font-medium ${textColor}`}>
            {isActive && label.active}
            {isSuccess && label.done}
            {isError && (failedCount === totalCount ? label.failed : label.partial)}
          </span>
        </div>
        {!isActive && (
          <button onClick={() => { setShow(false); setTimeout(onClose, 300); }} className="text-current opacity-40 hover:opacity-100 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barColor}`}
          style={{ width: `${isSuccess ? 100 : (percent != null ? percent : progress)}%` }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400 truncate max-w-[180px]">
          {isActive && currentFile && currentFile}
          {isSuccess && `${completedCount} file${completedCount !== 1 ? 's' : ''} ${label.past}`}
          {isError && `${completedCount} ${label.past}, ${failedCount} failed`}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {isActive && percent != null && (
            <span className="text-xs font-medium text-zinc-300">{Math.round(percent)}%</span>
          )}
          {totalCount > 0 && (
            <span className="text-xs text-zinc-500">{completedCount}/{totalCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Stack multiple toasts vertically
export default function ProgressToast({ toasts = [] }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-20 right-4 z-[70] flex flex-col gap-3">
      {toasts.map((toast) => (
        <SingleToast key={toast.id} state={toast.state} onClose={toast.onClose} action={toast.action} />
      ))}
    </div>
  );
}

// Also export single toast for backwards compat
export { SingleToast };
