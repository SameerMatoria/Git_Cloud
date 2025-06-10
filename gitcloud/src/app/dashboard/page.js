'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';


export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [newRepoName, setNewRepoName] = useState('');
  const [createStatus, setCreateStatus] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState('');

  const [fileList, setFileList] = useState([]);

  const router = useRouter();

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

  console.log("USER", user)

  const handleFileUpload = async () => {
    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);  // ✅ Must be 'files'
    }

    formData.append('repo', selectedRepo);
    formData.append('path', selectedFilePath || '');

    try {
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus('✅ Upload complete!');
    } catch (err) {
      console.error(err);
      setUploadStatus('❌ Upload failed');
    }
  };


  const handleCreateRepo = async () => {
    if (!newRepoName) return;

    try {
      const res = await api.post('/api/repos', { name: newRepoName });
      setCreateStatus(`✅ Repo created: ${res.data.repo.name}`);
      setRepos([...repos, res.data.repo]);
      setNewRepoName('');
    } catch (err) {
      setCreateStatus('❌ Failed to create repo');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">Loading your GitHub profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-zinc-900 shadow">
        <h1 className="text-xl font-bold">GitCloud Dashboard</h1>
        <button
          onClick={() => (window.location.href = 'http://192.168.0.100:5000/auth/logout')}
          className="bg-white-600 border-b-2 border-transparent hover:border-white cursor-pointer text-white px-4 py-2 text-sm duration-300"

        >
          Logout
        </button>
      </nav>

      {/* Main content */}
      <div className="px-6 py-10 max-w-screen-2xl mx-auto">
        {/* File preview */}
        {/* {selectedFilePath && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Preview</h3>
            {/* <FilePreview repo={selectedRepo} path={selectedFilePath} /> */}
        {/* </div> */}
        {/* )}  */}

        {/* File upload */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow mb-10">
          <h2 className="text-2xl font-semibold mb-4">📤 Upload File to Repository</h2>
          <div className="space-y-4">
            <select
              className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2"
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
            >
              <option value="">-- Select a repository --</option>
              {repos.map((repo) => (
                <option key={repo.id} value={repo.name}>
                  {repo.name}
                </option>
              ))}
            </select>

            {/* Flex container for file input and button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full">
              <input
                type="file"
                multiple
                onChange={(e) => setFileList(e.target.files)}
                className="text-white hover:underline cursor-pointer w-full sm:w-auto"
              />
              <button
                onClick={handleFileUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-full sm:w-auto"
              >
                Upload to GitHub
              </button>
            </div>


            {uploadStatus && <p className="text-sm text-zinc-400">{uploadStatus}</p>}
          </div>


        </div>

        {/* Create Repo */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow mb-10">
          <h3 className="text-2xl font-semibold mb-4">➕ Create a New GitHub Repository</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter repository name..."
              className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2"
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
            />
            <button
              onClick={handleCreateRepo}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Create Repo
            </button>
          </div>
          {createStatus && <p className="text-sm text-zinc-400 mt-2">{createStatus}</p>}
        </div>

        {/* User profile */}
        <div className="flex items-center gap-6 border-b border-zinc-700 pb-6 mb-6">
          <img
            src={user.avatar_url}
            alt="Avatar"
            className="w-24 h-24 rounded-full border-4 border-zinc-600 shadow"
          />
          <div>
            <h1 className="text-3xl font-semibold">{user.name || user.login}</h1>
            <p className="text-zinc-400 text-sm">@{user.login}</p>
            {user.bio && <p className="text-zinc-500 text-sm italic mt-2">“{user.bio}”</p>}
          </div>
        </div>

        {/* Repo list */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">📁 Your GitHub Repositories</h2>
          {repos.length === 0 ? (
            <p className="text-zinc-500">No repositories found.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {repos.map((repo) => (
                <li
                  key={repo.id}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm"
                >
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 font-semibold hover:underline"
                  >
                    {repo.name}
                  </a>
                  <p className="text-sm text-zinc-400 mt-1">
                    {repo.description || 'No description provided.'}
                  </p>
                  <button
                    onClick={() => {
                      router.push(`/repo?repo=${repo.name}&username=${user.login}`);
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    View
                  </button>

                </li>

              ))}

            </ul>

          )}
        </div>
      </div>
    </div>
  );
}
