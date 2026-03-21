'use client';

import { useEffect, useState } from 'react';

export default function UploadProgressToast({ uploadState, onClose }) {
  const [show, setShow] = useState(false);

  const { status, currentFile, completedCount, totalCount, failedCount } = uploadState || {};

  useEffect(() => {
    if (status === 'uploading' || status === 'success' || status === 'error') {
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

  const isUploading = status === 'uploading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const borderColor = isSuccess
    ? 'border-emerald-500/30'
    : isError
    ? 'border-red-500/30'
    : 'border-blue-500/30';

  const bgColor = isSuccess
    ? 'bg-emerald-500/10'
    : isError
    ? 'bg-red-500/10'
    : 'bg-blue-500/10';

  const barColor = isSuccess
    ? 'bg-emerald-500'
    : isError
    ? 'bg-red-500'
    : 'bg-blue-500';

  const textColor = isSuccess
    ? 'text-emerald-300'
    : isError
    ? 'text-red-300'
    : 'text-blue-300';

  return (
    <div className="fixed top-20 right-4 z-[70]">
      <div
        className={`border rounded-xl px-4 py-3 shadow-2xl backdrop-blur-xl w-80 transition-all duration-300 ${borderColor} ${bgColor} ${
          show ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isUploading && (
              <svg className="animate-spin w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none">
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
              {isUploading && 'Uploading files...'}
              {isSuccess && 'Upload complete!'}
              {isError && (failedCount === totalCount ? 'Upload failed' : 'Upload finished with errors')}
            </span>
          </div>
          {!isUploading && (
            <button
              onClick={() => { setShow(false); setTimeout(onClose, 300); }}
              className="text-current opacity-40 hover:opacity-100 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
            style={{ width: `${isSuccess ? 100 : progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 truncate max-w-[200px]">
            {isUploading && currentFile && currentFile}
            {isSuccess && `${completedCount} file${completedCount !== 1 ? 's' : ''} uploaded`}
            {isError && `${completedCount} uploaded, ${failedCount} failed`}
          </p>
          <span className="text-xs text-zinc-500">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>
    </div>
  );
}
