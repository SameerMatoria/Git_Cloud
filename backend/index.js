const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
  origin: 'https://gitcloud-r.onrender.com',
  credentials: true
}));

app.use(express.json());

// 🔐 GitHub OAuth credentials
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// ✅ Step 1: GitHub login
app.get('/auth/github', (req, res) => {
  const redirect_uri = process.env.GITHUB_CALLBACK_URL;
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect_uri}&scope=repo`
  );
});

// ✅ Logout → just clear localStorage on frontend → no server-side logout needed
app.get('/auth/logout', (req, res) => {
  res.redirect('https://gitcloud-r.onrender.com/login');
});

// ✅ Step 2: GitHub callback → token-based flow
app.get('/auth/github/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code
      },
      {
        headers: { Accept: 'application/json' }
      }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer  ${accessToken}` },
    });
    const username = userRes.data.login;

    console.log('✅ GitHub OAuth Success. User:', username);

    // Redirect with token + username in URL
    res.redirect(`https://gitcloud-r.onrender.com/dashboard?token=${accessToken}&username=${username}`);
  } catch (err) {
    console.error('❌ OAuth error:', err.message);
    res.status(500).send('GitHub OAuth failed');
  }
});

// ✅ Helper to read token from Authorization header
const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.split(' ')[1];
};

// ✅ Get user info
app.get('/api/user', async (req, res) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${token}` }
    });

    res.json(userRes.data);
  } catch (err) {
    console.error('❌ Failed to fetch GitHub user:', err.message);
    res.status(500).json({ error: 'GitHub fetch failed' });
  }
});

// ✅ Get user repositories
app.get('/api/repos', async (req, res) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const repoRes = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer  ${token}` },
      params: { per_page: 100 },
    });

    res.json(repoRes.data);
  } catch (err) {
    console.error('❌ Failed to fetch repos:', err.message);
    res.status(500).json({ error: 'GitHub repo fetch failed' });
  }
});

// ✅ Create a new repo
app.post('/api/repos', async (req, res) => {
  const token = getTokenFromHeader(req);
  const { name, description = '', isPrivate = true } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Repository name is required' });
  }

  try {
    const createRes = await axios.post(
      'https://api.github.com/user/repos',
      {
        name,
        description,
        private: isPrivate,
      },
      {
        headers: {
          Authorization: `Bearer  ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    res.json({ message: 'Repository created', repo: createRes.data });
  } catch (err) {
    console.error('❌ Repo creation failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'GitHub repo creation failed' });
  }
});

// ✅ Upload a file to a selected repo
app.post('/api/upload', upload.array('files'), async (req, res) => {
  const files = req.files;
  const { repo, path } = req.body;
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  console.log('🛠 Upload request received');

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer  ${token}` },
    });
    const username = userRes.data.login;

    for (const file of files) {
      const content = file.buffer.toString('base64');
      const uploadPath = path ? `${path}/${file.originalname}` : file.originalname;

      await axios.put(
        `https://api.github.com/repos/${username}/${repo}/contents/${uploadPath}`,
        {
          message: `Upload ${file.originalname}`,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

// ✅ Delete file
app.delete('/api/delete-file', async (req, res) => {
  const { repo, path, sha } = req.body;
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer  ${token}` },
    });
    const username = userRes.data.login;

    const githubRes = await axios.delete(
      `https://api.github.com/repos/${username}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer  ${token}`,
          Accept: 'application/vnd.github+json',
        },
        data: {
          message: `Delete ${path}`,
          sha
        }
      }
    );

    console.log('✅ GitHub delete response:', githubRes.data);
    res.status(200).json({ message: 'File deleted', data: githubRes.data });
  } catch (err) {
    console.error('❌ GitHub delete error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ✅ Get repo contents
app.get('/api/contents', async (req, res) => {
  const { repo, path = '' } = req.query;
  const token = getTokenFromHeader(req);

  if (!token) {
    console.error('❌ Missing token');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer  ${token}` },
    });
    const username = userRes.data.login;

    const githubUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
    console.log(`📡 Fetching GitHub URL: ${githubUrl}`);

    const response = await axios.get(githubUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('⚠️ GitHub API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch repo contents' });
  }
});

// Test endpoint
app.get('/apitest', (req, res) => {
  console.log('/apitest got hit');
  res.send("someone just called /apitest");
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log('🚀 Backend running on RENDER server');
});
