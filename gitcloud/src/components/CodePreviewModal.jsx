'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const LANGUAGE_MAP = {
  js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
  java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp',
  html: 'html', css: 'css', scss: 'scss', json: 'json',
  xml: 'xml', yaml: 'yaml', yml: 'yaml', toml: 'toml',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  sql: 'sql', dockerfile: 'dockerfile', graphql: 'graphql',
  php: 'php', swift: 'swift', kt: 'kotlin', r: 'r',
  vue: 'html', svelte: 'html', env: 'bash',
  txt: 'text', log: 'text', cfg: 'ini', ini: 'ini', conf: 'ini',
};

const Icons = {
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  code: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  markdown: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
    </svg>
  ),
};

export default function CodePreviewModal({ isOpen, onClose, fileName, content, loading, onDownload }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setShow(true));
    else setShow(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ext = fileName?.split('.').pop().toLowerCase();
  const isMarkdown = ['md', 'mdx'].includes(ext);
  const language = LANGUAGE_MAP[ext] || 'text';

  return (
    <div className={`fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col z-50 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-900/80 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
            isMarkdown
              ? 'bg-purple-500/10 border-purple-500/15 text-purple-400'
              : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400'
          }`}>
            {isMarkdown ? Icons.markdown : Icons.code}
          </div>
          <span className="text-sm text-zinc-200 truncate">{fileName}</span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider shrink-0">{ext}</span>
        </div>
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
              title="Download"
            >
              {Icons.download}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white transition-all"
          >
            {Icons.x}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-sm text-zinc-400">Loading file...</span>
            </div>
          </div>
        ) : isMarkdown ? (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ borderRadius: '8px', margin: '1rem 0', fontSize: '0.875rem' }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>{children}</code>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <SyntaxHighlighter
              language={language}
              style={oneDark}
              showLineNumbers
              customStyle={{
                borderRadius: '12px',
                margin: 0,
                fontSize: '0.8125rem',
                lineHeight: '1.6',
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              lineNumberStyle={{ color: '#3f3f46', minWidth: '3em' }}
            >
              {content}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
}
