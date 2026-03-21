'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import api, { directApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import ProgressToast from '@/components/ProgressToast';
import CodePreviewModal from '@/components/CodePreviewModal';

// ── Icons ──────────────────────────────────────────────────────
const Icons = {
  folder: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  file: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  music: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  video: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  download: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  rename: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  chevronRight: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  chevronLeft: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronLeftLg: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronRightLg: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  play: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  back: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  more: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  upload: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  pdf: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15h2a1 1 0 0 0 0-2H9v4" /><path d="M17 13h-2v4h2a2 2 0 0 0 0-4z" />
    </svg>
  ),
  code: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  markdown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
    </svg>
  ),
  share: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  folderPlus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  ),
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function RepoPage() {
  const router = useRouter();
  const params = useSearchParams();

  const repo = params.get('repo');
  const path = params.get('path') || '';
  const username = params.get('username');

  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [pdfModal, setPdfModal] = useState({ open: false, url: null, name: '', loading: false });
  const [activeMenu, setActiveMenu] = useState(null); // sha of file with open menu
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // Code/Markdown preview
  const [codePreview, setCodePreview] = useState({ open: false, fileName: '', content: '', loading: false });

  // Share modal
  const [shareModal, setShareModal] = useState({ open: false, url: '', loading: false });

  // Rename state
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');

  // Filter/search within folder
  const [filterQuery, setFilterQuery] = useState('');

  // View mode for images: 'small' | 'medium' | 'large' | 'list'
  const [imageView, setImageView] = useState('medium');

  // Folder upload
  const folderUploadRef = useRef(null);
  const [uploadingFolder, setUploadingFolder] = useState(null); // folder path currently uploading to

  // New folder creation
  const [newFolderName, setNewFolderName] = useState(null); // null = modal closed, string = modal open
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Multi-select
  const [selectedFiles, setSelectedFiles] = useState(new Set());

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

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(null);
  const clearUploadProgress = useCallback(() => setUploadProgress(null), []);

  // Delete progress state
  const [deleteProgress, setDeleteProgress] = useState(null);
  const clearDeleteProgress = useCallback(() => setDeleteProgress(null), []);

  // Fetch data
  useEffect(() => {
    if (!repo) return;
    setLoading(true);
    setSelectedFiles(new Set());
    const fetchData = async () => {
      try {
        const [contentsRes, branchRes] = await Promise.all([
          api.get(`/api/contents?repo=${repo}&path=${path}`),
          api.get(`/api/default-branch?repo=${repo}`),
        ]);
        setContents(Array.isArray(contentsRes.data) ? contentsRes.data : []);
        setDefaultBranch(branchRes.data.default_branch);
      } catch (err) {
        console.error('Error fetching data:', err);
        setContents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [repo, path]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
        setRenamingFile(null);
        setActiveMenu(null);
        closePdfViewer();
        closeCodePreview();
        setShareModal({ open: false, url: '', loading: false });
      }
      if (selectedImageIndex !== null) {
        if (e.key === 'ArrowLeft') setSelectedImageIndex((prev) => (prev - 1 + imageFiles.length) % imageFiles.length);
        if (e.key === 'ArrowRight') setSelectedImageIndex((prev) => (prev + 1) % imageFiles.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    if (activeMenu) window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [activeMenu]);

  const handleFolderClick = (item) => {
    router.push(`/repo?repo=${repo}&path=${item.path}&username=${username}`);
  };

  const handleDelete = (file) => {
    openModal(
      'Delete File',
      `Are you sure you want to delete "${file.name}"? This cannot be undone.`,
      async () => {
        if (file._isChunked) {
          // Delete all chunks + manifest
          const chunkPattern = new RegExp(`^${file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.chunk\\.\\d{3}$`);
          const relatedFiles = contents.filter((item) => chunkPattern.test(item.name) || item.name === file._originalManifestName);
          const total = relatedFiles.length;
          let completed = 0;
          let failed = 0;
          setDeleteProgress({ status: 'active', currentFile: file.name, completedCount: 0, totalCount: total, failedCount: 0 });

          for (const chunk of relatedFiles) {
            try {
              await api.delete('/api/delete-file', { data: { repo, path: chunk.path, sha: chunk.sha } });
              completed++;
            } catch { failed++; }
            setDeleteProgress((prev) => ({ ...prev, completedCount: completed, failedCount: failed }));
          }
          setDeleteProgress((prev) => ({ ...prev, status: failed > 0 ? 'error' : 'success', currentFile: '' }));
        } else {
          setDeleteProgress({ status: 'active', currentFile: file.name, completedCount: 0, totalCount: 1, failedCount: 0 });
          try {
            await api.delete('/api/delete-file', { data: { repo, path: file.path, sha: file.sha } });
            setDeleteProgress({ status: 'success', currentFile: '', completedCount: 1, totalCount: 1, failedCount: 0 });
          } catch (err) {
            setDeleteProgress({ status: 'error', currentFile: '', completedCount: 0, totalCount: 1, failedCount: 1 });
          }
        }
        const updated = await api.get(`/api/contents?repo=${repo}&path=${path}`);
        setContents(Array.isArray(updated.data) ? updated.data : []);
      }
    );
  };

  const toggleSelect = (sha) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(sha)) next.delete(sha);
      else next.add(sha);
      return next;
    });
  };

  const allFiles = contents.filter((item) => item.type !== 'dir');

  const toggleSelectAll = () => {
    if (selectedFiles.size === allFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(allFiles.map((f) => f.sha)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFiles.size === 0) return;
    const toDelete = allFiles.filter((f) => selectedFiles.has(f.sha));

    openModal(
      'Delete Selected Files',
      `Are you sure you want to delete ${toDelete.length} file(s)? This cannot be undone.`,
      async () => {
        const total = toDelete.length;
        let completed = 0;
        let failed = 0;

        setDeleteProgress({ status: 'active', currentFile: toDelete[0].name, completedCount: 0, totalCount: total, failedCount: 0 });

        for (const file of toDelete) {
          setDeleteProgress((prev) => ({ ...prev, currentFile: file.name }));
          try {
            await api.delete('/api/delete-file', { data: { repo, path: file.path, sha: file.sha } });
            completed++;
          } catch {
            failed++;
          }
          setDeleteProgress((prev) => ({ ...prev, completedCount: completed, failedCount: failed }));
        }

        setDeleteProgress((prev) => ({
          ...prev,
          status: failed === total ? 'error' : failed > 0 ? 'error' : 'success',
          currentFile: '',
        }));

        setSelectedFiles(new Set());
        try {
          const updated = await api.get(`/api/contents?repo=${repo}&path=${path}`);
          setContents(Array.isArray(updated.data) ? updated.data : []);
        } catch {}
      },
      'Delete',
      'danger'
    );
  };

  const handleCreateFolder = async () => {
    const name = newFolderName?.trim();
    if (!name) return;
    if (/[/\\]/.test(name)) {
      showToast('Folder name cannot contain / or \\', 'error');
      return;
    }
    setCreatingFolder(true);
    try {
      await api.post('/api/create-folder', { repo, path, folderName: name });
      const updated = await api.get(`/api/contents?repo=${repo}&path=${path}`);
      setContents(Array.isArray(updated.data) ? updated.data : []);
      setNewFolderName(null);
      showToast(`Folder "${name}" created!`, 'success');
    } catch (err) {
      console.error('Create folder error:', err.response?.data || err.message);
      showToast('Failed to create folder.', 'error');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = (folder) => {
    openModal(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}" and all its contents? This cannot be undone.`,
      async () => {
        try {
          await api.delete('/api/delete-folder', { data: { repo, path: folder.path } });
          showToast(`Folder "${folder.name}" deleted!`, 'success');
          const updated = await api.get(`/api/contents?repo=${repo}&path=${path}`);
          setContents(Array.isArray(updated.data) ? updated.data : []);
        } catch (err) {
          showToast(`Failed to delete folder: ${err.response?.data?.error || err.message}`, 'error');
        }
      },
      'Delete',
      'danger'
    );
  };

  const handleDownload = async (file) => {
    try {
      let res;
      if (file._isChunked) {
        // Chunked file: use chunked download endpoint
        res = await api.get(`/api/download-chunked?repo=${repo}&manifestPath=${encodeURIComponent(file._manifestPath)}`, { responseType: 'blob' });
      } else if (file.download_url) {
        // Use GitHub's direct download URL (works for both public & private repos)
        res = await axios.get(file.download_url, { responseType: 'blob' });
      } else {
        // Fallback to backend proxy
        res = await api.get(`/api/download?repo=${repo}&path=${file.path}`, { responseType: 'blob' });
      }
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Download failed', 'error');
    }
  };

  const handleRenameStart = (file) => {
    setRenamingFile(file);
    setNewFileName(file.name);
    setActiveMenu(null);
  };

  const handleRenameSubmit = async () => {
    if (!renamingFile || !newFileName.trim()) return;
    if (newFileName === renamingFile.name) { setRenamingFile(null); return; }

    const oldPath = renamingFile.path;
    const parts = oldPath.split('/');
    parts[parts.length - 1] = newFileName.trim();
    const newPath = parts.join('/');

    try {
      await api.put('/api/rename-file', { repo, oldPath, newPath });
      showToast(`Renamed to "${newFileName.trim()}"`, 'success');
      setRenamingFile(null);
      const updated = await api.get(`/api/contents?repo=${repo}&path=${path}`);
      setContents(Array.isArray(updated.data) ? updated.data : []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Rename failed', 'error');
    }
  };

  const handleFolderUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || uploadingFolder === null) return;

    const fileList = Array.from(files);
    const total = fileList.length;
    let completed = 0;
    let failed = 0;

    // Calculate total bytes for overall percentage
    // Each file counts twice: once for HTTP upload (50%), once for server processing (50%)
    const totalBytes = fileList.reduce((sum, f) => sum + f.size, 0);
    let completedBytes = 0; // bytes fully done (uploaded + processed by server)
    let lastReportedPercent = 0;

    setUploadProgress({ status: 'active', currentFile: fileList[0].name, completedCount: 0, totalCount: total, failedCount: 0, percent: 0 });

    const CHUNK_SIZE = 20 * 1024 * 1024;

    const trackProgress = (fileIndex, fileSize) => ({
      onUploadProgress: (e) => {
        // HTTP upload = first half of progress for this file's portion
        const httpProgress = (e.loaded / e.total) * fileSize * 0.5;
        const currentPercent = ((completedBytes + httpProgress) / totalBytes) * 100;
        const clamped = Math.min(Math.max(currentPercent, lastReportedPercent), 99.9);
        lastReportedPercent = clamped;
        setUploadProgress((prev) => ({ ...prev, percent: clamped }));
      },
    });

    for (let fi = 0; fi < fileList.length; fi++) {
      const file = fileList[fi];
      setUploadProgress((prev) => ({ ...prev, currentFile: file.name }));

      try {
        if (file.size > CHUNK_SIZE) {
          // Large file: upload in chunks
          const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
          const chunkRepos = {}; // Track which repo each chunk went to

          for (let i = 0; i < totalChunks; i++) {
            setUploadProgress((prev) => ({ ...prev, currentFile: `${file.name} (chunk ${i + 1}/${totalChunks})` }));
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunkBlob = file.slice(start, end);
            const chunkSize = end - start;
            const chunkNum = String(i + 1).padStart(3, '0');

            const formData = new FormData();
            formData.append('chunk', chunkBlob, `${file.name}.chunk.${chunkNum}`);
            formData.append('repo', repo);
            formData.append('path', uploadingFolder || '');
            formData.append('chunkIndex', i);
            formData.append('totalChunks', totalChunks);
            formData.append('fileName', file.name);
            formData.append('totalSize', file.size);

            const chunkRes = await directApi.post('/api/upload-chunk', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              ...trackProgress(fi, chunkSize),
            });
            // Track which repo this chunk was stored in
            if (chunkRes.data.targetRepo && chunkRes.data.targetRepo !== repo) {
              chunkRepos[chunkNum] = chunkRes.data.targetRepo;
            }
            // Server responded — this chunk is fully done
            completedBytes += chunkSize;
            lastReportedPercent = (completedBytes / totalBytes) * 100;
            setUploadProgress((prev) => ({ ...prev, percent: Math.min(lastReportedPercent, 99.9) }));
          }

          // Create manifest in the primary repo after all chunks succeed
          setUploadProgress((prev) => ({ ...prev, currentFile: `${file.name} (creating manifest...)` }));
          await api.post('/api/create-manifest', {
            repo,
            path: uploadingFolder || '',
            fileName: file.name,
            totalSize: file.size,
            totalChunks,
            chunkRepos,
          });
        } else {
          // Normal file
          const formData = new FormData();
          formData.append('repo', repo);
          if (uploadingFolder) formData.append('path', uploadingFolder);
          formData.append('files', file);
          await directApi.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            ...trackProgress(fi, file.size),
          });
          // Server responded — file is fully done
          completedBytes += file.size;
          lastReportedPercent = (completedBytes / totalBytes) * 100;
          setUploadProgress((prev) => ({ ...prev, percent: Math.min(lastReportedPercent, 99.9) }));
        }
        completed++;
      } catch {
        failed++;
        completedBytes += file.size;
      }

      setUploadProgress((prev) => ({ ...prev, completedCount: completed, failedCount: failed }));
    }

    setUploadProgress((prev) => ({
      ...prev,
      status: failed === total ? 'error' : failed > 0 ? 'error' : 'success',
      currentFile: '',
      percent: 100,
    }));

    // Refresh contents
    try {
      const updated = await api.get(`/api/contents?repo=${repo}&path=${path}`);
      setContents(Array.isArray(updated.data) ? updated.data : []);
    } catch {}

    setUploadingFolder(null);
    if (folderUploadRef.current) folderUploadRef.current.value = '';
  };

  const getRawUrl = (item) =>
    `https://raw.githubusercontent.com/${username}/${repo}/${defaultBranch}/${item.path}`;

  const openPdfViewer = async (item) => {
    setPdfModal({ open: true, url: null, name: item.name, loading: true });
    try {
      const res = await fetch(`/api/preview?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(item.path)}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      setPdfModal({ open: true, url, name: item.name, loading: false });
    } catch (err) {
      showToast('Failed to load PDF', 'error');
      setPdfModal({ open: false, url: null, name: '', loading: false });
    }
  };

  const closePdfViewer = () => {
    if (pdfModal.url) URL.revokeObjectURL(pdfModal.url);
    setPdfModal({ open: false, url: null, name: '', loading: false });
  };

  // Code/Markdown preview
  const MARKDOWN_EXTS = /\.(md|mdx)$/i;
  const CODE_EXTS = /\.(js|jsx|ts|tsx|py|rb|go|rs|java|c|cpp|cs|html|css|scss|json|xml|yaml|yml|toml|sh|bash|sql|dockerfile|graphql|vue|svelte|php|swift|kt|r|lua|pl|env|gitignore|txt|log|cfg|ini|conf)$/i;

  const openCodePreview = async (item) => {
    setCodePreview({ open: true, fileName: item.name, content: '', loading: true });
    try {
      const res = await fetch(`/api/preview?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(item.path)}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const text = await res.text();
      setCodePreview({ open: true, fileName: item.name, content: text, loading: false });
    } catch {
      showToast('Failed to load file preview', 'error');
      setCodePreview({ open: false, fileName: '', content: '', loading: false });
    }
  };

  const closeCodePreview = () => setCodePreview({ open: false, fileName: '', content: '', loading: false });

  // Share handler
  const handleShare = async (file) => {
    setShareModal({ open: true, url: '', loading: true });
    setActiveMenu(null);
    try {
      const res = await api.post('/api/share', {
        repo,
        filePath: file.path,
        fileName: file.name,
        fileSize: file.size,
      });
      setShareModal({ open: true, url: res.data.shareUrl, loading: false });
    } catch {
      showToast('Failed to create share link', 'error');
      setShareModal({ open: false, url: '', loading: false });
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareModal.url);
    showToast('Link copied to clipboard!', 'success');
  };

  // ── Process chunked files: hide chunks, show manifests as virtual files ──
  const processedContents = (() => {
    const manifests = contents.filter((item) => item.name.endsWith('.manifest.json'));
    const chunkPattern = /\.chunk\.\d{3}$/;
    const manifestNames = new Set(manifests.map((m) => m.name.replace('.manifest.json', '')));

    // Filter out raw chunks and manifest files
    const regular = contents.filter((item) =>
      !chunkPattern.test(item.name) && !item.name.endsWith('.manifest.json')
    );

    // Create virtual entries for chunked files from manifests
    const virtualEntries = manifests.map((manifest) => {
      const originalName = manifest.name.replace('.manifest.json', '');
      // Count matching chunks to estimate size
      const chunks = contents.filter((item) => item.name.startsWith(originalName + '.chunk.'));
      const totalSize = chunks.reduce((sum, c) => sum + (c.size || 0), 0);
      return {
        ...manifest,
        name: originalName,
        size: totalSize,
        _isChunked: true,
        _manifestPath: manifest.path,
        _originalManifestName: manifest.name,
      };
    });

    return [...regular, ...virtualEntries];
  })();

  // ── Filter + categorize contents ──
  const q = filterQuery.toLowerCase();
  const filtered = q ? processedContents.filter((item) => item.name.toLowerCase().includes(q)) : processedContents;

  const folders = filtered.filter((item) => item.type === 'dir');
  const imageFiles = filtered.filter((item) => item.type !== 'dir' && item.name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i));
  const audioFiles = filtered.filter((item) => item.type !== 'dir' && item.name.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i));
  const videoFiles = filtered.filter((item) => item.type !== 'dir' && item.name.match(/\.(mp4|webm|mov|avi|mkv)$/i));
  const pdfFiles = filtered.filter((item) => item.type !== 'dir' && item.name.match(/\.pdf$/i));
  const markdownFiles = filtered.filter((item) => item.type !== 'dir' && item.name.match(MARKDOWN_EXTS));
  const codeFiles = filtered.filter((item) => item.type !== 'dir' && item.name.match(CODE_EXTS) && !item.name.match(MARKDOWN_EXTS));
  const otherFiles = filtered.filter((item) =>
    item.type !== 'dir' &&
    !item.name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i) &&
    !item.name.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i) &&
    !item.name.match(/\.(mp4|webm|mov|avi|mkv)$/i) &&
    !item.name.match(/\.pdf$/i) &&
    !item.name.match(MARKDOWN_EXTS) &&
    !item.name.match(CODE_EXTS)
  );

  const totalFiles = filtered.filter((i) => i.type !== 'dir').length;

  // ── Breadcrumbs ──
  const pathParts = path ? path.split('/') : [];
  const breadcrumbs = [
    { label: repo, path: '' },
    ...pathParts.map((part, i) => ({
      label: part,
      path: pathParts.slice(0, i + 1).join('/'),
    })),
  ];

  // ── Close menu on outside click or scroll ──
  const menuPortalRef = useRef(null);
  useEffect(() => {
    if (!activeMenu) return;
    const handleClickOutside = (e) => {
      if (menuPortalRef.current && !menuPortalRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    const handleScroll = () => setActiveMenu(null);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeMenu]);

  // ── Context menu button ──
  const FileActionMenu = ({ item }) => {
    const btnRef = useRef(null);

    const handleToggle = (e) => {
      e.stopPropagation();
      if (activeMenu === item.sha) {
        setActiveMenu(null);
      } else {
        const rect = btnRef.current.getBoundingClientRect();
        const menuWidth = 176;
        const menuHeight = 140;
        let top = rect.bottom + 4;
        let left = rect.right - menuWidth;
        if (left < 8) left = 8;
        if (top + menuHeight > window.innerHeight) top = rect.top - menuHeight - 4;
        setMenuPos({ top, left });
        setActiveMenu(item.sha);
      }
    };

    return (
      <div className="shrink-0">
        <button
          ref={btnRef}
          onClick={handleToggle}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          {Icons.more}
        </button>
      </div>
    );
  };

  // Find the active menu item from all content
  const activeMenuItem = activeMenu ? processedContents.find((c) => c.sha === activeMenu) : null;

  // ── Section header ──
  const SectionHeader = ({ icon, title, count, children }) => (
    <div className="flex items-center justify-between mb-4 mt-10 first:mt-0">
      <div className="flex items-center gap-2.5">
        <span className="text-zinc-500">{icon}</span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <span className="text-xs text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <Modal isOpen={modal.open} onClose={closeModal} onConfirm={modal.onConfirm}
        title={modal.title} message={modal.message} confirmText={modal.confirmText} confirmStyle={modal.confirmStyle} />
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={hideToast} />
      <ProgressToast state={uploadProgress} onClose={clearUploadProgress} action="upload" />
      {!uploadProgress && <ProgressToast state={deleteProgress} onClose={clearDeleteProgress} action="delete" />}

      {/* Hidden file input for folder uploads */}
      <input type="file" ref={folderUploadRef} multiple className="hidden" onChange={handleFolderUpload} />

      {/* ── File action dropdown (portal) ── */}
      {activeMenuItem && createPortal(
        <div
          ref={menuPortalRef}
          className="fixed w-44 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl py-1 animate-scale-in"
          style={{ top: menuPos.top, left: menuPos.left, zIndex: 99999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { handleDownload(activeMenuItem); setActiveMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            {Icons.download} Download
          </button>
          <button
            onClick={() => { handleShare(activeMenuItem); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            {Icons.share} Share
          </button>
          <button
            onClick={() => { handleRenameStart(activeMenuItem); setActiveMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            {Icons.rename} Rename
          </button>
          <div className="my-1 border-t border-white/[0.06]" />
          <button
            onClick={() => { handleDelete(activeMenuItem); setActiveMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-all"
          >
            {Icons.trash} Delete
          </button>
        </div>,
        document.body
      )}

      {/* ── Code/Markdown Preview Modal ── */}
      <CodePreviewModal
        isOpen={codePreview.open}
        onClose={closeCodePreview}
        fileName={codePreview.fileName}
        content={codePreview.content}
        loading={codePreview.loading}
        onDownload={() => {
          const item = processedContents.find((c) => c.name === codePreview.fileName);
          if (item) handleDownload(item);
        }}
      />

      {/* ── New Folder Modal ── */}
      {newFolderName !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setNewFolderName(null)}>
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              {Icons.folderPlus}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">New Folder</h3>
            <p className="text-zinc-500 text-sm mb-4">{path ? `Inside ${path}/` : 'In repository root'}</p>
            <input
              type="text"
              className="w-full bg-black/40 text-white border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all mb-4"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNewFolderName(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder || !newFolderName?.trim()}
                className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-emerald-500/20 transition-all font-medium"
              >
                {creatingFolder ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Modal ── */}
      {shareModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShareModal({ open: false, url: '', loading: false })}>
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              {Icons.share}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Share File</h3>
            {shareModal.loading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                <span className="text-sm text-zinc-400">Generating share link...</span>
              </div>
            ) : (
              <>
                <p className="text-zinc-400 text-sm mb-4">Anyone with this link can view and download the file.</p>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={shareModal.url}
                    className="flex-1 bg-black/40 text-white border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-4 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-all font-medium shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setShareModal({ open: false, url: '', loading: false })}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rename Modal ── */}
      {renamingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setRenamingFile(null)}>
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              {Icons.rename}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Rename File</h3>
            <p className="text-zinc-500 text-sm mb-4">{renamingFile.name}</p>
            <input
              type="text"
              className="w-full bg-black/40 text-white border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all mb-4"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); }}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRenamingFile(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all">
                Cancel
              </button>
              <button onClick={handleRenameSubmit} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all">
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Lightbox ── */}
      {selectedImageIndex !== null && imageFiles[selectedImageIndex] && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setSelectedImageIndex(null)}>
          {/* Close */}
          <button onClick={() => setSelectedImageIndex(null)} className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white transition-all z-10">
            {Icons.x}
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-5 text-sm text-zinc-400 bg-white/[0.06] px-3 py-1.5 rounded-full">
            {selectedImageIndex + 1} / {imageFiles.length}
          </div>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((prev) => (prev - 1 + imageFiles.length) % imageFiles.length); }}
            className="absolute left-4 p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white transition-all"
          >
            {Icons.chevronLeftLg}
          </button>

          {/* Image */}
          <img
            src={getRawUrl(imageFiles[selectedImageIndex])}
            alt={imageFiles[selectedImageIndex].name}
            className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((prev) => (prev + 1) % imageFiles.length); }}
            className="absolute right-4 p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white transition-all"
          >
            {Icons.chevronRightLg}
          </button>

          {/* File name + download */}
          <div className="absolute bottom-6 flex items-center gap-3 bg-white/[0.06] backdrop-blur-xl px-4 py-2.5 rounded-xl">
            <span className="text-sm text-zinc-300">{imageFiles[selectedImageIndex].name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(imageFiles[selectedImageIndex]); }}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {Icons.download}
            </button>
          </div>
        </div>
      )}

      {/* ── PDF Viewer Modal ── */}
      {pdfModal.open && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-zinc-900/80 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/15 flex items-center justify-center text-orange-400 shrink-0">
                {Icons.pdf}
              </div>
              <span className="text-sm text-zinc-200 truncate">{pdfModal.name}</span>
            </div>
            <button
              onClick={closePdfViewer}
              className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white transition-all"
            >
              {Icons.x}
            </button>
          </div>

          {/* PDF Content */}
          <div className="flex-1 relative">
            {pdfModal.loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin" />
                  <span className="text-sm text-zinc-400">Loading PDF...</span>
                </div>
              </div>
            )}
            {pdfModal.url && (
              <iframe
                src={pdfModal.url}
                className="w-full h-full bg-white"
                title={pdfModal.name}
                style={{ border: 'none' }}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumbs + actions header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back button */}
            {path && (
              <button
                onClick={() => {
                  const parentPath = pathParts.slice(0, -1).join('/');
                  router.push(`/repo?repo=${repo}&path=${parentPath}&username=${username}`);
                }}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-all shrink-0"
              >
                {Icons.back}
              </button>
            )}

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-zinc-600 shrink-0">{Icons.chevronRight}</span>}
                  {i < breadcrumbs.length - 1 ? (
                    <button
                      onClick={() => router.push(`/repo?repo=${repo}&path=${crumb.path}&username=${username}`)}
                      className="text-zinc-400 hover:text-white truncate transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-white font-medium truncate">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Search + Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                {Icons.search}
              </span>
              <input
                type="text"
                placeholder="Filter files & folders..."
                className="w-full sm:w-52 bg-white/[0.03] text-white border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setNewFolderName('')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all"
            >
              {Icons.folderPlus} <span className="hidden sm:inline">New</span> Folder
            </button>
            <button
              onClick={() => { setUploadingFolder(path); folderUploadRef.current?.click(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all"
            >
              {Icons.upload} Import
            </button>
            <button
              onClick={toggleSelectAll}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedFiles.size > 0
                  ? 'text-white bg-blue-500/20 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
              }`}
            >
              {selectedFiles.size === allFiles.length && allFiles.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && contents.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-600">
              {Icons.folder}
            </div>
            <p className="text-zinc-500 text-sm">This folder is empty</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* ── No filter results ── */}
        {!loading && contents.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-600">
              {Icons.search}
            </div>
            <p className="text-zinc-500 text-sm">No files or folders match "{filterQuery}"</p>
            <button
              onClick={() => setFilterQuery('')}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear filter
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="animate-slide-up">

            {/* ── FOLDERS ── */}
            {folders.length > 0 && (
              <>
                <SectionHeader icon={Icons.folder} title="Folders" count={folders.length} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 stagger-children">
                  {folders.map((item) => (
                    <div
                      key={item.sha}
                      className="group flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all animate-fade-in"
                    >
                      <button
                        onClick={() => handleFolderClick(item)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
                          {Icons.folder}
                        </div>
                        <span className="text-sm text-zinc-200 group-hover:text-white truncate transition-colors">{item.name}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadingFolder(item.path); folderUploadRef.current?.click(); }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all shrink-0"
                        title="Import files to this folder"
                      >
                        {Icons.upload}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(item); }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                        title="Delete folder"
                      >
                        {Icons.trash}
                      </button>
                      <span className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0 cursor-pointer" onClick={() => handleFolderClick(item)}>{Icons.chevronRight}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── OTHER FILES ── */}
            {otherFiles.length > 0 && (
              <>
                <SectionHeader icon={Icons.file} title="Files" count={otherFiles.length} />
                <div className="space-y-1 stagger-children">
                  {otherFiles.map((item) => (
                    <div key={item.sha} className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all animate-fade-in ${
                      selectedFiles.has(item.sha) ? 'border-blue-500/30 bg-blue-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
                    }`}>
                      <button onClick={() => toggleSelect(item.sha)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                        selectedFiles.has(item.sha) ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-600 hover:border-zinc-400'
                      }`}>
                        {selectedFiles.has(item.sha) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </button>
                      <span className="text-zinc-500 shrink-0">{Icons.file}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">{item.name}</p>
                        <p className="text-[11px] text-zinc-600">{formatBytes(item.size)}</p>
                      </div>
                      <FileActionMenu item={item} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── IMAGES ── */}
            {imageFiles.length > 0 && (
              <>
                <SectionHeader icon={Icons.image} title="Images" count={imageFiles.length}>
                  <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5">
                    {[
                      { id: 'small', label: 'S' },
                      { id: 'medium', label: 'M' },
                      { id: 'large', label: 'L' },
                      { id: 'list', label: 'List' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setImageView(opt.id)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-all ${imageView === opt.id ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </SectionHeader>

                {imageView !== 'list' ? (
                  <div className={`grid stagger-children ${
                    imageView === 'small'
                      ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1'
                      : imageView === 'large'
                        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'
                        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'
                  }`}>
                    {imageFiles.map((item, index) => (
                      <div key={item.sha} className={`group relative rounded-xl overflow-hidden border animate-fade-in ${
                        selectedFiles.has(item.sha) ? 'border-blue-500/40 ring-1 ring-blue-500/30' : 'border-white/[0.06] bg-white/[0.02]'
                      }`}>
                        {/* Select checkbox */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(item.sha); }}
                          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            selectedFiles.has(item.sha)
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'border-white/40 bg-black/40 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {selectedFiles.has(item.sha) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                        </button>
                        <div className="aspect-square cursor-pointer overflow-hidden" onClick={() => setSelectedImageIndex(index)}>
                          <img
                            src={getRawUrl(item)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white truncate mb-1.5">{item.name}</p>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }} className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition-all" title="Download">
                              {Icons.download}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleRenameStart(item); }} className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition-all" title="Rename">
                              {Icons.rename}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="p-1 rounded bg-red-500/30 hover:bg-red-500/50 text-white transition-all" title="Delete">
                              {Icons.trash}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 stagger-children">
                    {imageFiles.map((item, index) => (
                      <div key={item.sha} className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all animate-fade-in ${
                        selectedFiles.has(item.sha) ? 'border-blue-500/30 bg-blue-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
                      }`}>
                        <button onClick={() => toggleSelect(item.sha)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                          selectedFiles.has(item.sha) ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-600 hover:border-zinc-400'
                        }`}>
                          {selectedFiles.has(item.sha) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                        </button>
                        <img
                          src={getRawUrl(item)}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 cursor-pointer ring-1 ring-white/10"
                          onClick={() => setSelectedImageIndex(index)}
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 truncate">{item.name}</p>
                          <p className="text-[11px] text-zinc-600">{formatBytes(item.size)}</p>
                        </div>
                        <FileActionMenu item={item} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── AUDIO ── */}
            {audioFiles.length > 0 && (
              <>
                <SectionHeader icon={Icons.music} title="Audio" count={audioFiles.length} />
                <div className="space-y-2 stagger-children">
                  {audioFiles.map((item) => (
                    <div key={item.sha} className={`rounded-xl border p-4 animate-fade-in ${
                      selectedFiles.has(item.sha) ? 'border-blue-500/30 bg-blue-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02]'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button onClick={() => toggleSelect(item.sha)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                            selectedFiles.has(item.sha) ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-600 hover:border-zinc-400'
                          }`}>
                            {selectedFiles.has(item.sha) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                          </button>
                          <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
                            {Icons.music}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-zinc-200 truncate">{item.name}</p>
                            <p className="text-[11px] text-zinc-600">{formatBytes(item.size)}</p>
                          </div>
                        </div>
                        <FileActionMenu item={item} />
                      </div>
                      <audio controls src={getRawUrl(item)} className="w-full h-10 [&::-webkit-media-controls-panel]:bg-zinc-800 rounded-lg" preload="none" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── VIDEO ── */}
            {videoFiles.length > 0 && (
              <>
                <SectionHeader icon={Icons.video} title="Videos" count={videoFiles.length} />
                <div className="space-y-2 stagger-children">
                  {videoFiles.map((item) => {
                    const isActive = selectedVideo === item.path;
                    return (
                      <div key={item.sha} className={`rounded-xl border animate-fade-in ${
                        selectedFiles.has(item.sha) ? 'border-blue-500/30 bg-blue-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02]'
                      }`}>
                        {/* Video header */}
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <button onClick={() => toggleSelect(item.sha)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                              selectedFiles.has(item.sha) ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-600 hover:border-zinc-400'
                            }`}>
                              {selectedFiles.has(item.sha) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                            </button>
                          <button
                            onClick={() => setSelectedVideo(isActive ? null : item.path)}
                            className="flex items-center gap-3 min-w-0 group"
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                              isActive
                                ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                                : 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-400'
                            }`}>
                              {isActive ? Icons.video : Icons.play}
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="text-sm text-zinc-200 group-hover:text-white truncate transition-colors">{item.name}</p>
                              <p className="text-[11px] text-zinc-600">{formatBytes(item.size)}</p>
                            </div>
                          </button>
                          </div>
                          <FileActionMenu item={item} />
                        </div>

                        {/* Expanded video player */}
                        {isActive && (
                          <div className="px-4 pb-4 animate-fade-in">
                            <video
                              controls
                              src={getRawUrl(item)}
                              className="w-full max-h-[60vh] rounded-xl bg-black"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── PDF / DOCUMENTS ── */}
            {pdfFiles.length > 0 && (
              <>
                <SectionHeader icon={Icons.pdf} title="Documents" count={pdfFiles.length} />
                <div className="space-y-1 stagger-children">
                  {pdfFiles.map((item) => (
                    <div key={item.sha} className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all animate-fade-in ${
                      selectedFiles.has(item.sha) ? 'border-blue-500/30 bg-blue-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
                    }`}>
                      <button onClick={() => toggleSelect(item.sha)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                        selectedFiles.has(item.sha) ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-600 hover:border-zinc-400'
                      }`}>
                        {selectedFiles.has(item.sha) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </button>
                      <button
                        onClick={() => openPdfViewer(item)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/15 flex items-center justify-center text-orange-400 shrink-0">
                          {Icons.pdf}
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-sm text-zinc-300 truncate">{item.name}</p>
                          <p className="text-[11px] text-zinc-600">{formatBytes(item.size)}</p>
                        </div>
                      </button>
                      <FileActionMenu item={item} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── MARKDOWN ── */}
            {markdownFiles.length > 0 && (
              <>
                <SectionHeader icon={Icons.markdown} title="Markdown" count={markdownFiles.length} />
                <div className="space-y-1 stagger-children">
                  {markdownFiles.map((item) => (
                    <div key={item.sha} className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all animate-fade-in ${
                      selectedFiles.has(item.sha) ? 'border-blue-500/30 bg-blue-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
                    }`}>
                      <button onClick={() => toggleSelect(item.sha)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                        selectedFiles.has(item.sha) ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-600 hover:border-zinc-400'
                      }`}>
                        {selectedFiles.has(item.sha) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </button>
                      <button onClick={() => openCodePreview(item)} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
                          {Icons.markdown}
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-sm text-zinc-300 truncate">{item.name}</p>
                          <p className="text-[11px] text-zinc-600">{formatBytes(item.size)}</p>
                        </div>
                      </button>
                      <FileActionMenu item={item} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── CODE ── */}
            {codeFiles.length > 0 && (
              <>
                <SectionHeader icon={Icons.code} title="Code" count={codeFiles.length} />
                <div className="space-y-1 stagger-children">
                  {codeFiles.map((item) => (
                    <div key={item.sha} className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all animate-fade-in ${
                      selectedFiles.has(item.sha) ? 'border-blue-500/30 bg-blue-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
                    }`}>
                      <button onClick={() => toggleSelect(item.sha)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                        selectedFiles.has(item.sha) ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-600 hover:border-zinc-400'
                      }`}>
                        {selectedFiles.has(item.sha) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </button>
                      <button onClick={() => openCodePreview(item)} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center text-cyan-400 shrink-0">
                          {Icons.code}
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-sm text-zinc-300 truncate">{item.name}</p>
                          <p className="text-[11px] text-zinc-600">{formatBytes(item.size)}</p>
                        </div>
                      </button>
                      <FileActionMenu item={item} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Summary bar ── */}
            <div className="mt-10 pt-6 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-600">
              <span>{folders.length} folder{folders.length !== 1 ? 's' : ''}, {totalFiles} file{totalFiles !== 1 ? 's' : ''}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                {Icons.back} Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ── Floating Selection Bar ── */}
      {selectedFiles.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-3 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/50">
            <span className="text-sm text-zinc-300 font-medium">
              {selectedFiles.size} selected
            </span>
            <div className="w-px h-5 bg-white/[0.1]" />
            <button
              onClick={() => setSelectedFiles(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-all"
            >
              Clear
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-lg shadow-red-500/20 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
