'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

export default function RepoPage() {
  const router = useRouter();
  const params = useSearchParams();

  const repo = params.get('repo');
  const path = params.get('path') || '';
  const username = params.get('username');

  const [contents, setContents] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const res = await api.get(`/api/contents?repo=${repo}&path=${path}`);
        setContents(res.data);
      } catch (err) {
        console.error('Error fetching contents:', err);
      }
    };
    if (repo) fetchContents();
  }, [repo, path]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedImageIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFolderClick = (item) => {
    router.push(`/repo?repo=${repo}&path=${item.path}&username=${username}`);
  };

  const handleDelete = async (file) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${file.name}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch('http://192.168.0.100:5000/api/delete-file', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, path: file.path, sha: file.sha })
      });

      const result = await res.json();
      if (res.ok) {
        alert('✅ File deleted!');
        const updated = await api.get(`/api/contents?repo=${repo}&path=${path}`);
        setContents(updated.data);
      } else {
        alert(`❌ Failed to delete: ${result.error?.message || result.error}`);
      }
    } catch (err) {
      alert(`❌ Network error: ${err.message}`);
    }
  };

  const getRawUrl = (item) => `https://raw.githubusercontent.com/${username}/${repo}/main/${item.path}`;

  const foldersAndOtherFiles = contents.filter(item => item.type === 'dir' || !item.name.match(/\.(jpg|jpeg|png|gif)$/i));
  const imageFiles = contents.filter(item => item.name.match(/\.(jpg|jpeg|png|gif)$/i));
  const audioFiles = contents.filter(item => item.name.match(/\.(mp3|wav|ogg|m4a)$/i));
  const videoFiles = contents.filter(item => item.name.match(/\.(mp4|webm|ogg|mov)$/i));

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">
        📁 {repo}/{path}
      </h1>

      <div className="space-y-4 mb-8">
        {foldersAndOtherFiles.map((item) => (
          <div key={item.sha} className="border border-gray-700 p-4 rounded-lg bg-gray-900">
            {item.type === 'dir' ? (
              <button onClick={() => handleFolderClick(item)} className="text-blue-400 hover:underline text-lg">
                📂 {item.name}
              </button>
            ) : (
              <p className="text-sm text-gray-300">📄 {item.name}</p>
            )}
          </div>
        ))}
      </div>

      {imageFiles.length > 0 && (
        <>
          <h2 className="text-xl mb-4 border-b border-gray-700 pb-2">🖼 Images</h2>
          <div className="flex flex-wrap gap-2">
            {imageFiles.map((item, index) => (
              <div key={item.sha} className="text-center bg-gray-900 p-2 rounded-lg border border-gray-700">
                <div className="relative">
                  <img
                    src={getRawUrl(item)}
                    alt={item.name}
                    className="h-40 w-40 rounded shadow-lg object-cover cursor-pointer"
                    onClick={() => setSelectedImageIndex(index)}
                  />
                  <button
                    onClick={() => handleDelete(item)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 text-xs hover:bg-red-700"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {audioFiles.length > 0 && (
        <>
          <h2 className="text-xl mt-8 mb-4 border-b border-gray-700 pb-2">🎵 Audio Files</h2>
          <div className="space-y-4">
            {audioFiles.map((item) => (
              <div key={item.sha} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300 mb-2">🎧 {item.name}</p>
                <audio controls src={getRawUrl(item)} className="w-full">
                  Your browser does not support the audio element.
                </audio>
              </div>
            ))}
          </div>
        </>
      )}

      {videoFiles.length > 0 && (
        <>
          <h2 className="text-xl mt-8 mb-4 border-b border-gray-700 pb-2">🎬 Video Files</h2>
          <div className="space-y-4">
            {videoFiles.map((item) => {
              const isActive = selectedVideo === item.path;
              return (
                <div key={item.sha} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <button onClick={() => setSelectedVideo(isActive ? null : item.path)} className="text-blue-400 hover:underline text-sm">
                    🎥 {item.name}
                  </button>
                  {isActive && (
                    <video controls src={getRawUrl(item)} className="w-full mt-2 max-h-[500px] rounded">
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50"
          onClick={() => setSelectedImageIndex(null)}
        >
          <img
            src={getRawUrl(imageFiles[selectedImageIndex])}
            alt="Fullscreen"
            className="max-w-full max-h-[80vh] object-contain mb-4"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev - 1 + imageFiles.length) % imageFiles.length);
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              ⬅️ Prev
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev + 1) % imageFiles.length);
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              ➡️ Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
