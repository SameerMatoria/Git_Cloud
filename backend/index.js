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
app.set('trust proxy', 1); // Trust first proxy (Render) — required for secure cookies behind HTTPS
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB per file (uses Git Blobs API for >25 MB)
const CHUNK_SIZE = 80 * 1024 * 1024; // 80 MB chunks for large file splitting
const chunkedUpload = multer({ limits: { fileSize: CHUNK_SIZE + 5 * 1024 * 1024 } }); // slight buffer for encoding
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
      scopes: ['repo', 'user:email', 'delete_repo'],
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

// Intercept AuthSnap's callback to pass the session JWT via URL instead of
// relying on cross-origin cookies (which break on onrender.com subdomains).
// The frontend sets the cookie on its own domain, then API calls go through
// the Next.js proxy (same-origin), so the cookie flows naturally.
app.use('/auth', (req, res, next) => {
  const origRedirect = res.redirect.bind(res);
  res.redirect = (url) => {
    const cookieHeader = res.getHeader('set-cookie');
    const cookie = Array.isArray(cookieHeader) ? cookieHeader.find(c => c.includes('authsnap_session=')) : (typeof cookieHeader === 'string' && cookieHeader.includes('authsnap_session=') ? cookieHeader : null);
    if (cookie && url.startsWith(FRONTEND_URL)) {
      const token = cookie.split('authsnap_session=')[1].split(';')[0];
      res.removeHeader('set-cookie');
      const sep = url.includes('?') ? '&' : '?';
      return origRedirect(`${url}${sep}token=${encodeURIComponent(token)}`);
    }
    return origRedirect(url);
  };
  next();
});

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

// ── Repo Groups (auto-spreading) ────────────────────────────────
const REPO_SIZE_LIMIT = 900 * 1024 * 1024; // 900 MB soft limit before creating overflow repo

// Helper: get current size of a repo in bytes
async function getRepoSizeBytes(gh, repoName) {
  try {
    const headers = { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' };
    const repoRes = await axios.get(`https://api.github.com/repos/${gh.username}/${repoName}`, { headers });
    const branch = repoRes.data.default_branch;
    const treeRes = await axios.get(
      `https://api.github.com/repos/${gh.username}/${repoName}/git/trees/${branch}?recursive=1`,
      { headers }
    );
    return (treeRes.data.tree || [])
      .filter((item) => item.type === 'blob')
      .reduce((sum, item) => sum + (item.size || 0), 0);
  } catch {
    return 0;
  }
}

// Helper: find or create an overflow repo with enough space
async function getTargetRepo(gh, primaryRepo, fileSize) {
  const headers = { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' };

  // Get all linked repos (primary + overflows)
  const linked = db.prepare('SELECT linkedRepo, orderIndex FROM repo_groups WHERE username = ? AND primaryRepo = ? ORDER BY orderIndex')
    .all(gh.username, primaryRepo);
  const allRepos = [primaryRepo, ...linked.map((r) => r.linkedRepo)];

  // Check each repo for space (start from the last one)
  for (let i = allRepos.length - 1; i >= 0; i--) {
    const size = await getRepoSizeBytes(gh, allRepos[i]);
    if (size + fileSize < REPO_SIZE_LIMIT) {
      return allRepos[i];
    }
  }

  // All repos are full — create a new overflow repo
  const nextIndex = allRepos.length;
  const newRepoName = `${primaryRepo}-${nextIndex + 1}`;

  // Check if primary repo is private
  const primaryRes = await axios.get(`https://api.github.com/repos/${gh.username}/${primaryRepo}`, { headers });
  const isPrivate = primaryRes.data.private;

  // Create the overflow repo
  await axios.post('https://api.github.com/user/repos', {
    name: newRepoName,
    private: isPrivate,
    description: `Overflow storage for ${primaryRepo} (auto-created by GitCloud)`,
    auto_init: true,
  }, { headers });

  // Register in repo_groups
  db.prepare('INSERT OR IGNORE INTO repo_groups (username, primaryRepo, linkedRepo, orderIndex) VALUES (?, ?, ?, ?)')
    .run(gh.username, primaryRepo, newRepoName, nextIndex);

  return newRepoName;
}

// Get repo group info
app.get('/api/repo-group', auth.protect(), (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo } = req.query;
  if (!repo) return res.status(400).json({ error: 'repo is required' });

  // Check if this repo is a primary or linked repo
  const asLinked = db.prepare('SELECT primaryRepo FROM repo_groups WHERE username = ? AND linkedRepo = ?').get(gh.username, repo);
  const primaryRepo = asLinked ? asLinked.primaryRepo : repo;

  const linked = db.prepare('SELECT linkedRepo, orderIndex FROM repo_groups WHERE username = ? AND primaryRepo = ? ORDER BY orderIndex')
    .all(gh.username, primaryRepo);

  res.json({ primaryRepo, linkedRepos: linked.map((r) => r.linkedRepo) });
});

// Get all overflow repo names for a user (to hide from dashboard)
app.get('/api/overflow-repos', auth.protect(), (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const linked = db.prepare('SELECT linkedRepo FROM repo_groups WHERE username = ?').all(gh.username);
  res.json(linked.map((r) => r.linkedRepo));
});

// ── File Upload ─────────────────────────────────────────────────
// Helper: upload via Git Blobs API (supports up to 100 MB)
async function uploadViaBlobsAPI(gh, repo, uploadPath, content, commitMsg) {
  const headers = { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' };
  const apiBase = `https://api.github.com/repos/${gh.username}/${repo}`;

  // 1. Create blob
  const blobRes = await axios.post(`${apiBase}/git/blobs`, {
    content: content,
    encoding: 'base64',
  }, { headers });

  // 2. Get latest commit SHA on default branch
  const repoRes = await axios.get(apiBase, { headers });
  const branch = repoRes.data.default_branch;
  const refRes = await axios.get(`${apiBase}/git/ref/heads/${branch}`, { headers });
  const latestCommitSha = refRes.data.object.sha;

  // 3. Get the tree of the latest commit
  const commitRes = await axios.get(`${apiBase}/git/commits/${latestCommitSha}`, { headers });
  const baseTreeSha = commitRes.data.tree.sha;

  // 4. Create new tree with the blob
  const treeRes = await axios.post(`${apiBase}/git/trees`, {
    base_tree: baseTreeSha,
    tree: [{
      path: uploadPath,
      mode: '100644',
      type: 'blob',
      sha: blobRes.data.sha,
    }],
  }, { headers });

  // 5. Create commit
  const newCommitRes = await axios.post(`${apiBase}/git/commits`, {
    message: commitMsg,
    tree: treeRes.data.sha,
    parents: [latestCommitSha],
  }, { headers });

  // 6. Update branch reference
  await axios.patch(`${apiBase}/git/refs/heads/${branch}`, {
    sha: newCommitRes.data.sha,
  }, { headers });
}

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

      // Auto-overflow: find a repo with enough space
      const targetRepo = await getTargetRepo(gh, repo, file.size);

      if (file.size > 25 * 1024 * 1024) {
        // Large file: use Git Blobs API (up to 100 MB)
        await uploadViaBlobsAPI(gh, targetRepo, uploadPath, content, msg);
      } else {
        // Small file: use Contents API (simpler, up to 25 MB)
        await axios.put(
          `https://api.github.com/repos/${gh.username}/${targetRepo}/contents/${uploadPath}`,
          { message: msg, content },
          {
            headers: {
              Authorization: `Bearer ${gh.token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Upload error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── Chunked Upload (for files > 100 MB) ─────────────────────────
app.post('/api/upload-chunk', auth.protect(), chunkedUpload.single('chunk'), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, path: uploadDir, chunkIndex, totalChunks, fileName, totalSize } = req.body;
  const chunk = req.file;
  if (!chunk || !repo || !fileName) {
    return res.status(400).json({ error: 'chunk, repo, and fileName are required' });
  }

  try {
    const chunkNum = String(Number(chunkIndex) + 1).padStart(3, '0');
    const chunkName = `${fileName}.chunk.${chunkNum}`;
    const chunkPath = uploadDir ? `${uploadDir}/${chunkName}` : chunkName;
    const content = chunk.buffer.toString('base64');
    const msg = `Upload chunk ${chunkNum}/${totalChunks} of ${fileName}`;

    // Auto-overflow: find a repo with enough space for each chunk
    const targetRepo = await getTargetRepo(gh, repo, chunk.size);

    // Use Blobs API for all chunks (they can be up to 80 MB)
    await uploadViaBlobsAPI(gh, targetRepo, chunkPath, content, msg);

    // If this is the last chunk, create the manifest
    if (Number(chunkIndex) === Number(totalChunks) - 1) {
      const manifest = {
        originalName: fileName,
        totalSize: Number(totalSize),
        totalChunks: Number(totalChunks),
        chunkSize: CHUNK_SIZE,
        createdAt: new Date().toISOString(),
      };
      const manifestPath = uploadDir ? `${uploadDir}/${fileName}.manifest.json` : `${fileName}.manifest.json`;
      const manifestContent = Buffer.from(JSON.stringify(manifest, null, 2)).toString('base64');

      await axios.put(
        `https://api.github.com/repos/${gh.username}/${targetRepo}/contents/${manifestPath}`,
        { message: `Upload manifest for ${fileName}`, content: manifestContent },
        { headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' } }
      );
    }

    res.json({ success: true, chunk: Number(chunkIndex) + 1, total: Number(totalChunks) });
  } catch (err) {
    console.error('Chunk upload error:', err.response?.data || err.message);
    res.status(500).json({ error: `Failed to upload chunk ${Number(chunkIndex) + 1}` });
  }
});

// ── Chunked Download (reassemble chunks and stream) ─────────────
app.get('/api/download-chunked', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, manifestPath } = req.query;
  if (!repo || !manifestPath) return res.status(400).json({ error: 'repo and manifestPath are required' });

  const headers = { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' };
  const apiBase = `https://api.github.com/repos/${gh.username}/${repo}`;

  try {
    // 1. Fetch manifest
    const manifestRes = await axios.get(`${apiBase}/contents/${manifestPath}`, { headers });
    const manifest = JSON.parse(Buffer.from(manifestRes.data.content, 'base64').toString('utf-8'));

    const dir = manifestPath.includes('/') ? manifestPath.substring(0, manifestPath.lastIndexOf('/')) : '';

    res.set('Content-Disposition', `attachment; filename="${manifest.originalName}"`);
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Length', manifest.totalSize);

    // 2. Stream chunks sequentially
    for (let i = 1; i <= manifest.totalChunks; i++) {
      const chunkNum = String(i).padStart(3, '0');
      const chunkName = `${manifest.originalName}.chunk.${chunkNum}`;
      const chunkPath = dir ? `${dir}/${chunkName}` : chunkName;

      const chunkRes = await axios.get(`${apiBase}/contents/${chunkPath}`, {
        headers: { ...headers, Accept: 'application/vnd.github.v3.raw' },
        responseType: 'arraybuffer',
      });
      res.write(Buffer.from(chunkRes.data));
    }
    res.end();
  } catch (err) {
    console.error('Chunked download error:', err.response?.data || err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download chunked file' });
    }
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

// ── Repo Actual Size (sum of current files, not git history) ────
app.get('/api/repo-size', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo } = req.query;
  if (!repo) return res.status(400).json({ error: 'repo is required' });

  try {
    // Get default branch first
    const repoRes = await axios.get(`https://api.github.com/repos/${gh.username}/${repo}`, {
      headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' },
    });
    const branch = repoRes.data.default_branch;

    // Get full tree recursively
    const treeRes = await axios.get(
      `https://api.github.com/repos/${gh.username}/${repo}/git/trees/${branch}?recursive=1`,
      { headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' } }
    );

    const totalBytes = (treeRes.data.tree || [])
      .filter((item) => item.type === 'blob')
      .reduce((sum, item) => sum + (item.size || 0), 0);

    res.json({ repo, sizeBytes: totalBytes });
  } catch (err) {
    // Empty repo or no commits — size is 0
    if (err.response?.status === 409 || err.response?.status === 404) {
      return res.json({ repo, sizeBytes: 0 });
    }
    console.error('Repo size error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to calculate repo size' });
  }
});

// ── Repo Contents ───────────────────────────────────────────────
app.get('/api/contents', auth.protect(), async (req, res) => {
  const gh = requireGitHub(req, res);
  if (!gh) return;

  const { repo, path: repoPath = '' } = req.query;
  const headers = { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github.v3+json' };

  try {
    // Fetch contents from primary repo
    const githubUrl = `https://api.github.com/repos/${gh.username}/${repo}/contents/${repoPath}`;
    const response = await axios.get(githubUrl, { headers });
    let allContents = Array.isArray(response.data) ? response.data : [response.data];

    // Also fetch from overflow repos
    const linked = db.prepare('SELECT linkedRepo FROM repo_groups WHERE username = ? AND primaryRepo = ? ORDER BY orderIndex')
      .all(gh.username, repo);

    for (const { linkedRepo } of linked) {
      try {
        const overflowUrl = `https://api.github.com/repos/${gh.username}/${linkedRepo}/contents/${repoPath}`;
        const overflowRes = await axios.get(overflowUrl, { headers });
        const overflowData = Array.isArray(overflowRes.data) ? overflowRes.data : [overflowRes.data];
        // Tag overflow items with source repo
        allContents = allContents.concat(overflowData.map((item) => ({ ...item, _sourceRepo: linkedRepo })));
      } catch {
        // Overflow repo might not have this path — skip
      }
    }

    res.json(allContents);
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
