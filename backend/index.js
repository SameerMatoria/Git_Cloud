import express from 'express';
import axios from 'axios';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { AuthSnap } from 'auth-snap';
import db from './db.js';

dotenv.config();

// Validate required environment variables
const REQUIRED_ENV = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_CALLBACK_URL', 'SESSION_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB per file
const upload = multer({ limits: { fileSize: MAX_FILE_SIZE } });
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gitcloud-r.onrender.com';

// Persistent GitHub OAuth token storage via SQLite
const githubUsers = {
  set(userId, data) {
    db.prepare(
      'INSERT OR REPLACE INTO github_tokens (userId, token, username, updatedAt) VALUES (?, ?, ?, datetime(\'now\'))'
    ).run(userId, data.token, data.username);
  },
  get(userId) {
    const row = db.prepare('SELECT token, username FROM github_tokens WHERE userId = ?').get(userId);
    return row || null;
  },
  delete(userId) {
    db.prepare('DELETE FROM github_tokens WHERE userId = ?').run(userId);
  },
  // Find token by GitHub username (for shared file downloads)
  findByUsername(username) {
    const row = db.prepare('SELECT token, username FROM github_tokens WHERE username = ?').get(username);
    return row || null;
  },
};

// Initialize AuthSnap with GitHub provider
const auth = new AuthSnap({
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scopes: ['repo', 'user:email'],
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    }
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: 86400,
    secure: process.env.NODE_ENV === 'production',
  },
  basePath: '/auth',
  allowedRedirects: [FRONTEND_URL],
  callbacks: {
    onSuccess: async (user, tokens, provider) => {
      // Store the raw GitHub access token for GitHub API calls
      // AuthSnap returns camelCase: tokens.accessToken (not access_token)
      githubUsers.set(user.id, { token: tokens.accessToken, username: user.raw.login });
      console.log('GitHub OAuth Success. User:', user.raw.login || user.id);
      return { redirect: `${FRONTEND_URL}/dashboard` };
    },
    // MUST be sync — AuthSnap's handleCallbackError does not await async callbacks
    onError: (error, provider) => {
      console.error('OAuth error:', error.message);
      return { redirect: `${FRONTEND_URL}/login` };
    },
  }
});

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,                   // 60 uploads per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit reached. Please wait a few minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                   // 20 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/auth/', authLimiter);

// AuthSnap middleware — auto-creates:
//   GET /auth/github          → start OAuth flow
//   GET /auth/github/callback → handle GitHub redirect
//   GET /auth/logout          → clear session
app.use(auth.express());

// Custom logout route that redirects to the frontend login page
app.get('/api/logout', (req, res) => {
  res.clearCookie('authsnap_session', { path: '/' });
  if (req.user?.id) githubUsers.delete(req.user.id);
  res.redirect(`${FRONTEND_URL}/login`);
});

// Helper: get the cached GitHub data { token, username } for the authenticated user
const getGitHubUser = (req) => {
  if (!req.user) return null;
  return githubUsers.get(req.user.id) || null;
};

// Helper: return 401 if GitHub data is missing (server restarted, etc.)
const requireGitHub = (req, res) => {
  const data = getGitHubUser(req);
  if (!data) {
    res.status(401).json({ error: 'GitHub token expired. Please re-login.' });
    return null;
  }
  return data;
};

// ── User Info ───────────────────────────────────────────────────
app.get('/api/user', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${gh.token}` }
    });
    res.json(userRes.data);
  } catch (err) {
    console.error('Failed to fetch GitHub user:', err.message);
    res.status(500).json({ error: 'GitHub fetch failed' });
  }
});

// ── Repositories ────────────────────────────────────────────────
app.get('/api/repos', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  try {
    let allRepos = [];
    let page = 1;
    while (true) {
      const repoRes = await axios.get('https://api.github.com/user/repos', {
        headers: { Authorization: `Bearer ${gh.token}` },
        params: { per_page: 100, page },
      });
      allRepos = allRepos.concat(repoRes.data);
      if (repoRes.data.length < 100) break;
      page++;
    }
    res.json(allRepos);
  } catch (err) {
    console.error('Failed to fetch repos:', err.message);
    res.status(500).json({ error: 'GitHub repo fetch failed' });
  }
});

app.post('/api/repos', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { name, description = '', isPrivate = true } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Repository name is required' });
  }
  if (name.length > 100) {
    return res.status(400).json({ error: 'Name must be 100 characters or fewer' });
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return res.status(400).json({ error: 'Only letters, numbers, hyphens, dots, and underscores allowed' });
  }

  try {
    const createRes = await axios.post(
      'https://api.github.com/user/repos',
      { name, description, private: isPrivate },
      {
        headers: {
          Authorization: `Bearer ${gh.token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    res.json({ message: 'Repository created', repo: createRes.data });
  } catch (err) {
    console.error('Repo creation failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'GitHub repo creation failed' });
  }
});

// ── Delete Repository ───────────────────────────────────────────
app.delete('/api/repos', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Repository name is required' });

  try {
    await axios.delete(`https://api.github.com/repos/${gh.username}/${name}`, {
      headers: {
        Authorization: `Bearer ${gh.token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    res.json({ message: 'Repository deleted' });
  } catch (err) {
    console.error('Repo delete failed:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.response?.data?.message || 'Failed to delete repository' });
  }
});

// ── File Upload ─────────────────────────────────────────────────
app.post('/api/upload', auth.protect(), upload.array('files'), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const files = req.files;
  const { repo, path, commitMessage } = req.body;

  try {
    for (const file of files) {
      const content = file.buffer.toString('base64');
      const uploadPath = path ? `${path}/${file.originalname}` : file.originalname;
      const msg = commitMessage || `Upload ${file.originalname}`;

      await axios.put(
        `https://api.github.com/repos/${gh.username}/${repo}/contents/${uploadPath}`,
        { message: msg, content },
        {
          headers: {
            Authorization: `Bearer ${gh.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Upload error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── Create Folder ───────────────────────────────────────────────
app.post('/api/create-folder', auth.protect(), express.json(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, path: parentPath, folderName } = req.body;
  if (!repo || !folderName) {
    return res.status(400).json({ error: 'repo and folderName are required' });
  }

  const filePath = parentPath
    ? `${parentPath}/${folderName}/.gitkeep`
    : `${folderName}/.gitkeep`;

  try {
    await axios.put(
      `https://api.github.com/repos/${gh.username}/${repo}/contents/${filePath}`,
      { message: `Create folder ${folderName}`, content: '' },
      {
        headers: {
          Authorization: `Bearer ${gh.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Create folder error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// ── Folder Delete (recursive) ───────────────────────────────────
app.delete('/api/delete-folder', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, path: folderPath } = req.body;
  if (!repo || !folderPath) {
    return res.status(400).json({ error: 'repo and path are required' });
  }

  const headers = {
    Authorization: `Bearer ${gh.token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  // Recursively collect all files in the folder
  async function collectFiles(dirPath) {
    const { data: items } = await axios.get(
      `https://api.github.com/repos/${gh.username}/${repo}/contents/${dirPath}`,
      { headers }
    );
    let files = [];
    for (const item of items) {
      if (item.type === 'dir') {
        files = files.concat(await collectFiles(item.path));
      } else {
        files.push({ path: item.path, sha: item.sha });
      }
    }
    return files;
  }

  try {
    const files = await collectFiles(folderPath);
    for (const file of files) {
      await axios.delete(
        `https://api.github.com/repos/${gh.username}/${repo}/contents/${file.path}`,
        {
          headers,
          data: { message: `Delete ${file.path}`, sha: file.sha },
        }
      );
    }
    res.json({ success: true, deleted: files.length });
  } catch (err) {
    console.error('Delete folder error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// ── File Delete ─────────────────────────────────────────────────
app.delete('/api/delete-file', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, path, sha, commitMessage } = req.body;

  try {
    const githubRes = await axios.delete(
      `https://api.github.com/repos/${gh.username}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${gh.token}`,
          Accept: 'application/vnd.github+json',
        },
        data: { message: commitMessage || `Delete ${path}`, sha }
      }
    );
    res.status(200).json({ message: 'File deleted', data: githubRes.data });
  } catch (err) {
    console.error('GitHub delete error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ── File Download (proxy raw content) ───────────────────────────
app.get('/api/download', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, path: filePath } = req.query;
  if (!repo || !filePath) return res.status(400).json({ error: 'repo and path are required' });

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${gh.username}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${gh.token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
        responseType: 'arraybuffer',
      }
    );
    const fileName = filePath.split('/').pop();
    res.set('Content-Disposition', `attachment; filename="${fileName}"`);
    res.set('Content-Type', 'application/octet-stream');
    res.send(response.data);
  } catch (err) {
    console.error('Download error:', err.response?.data?.toString() || err.message);
    res.status(500).json({ error: 'Download failed' });
  }
});

// ── File Preview (inline, for PDF viewer etc.) ──────────────────
app.get('/api/preview', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, path: filePath } = req.query;
  if (!repo || !filePath) return res.status(400).json({ error: 'repo and path are required' });

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${gh.username}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${gh.token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
        responseType: 'arraybuffer',
      }
    );

    const ext = filePath.split('.').pop().toLowerCase();
    const mimeTypes = {
      pdf: 'application/pdf',
      txt: 'text/plain',
      html: 'text/html',
      json: 'application/json',
      xml: 'application/xml',
    };
    const contentType = mimeTypes[ext] || 'text/plain';
    const fileName = filePath.split('/').pop();

    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(response.data);
  } catch (err) {
    console.error('Preview error:', err.response?.data?.toString() || err.message);
    res.status(500).json({ error: 'Preview failed' });
  }
});

// ── File Rename/Move ────────────────────────────────────────────
app.put('/api/rename-file', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, oldPath, newPath, commitMessage } = req.body;
  if (!repo || !oldPath || !newPath) {
    return res.status(400).json({ error: 'repo, oldPath, and newPath are required' });
  }

  try {
    // 1. Get the file content from old path
    const getRes = await axios.get(
      `https://api.github.com/repos/${gh.username}/${repo}/contents/${oldPath}`,
      { headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' } }
    );
    const { content, sha } = getRes.data;

    // 2. Create file at new path
    await axios.put(
      `https://api.github.com/repos/${gh.username}/${repo}/contents/${newPath}`,
      { message: commitMessage || `Rename ${oldPath} to ${newPath}`, content },
      { headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' } }
    );

    // 3. Delete old file
    await axios.delete(
      `https://api.github.com/repos/${gh.username}/${repo}/contents/${oldPath}`,
      {
        headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github+json' },
        data: { message: commitMessage || `Rename ${oldPath} to ${newPath} (delete old)`, sha },
      }
    );

    res.json({ message: 'File renamed successfully' });
  } catch (err) {
    console.error('Rename error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Rename failed' });
  }
});

// ── Default Branch ──────────────────────────────────────────────
app.get('/api/default-branch', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo } = req.query;
  if (!repo) return res.status(400).json({ error: 'repo is required' });

  try {
    const repoRes = await axios.get(
      `https://api.github.com/repos/${gh.username}/${repo}`,
      { headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github+json' } }
    );
    res.json({ default_branch: repoRes.data.default_branch });
  } catch (err) {
    console.error('Default branch error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch default branch' });
  }
});

// ── File Search ─────────────────────────────────────────────────
app.get('/api/search', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { q, repo } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query (q) is required' });

  try {
    // Search within a specific repo or across all user repos
    const query = repo
      ? `${q} repo:${gh.username}/${repo}`
      : `${q} user:${gh.username}`;

    const searchRes = await axios.get(
      'https://api.github.com/search/code',
      {
        headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' },
        params: { q: query, per_page: 30 },
      }
    );
    res.json(searchRes.data);
  } catch (err) {
    console.error('Search error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── Repo Contents ───────────────────────────────────────────────
app.get('/api/contents', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, path: repoPath = '' } = req.query;

  try {
    const githubUrl = `https://api.github.com/repos/${gh.username}/${repo}/contents/${repoPath}`;
    const response = await axios.get(githubUrl, {
      headers: {
        Authorization: `Bearer ${gh.token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error('GitHub API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch repo contents' });
  }
});

// ── MIME type helper ─────────────────────────────────────────────
function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const types = {
    pdf: 'application/pdf', txt: 'text/plain', html: 'text/html',
    json: 'application/json', xml: 'application/xml',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', flac: 'audio/flac',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  };
  return types[ext] || 'application/octet-stream';
}

// ── Create Share Link (authenticated) ───────────────────────────
app.post('/api/share', auth.protect(), (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, filePath, fileName, fileSize } = req.body;
  if (!repo || !filePath || !fileName) {
    return res.status(400).json({ error: 'repo, filePath, and fileName are required' });
  }

  // Return existing share if one exists for this file
  const existing = db.prepare(
    'SELECT * FROM shares WHERE username = ? AND repo = ? AND filePath = ?'
  ).get(gh.username, repo, filePath);

  if (existing) {
    return res.json({
      shareId: existing.shareId,
      shareUrl: `${FRONTEND_URL}/s/${existing.shareId}`,
      existing: true,
    });
  }

  const shareId = crypto.randomBytes(16).toString('hex');

  db.prepare(
    'INSERT INTO shares (shareId, username, repo, filePath, fileName, fileSize) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(shareId, gh.username, repo, filePath, fileName, fileSize || 0);

  res.json({
    shareId,
    shareUrl: `${FRONTEND_URL}/s/${shareId}`,
  });
});

// ── Get Share Metadata (public) ─────────────────────────────────
app.get('/api/share/:id', (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE shareId = ?').get(req.params.id);
  if (!share) return res.status(404).json({ error: 'Share link not found' });

  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'Share link has expired' });
  }

  db.prepare('UPDATE shares SET accessCount = accessCount + 1 WHERE shareId = ?').run(req.params.id);

  res.json({
    shareId: share.shareId,
    username: share.username,
    repo: share.repo,
    filePath: share.filePath,
    fileName: share.fileName,
    fileSize: share.fileSize,
    createdAt: share.createdAt,
  });
});

// ── Download Shared File (public) ───────────────────────────────
app.get('/api/share/:id/download', async (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE shareId = ?').get(req.params.id);
  if (!share) return res.status(404).json({ error: 'Share link not found' });

  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'Share link has expired' });
  }

  // Look up owner's token from persistent storage
  const ownerData = githubUsers.findByUsername(share.username);
  const ownerToken = ownerData?.token || null;

  const fileName = share.filePath.split('/').pop();
  const contentType = getMimeType(fileName);

  // If owner is logged in, use their token (works for private repos too)
  if (ownerToken) {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${share.username}/${share.repo}/contents/${share.filePath}`,
        {
          headers: { Authorization: `Bearer ${ownerToken}`, Accept: 'application/vnd.github.v3.raw' },
          responseType: 'arraybuffer',
        }
      );
      res.set('Content-Type', contentType);
      res.set('Content-Disposition', `inline; filename="${fileName}"`);
      return res.send(response.data);
    } catch (err) {
      console.error('Share download (token) error:', err.response?.data?.toString() || err.message);
    }
  }

  // Fallback: try raw URL (works for public repos)
  try {
    const rawUrl = `https://raw.githubusercontent.com/${share.username}/${share.repo}/HEAD/${share.filePath}`;
    const response = await axios.get(rawUrl, { responseType: 'arraybuffer' });
    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(response.data);
  } catch {
    res.status(503).json({ error: 'File owner is not currently logged in and the repo may be private.' });
  }
});

// ── Delete Share Link (authenticated) ───────────────────────────
app.delete('/api/share/:id', auth.protect(), (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const share = db.prepare('SELECT * FROM shares WHERE shareId = ?').get(req.params.id);
  if (!share) return res.status(404).json({ error: 'Share link not found' });
  if (share.username !== gh.username) return res.status(403).json({ error: 'Not your share link' });

  db.prepare('DELETE FROM shares WHERE shareId = ?').run(req.params.id);
  res.json({ message: 'Share link revoked' });
});

// ── Health Check ────────────────────────────────────────────────
app.get('/apitest', (req, res) => {
  res.send('API is running');
});

// ── Error Handler (catches multer size errors, etc.) ────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` });
  }
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start Server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
