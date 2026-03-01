'use client';

import { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmStyle = 'danger' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') handleClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  const buttonStyles = {
    danger: 'bg-red-500/90 hover:bg-red-500 shadow-lg shadow-red-500/20 hover:shadow-red-500/30',
    success: 'bg-emerald-500/90 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30',
    info: 'bg-blue-500/90 hover:bg-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30',
  };

  const iconMap = {
    danger: (
      <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
    ),
    success: (
      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
    ),
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[60] transition-all duration-200 ${
        show ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-zinc-900/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transition-all duration-200 ${
          show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {iconMap[confirmStyle]}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6 whitespace-pre-wrap leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all"
          >
            Cancel
          </button>
          {onConfirm && (
            <button
              onClick={() => { onConfirm(); handleClose(); }}
              className={`px-4 py-2 text-sm text-white rounded-lg transition-all ${buttonStyles[confirmStyle]}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
