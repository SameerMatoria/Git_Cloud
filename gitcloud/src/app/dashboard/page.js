'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function validateRepoName(name) {
  if (!name.trim()) return 'Repository name is required';
  if (name.length > 100) return 'Name must be 100 characters or fewer';
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return 'Only letters, numbers, hyphens, dots, and underscores allowed';
  if (name.startsWith('.') || name.endsWith('.')) return 'Name cannot start or end with a dot';
  if (name === '.' || name === '..') return 'Invalid repository name';
  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// SVG icons as components
const Icons = {
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  repo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  lock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  globe: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  file: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    </svg>
  ),
  star: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  storage: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
};

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [newRepoName, setNewRepoName] = useState('');
  const [repoNameError, setRepoNameError] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [fileList, setFileList] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateRepo, setShowCreateRepo] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRepo, setSearchRepo] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [repoFilter, setRepoFilter] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState('repos'); // 'repos' | 'upload' | 'search' | 'storage'

  // Modal state
  const [modal, setModal] = useState({ open: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', confirmStyle: 'danger' });
  const openModal = (title, message, onConfirm, confirmText = 'Delete', confirmStyle = 'danger') => {
    setModal({ open: true, title, message, onConfirm, confirmText, confirmStyle });
  };
  const closeModal = () => setModal((prev) => ({ ...prev, open: false }));

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const router = useRouter();
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserAndRepos = async () => {
      try {
        const userRes = await api.get('/api/user');
        setUser(userRes.data);
        const repoRes = await api.get('/api/repos');
        setRepos(repoRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user or repos:', err.message);
        window.location.href = '/login';
      }
    };
    fetchUserAndRepos();
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!dropRef.current?.contains(e.relatedTarget)) setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      const names = oversized.map((f) => f.name).join(', ');
      showToast(`Files too large (max 25 MB): ${names}`, 'error');
      return;
    }
    setFileList(files);
  };

  const handleFileSelect = (e) => {
    processFiles(Array.from(e.target.files));
  };

  const handleFileUpload = async () => {
    if (!selectedRepo) {
      showToast('Select a repository first', 'warning');
      return;
    }
    const formData = new FormData();
    for (const f of fileList) formData.append('files', f);
    formData.append('repo', selectedRepo);
    formData.append('path', '');
    if (commitMessage.trim()) formData.append('commitMessage', commitMessage.trim());

    try {
      setIsUploading(true);
      setUploadStatus('Uploading...');
      await api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadStatus('');
      setFileList([]);
      setCommitMessage('');
      showToast('Upload complete!', 'success');
    } catch (err) {
      console.error(err);
      setUploadStatus('');
      showToast('Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateRepo = async () => {
    const error = validateRepoName(newRepoName);
    if (error) { setRepoNameError(error); return; }
    setRepoNameError('');
    try {
      const res = await api.post('/api/repos', { name: newRepoName });
      setRepos([...repos, res.data.repo]);
      setNewRepoName('');
      setShowCreateRepo(false);
      showToast(`Repository "${res.data.repo.name}" created!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create repo', 'error');
    }
  };

  const handleDeleteRepo = (repoName) => {
    openModal(
      'Delete Repository',
      `Are you sure you want to delete "${repoName}"?\n\nThis will permanently delete the repository and all its contents on GitHub. This action cannot be undone.`,
      async () => {
        try {
          await api.delete('/api/repos', { data: { name: repoName } });
          setRepos(repos.filter((r) => r.name !== repoName));
          showToast(`Repository "${repoName}" deleted.`, 'success');
        } catch (err) {
          showToast(err.response?.data?.error || 'Failed to delete repository', 'error');
        }
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { showToast('Enter a search query', 'warning'); return; }
    try {
      setIsSearching(true);
      const params = { q: searchQuery.trim() };
      if (searchRepo) params.repo = searchRepo;
      const res = await api.get('/api/search', { params });
      setSearchResults(res.data);
    } catch (err) {
      showToast('Search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const filteredRepos = repoFilter
    ? repos.filter((r) => r.name.toLowerCase().includes(repoFilter.toLowerCase()))
    : repos;

  // Stats
  const publicRepos = repos.filter((r) => !r.private).length;
  const privateRepos = repos.filter((r) => r.private).length;
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalStorageKB = repos.reduce((sum, r) => sum + (r.size || 0), 0);
  const sortedBySize = [...repos].sort((a, b) => (b.size || 0) - (a.size || 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-screen-2xl mx-auto px-6 py-10">
          {/* skeleton loading */}
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-72 shrink-0 space-y-4">
              <div className="skeleton h-72 w-full" />
              <div className="skeleton h-24 w-full" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="skeleton h-14 w-full" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={user} />

      <Modal isOpen={modal.open} onClose={closeModal} onConfirm={modal.onConfirm}
        title={modal.title} message={modal.message} confirmText={modal.confirmText} confirmStyle={modal.confirmStyle} />
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={hideToast} />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ─── Left Sidebar ─── */}
          <aside className="w-full lg:w-72 shrink-0 space-y-5 animate-fade-in">
            {/* Profile card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full ring-2 ring-white/10 shadow-xl"
                />
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold truncate">{user.name || user.login}</h1>
                  <p className="text-zinc-500 text-sm">@{user.login}</p>
                </div>
              </div>
              {user.bio && (
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">{user.bio}</p>
              )}
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center py-2 rounded-lg bg-white/[0.03]">
                  <p className="text-base font-semibold">{repos.length}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Folders</p>
                </div>
                <div className="text-center py-2 rounded-lg bg-white/[0.03]">
                  <p className="text-base font-semibold">{publicRepos}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Public</p>
                </div>
                <div className="text-center py-2 rounded-lg bg-white/[0.03]">
                  <p className="text-base font-semibold">{totalStars}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Stars</p>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5 space-y-1">
              {[
                { id: 'repos', label: 'Folders', icon: Icons.repo },
                { id: 'upload', label: 'Upload Files', icon: Icons.upload },
                { id: 'search', label: 'Search Files', icon: Icons.search },
                { id: 'storage', label: 'Storage', icon: Icons.storage },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/[0.08] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="shrink-0 opacity-70">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* GitHub link */}
            <a
              href={`https://github.com/${user.login}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border border-white/[0.04] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
              <span className="ml-auto opacity-50">{Icons.arrow}</span>
            </a>
          </aside>

          {/* ─── Main Content ─── */}
          <main className="flex-1 min-w-0 animate-slide-up">

            {/* ========== REPOS TAB ========== */}
            {activeTab === 'repos' && (
              <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Folders</h2>
                    <p className="text-zinc-500 text-sm mt-1">{repos.length} total folders</p>
                  </div>
                  <button
                    onClick={() => setShowCreateRepo(!showCreateRepo)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
                  >
                    {Icons.plus}
                    New Folder
                  </button>
                </div>

                {/* Create repo panel */}
                {showCreateRepo && (
                  <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] p-5 animate-slide-down">
                    <h3 className="text-sm font-medium text-blue-400 mb-3">Create a new folder</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Repository name"
                          className={`w-full bg-black/40 text-white border rounded-xl px-4 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${
                            repoNameError ? 'border-red-500/50' : 'border-white/[0.08]'
                          }`}
                          value={newRepoName}
                          onChange={(e) => { setNewRepoName(e.target.value); if (repoNameError) setRepoNameError(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCreateRepo(); }}
                          autoFocus
                        />
                        {repoNameError && <p className="text-red-400 text-xs mt-1.5 ml-1">{repoNameError}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowCreateRepo(false); setNewRepoName(''); setRepoNameError(''); }}
                          className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/[0.06] transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateRepo}
                          className="px-5 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-all font-medium"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter bar */}
                <div className="mb-5">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">{Icons.search}</span>
                    <input
                      type="text"
                      placeholder="Find a folder..."
                      className="w-full bg-white/[0.03] text-white border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/10 transition-all"
                      value={repoFilter}
                      onChange={(e) => setRepoFilter(e.target.value)}
                    />
                  </div>
                </div>

                {/* Repo grid */}
                {filteredRepos.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/[0.04] flex items-center justify-center">
                      {Icons.repo}
                    </div>
                    <p className="text-sm">{repoFilter ? 'No folders match your filter.' : 'No folders found.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
                    {filteredRepos.map((repo) => (
                      <div
                        key={repo.id}
                        className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] p-4 transition-all cursor-pointer animate-fade-in"
                        onClick={() => router.push(`/repo?repo=${repo.name}&username=${user.login}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-blue-400 shrink-0">{Icons.repo}</span>
                            <h3 className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 truncate transition-colors">
                              {repo.name}
                            </h3>
                            <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${
                              repo.private
                                ? 'border-amber-500/20 text-amber-400/70 bg-amber-500/5'
                                : 'border-emerald-500/20 text-emerald-400/70 bg-emerald-500/5'
                            }`}>
                              {repo.private ? Icons.lock : Icons.globe}
                              {repo.private ? 'Private' : 'Public'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRepo(repo.name); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete repository"
                          >
                            {Icons.trash}
                          </button>
                        </div>

                        <p className="text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed min-h-[2rem]">
                          {repo.description || 'No description'}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-zinc-600">
                          {repo.language && (
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                { JavaScript: 'bg-yellow-400', TypeScript: 'bg-blue-500', Python: 'bg-green-500', Java: 'bg-orange-500', 'C++': 'bg-pink-500', Ruby: 'bg-red-500', Go: 'bg-cyan-400', Rust: 'bg-orange-600', HTML: 'bg-red-400', CSS: 'bg-purple-400' }[repo.language] || 'bg-zinc-400'
                              }`} />
                              {repo.language}
                            </span>
                          )}
                          {(repo.stargazers_count > 0) && (
                            <span className="flex items-center gap-1 text-amber-500/70">
                              {Icons.star}
                              {repo.stargazers_count}
                            </span>
                          )}
                          {repo.size > 0 && (
                            <span>{formatBytes(repo.size * 1024)}</span>
                          )}
                          <span className="ml-auto">{formatDate(repo.updated_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========== UPLOAD TAB ========== */}
            {activeTab === 'upload' && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Upload Files</h2>
                  <p className="text-zinc-500 text-sm mt-1">Upload files directly to any folder</p>
                </div>

                {/* Repo selector */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Target folder</label>
                  <select
                    className="w-full bg-white/[0.03] text-white border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none cursor-pointer"
                    value={selectedRepo}
                    onChange={(e) => { setSelectedRepo(e.target.value); setFileList([]); }}
                  >
                    <option value="" className="bg-zinc-900">Select a folder</option>
                    {repos.map((repo) => (
                      <option key={repo.id} value={repo.name} className="bg-zinc-900">{repo.name}</option>
                    ))}
                  </select>
                </div>

                {/* Drop zone */}
                {selectedRepo && (
                  <>
                    <div
                      ref={dropRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`drop-zone rounded-2xl p-10 text-center cursor-pointer transition-all ${
                        isDragging ? 'drag-over border-blue-500 bg-blue-500/5' : 'hover:border-zinc-600 hover:bg-white/[0.02]'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all ${
                        isDragging ? 'bg-blue-500/10 text-blue-400' : 'bg-white/[0.04] text-zinc-500'
                      }`}>
                        {Icons.upload}
                      </div>
                      <p className="text-sm text-zinc-300 mb-1">
                        {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
                      </p>
                      <p className="text-xs text-zinc-600">Maximum 25 MB per file</p>
                    </div>

                    {/* File list */}
                    {fileList.length > 0 && (
                      <div className="mt-5 space-y-4">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
                          {Array.from(fileList).map((file, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3">
                              <span className="text-zinc-500 shrink-0">{Icons.file}</span>
                              <span className="text-sm text-zinc-300 truncate flex-1">{file.name}</span>
                              <span className="text-xs text-zinc-600 shrink-0">{formatBytes(file.size)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Commit message */}
                        <input
                          type="text"
                          placeholder="Commit message (optional)"
                          className="w-full bg-white/[0.03] text-white border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                          value={commitMessage}
                          onChange={(e) => setCommitMessage(e.target.value)}
                        />

                        {/* Upload button */}
                        <button
                          onClick={handleFileUpload}
                          disabled={isUploading}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                            isUploading
                              ? 'bg-blue-600/50 cursor-not-allowed text-blue-200'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Uploading {fileList.length} file(s)...
                            </>
                          ) : (
                            <>
                              {Icons.upload}
                              Upload {fileList.length} file(s) to {selectedRepo}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {!selectedRepo && (
                  <div className="text-center py-16 text-zinc-500">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/[0.04] flex items-center justify-center">
                      {Icons.upload}
                    </div>
                    <p className="text-sm">Select a folder above to start uploading</p>
                  </div>
                )}
              </div>
            )}

            {/* ========== SEARCH TAB ========== */}
            {activeTab === 'search' && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Search Files</h2>
                  <p className="text-zinc-500 text-sm mt-1">Search files & folders across your repositories</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">{Icons.search}</span>
                    <input
                      type="text"
                      placeholder="Search for files or folders..."
                      className="w-full bg-white/[0.03] text-white border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                      autoFocus
                    />
                  </div>
                  <select
                    className="bg-white/[0.03] text-white border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none cursor-pointer"
                    value={searchRepo}
                    onChange={(e) => setSearchRepo(e.target.value)}
                  >
                    <option value="" className="bg-zinc-900">All repositories</option>
                    {repos.map((repo) => (
                      <option key={repo.id} value={repo.name} className="bg-zinc-900">{repo.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      isSearching
                        ? 'bg-blue-600/50 cursor-not-allowed text-blue-200'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    }`}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Results */}
                {searchResults && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wider">
                      {searchResults.total_count} result{searchResults.total_count !== 1 ? 's' : ''} found
                    </p>
                    {searchResults.items?.length > 0 ? (
                      <div className="space-y-2 stagger-children">
                        {searchResults.items.map((item) => (
                          <div
                            key={item.sha}
                            onClick={() => router.push(`/repo?repo=${item.repository.name}&username=${user.login}`)}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] cursor-pointer transition-all group animate-fade-in"
                          >
                            <span className="text-zinc-500 shrink-0">{Icons.file}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-blue-400 group-hover:text-blue-300 truncate transition-colors">{item.path}</p>
                              <p className="text-xs text-zinc-600">{item.repository.full_name}</p>
                            </div>
                            <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0">
                              {Icons.arrow}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-zinc-500">
                        <p className="text-sm">No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}

                {!searchResults && (
                  <div className="text-center py-16 text-zinc-500">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/[0.04] flex items-center justify-center">
                      {Icons.search}
                    </div>
                    <p className="text-sm">Enter a search query to find files & folders across your repos</p>
                  </div>
                )}
              </div>
            )}
            {/* ========== STORAGE TAB ========== */}
            {activeTab === 'storage' && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Storage</h2>
                  <p className="text-zinc-500 text-sm mt-1">
                    {formatBytes(totalStorageKB * 1024)} used across {repos.length} folder{repos.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Total storage card */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      {Icons.storage}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatBytes(totalStorageKB * 1024)}</p>
                      <p className="text-xs text-zinc-500">Total storage used</p>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Per-repo breakdown */}
                {sortedBySize.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500">
                    <p className="text-sm">No folders to show storage for.</p>
                  </div>
                ) : (
                  <div className="space-y-2 stagger-children">
                    {sortedBySize.map((repo) => {
                      const sizeKB = repo.size || 0;
                      const pct = totalStorageKB > 0 ? ((sizeKB / totalStorageKB) * 100).toFixed(1) : 0;
                      return (
                        <div
                          key={repo.id}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] p-4 transition-all cursor-pointer animate-fade-in"
                          onClick={() => router.push(`/repo?repo=${repo.name}&username=${user.login}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-blue-400 shrink-0">{Icons.repo}</span>
                              <span className="text-sm font-medium text-zinc-200 truncate">{repo.name}</span>
                              <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${
                                repo.private
                                  ? 'border-amber-500/20 text-amber-400/70 bg-amber-500/5'
                                  : 'border-emerald-500/20 text-emerald-400/70 bg-emerald-500/5'
                              }`}>
                                {repo.private ? 'Private' : 'Public'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-zinc-500">{pct}%</span>
                              <span className="text-sm font-medium text-zinc-300 w-20 text-right">{formatBytes(sizeKB * 1024)}</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500/80 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
