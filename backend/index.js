const express = require('express');
const session = require('express-session');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const upload = multer();
require('dotenv').config();

const app = express(); // ✅ FIXED

// ✅ Middleware
app.use(cors({
  origin: 'http://192.168.0.100:3000',
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'gitcloud_secret',
  resave: false,
  saveUninitialized: false
}));



// 🔐 GitHub OAuth credentials
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// ✅ Step 1: GitHub login
app.get('/auth/github', (req, res) => {
  const redirect_uri = 'http://192.168.0.100:5000/auth/github/callback';
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect_uri}&scope=repo`
  );
});

// ✅ Logout route: destroy session and clear cookie
app.get('/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed');
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.redirect('http://192.168.0.100:3000/login'); // Redirect to login page
  });
});





// ✅ Step 2: GitHub callback
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
    req.session.accessToken = accessToken;

    // 🔄 Get user info and store username
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` },
    });
    req.session.username = userRes.data.login;

    console.log('✅ GitHub OAuth Success. User:', userRes.data.login);
    res.redirect('http://192.168.0.100:3000/dashboard');
  } catch (err) {
    console.error('❌ OAuth error:', err.message);
    res.status(500).send('GitHub OAuth failed');
  }
});

// ✅ Get user info
app.get('/api/user', async (req, res) => {
  const token = req.session.accessToken;

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
  const token = req.session.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const repoRes = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${token}` },
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
  const token = req.session.accessToken;
  const { name, description = '', isPrivate = false } = req.body;

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
          Authorization: `token ${token}`,
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
  const accessToken = req.session.accessToken;
  const username = req.session.username;

  console.log('🛠 Upload request received');

  // Debug logs
  console.log('Files:', req.files);
  console.log('Body:', req.body);
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  try {
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
            Authorization: `Bearer ${accessToken}`,
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

// Delete 
app.delete('/api/delete-file', async (req, res) => {
  const { repo, path, sha } = req.body;
  const accessToken = req.session.accessToken;
  const username = req.session.username;

  console.log('➡️ Delete request body:', req.body);
  console.log('🧠 Session:', { accessToken, username });

  if (!repo || !path || !sha || !accessToken || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const githubRes = await axios.delete(
      `https://api.github.com/repos/${username}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
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


// =================

// /api/contents?repo=REPO_NAME&path=OPTIONAL_PATH
app.get('/api/contents', async (req, res) => {
  const { repo, path = '' } = req.query;
  const accessToken = req.session.accessToken;  // ✅ FIXED
  const username = req.session.username;        // ✅ FIXED

  if (!accessToken || !username) {
    console.error('❌ Missing session username or token');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const githubUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
    console.log(`📡 Fetching GitHub URL: ${githubUrl}`);

    const response = await axios.get(githubUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('⚠️ GitHub API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch repo contents' });
  }
});















// ✅ Start the server
app.listen(5000, () => {
  console.log('🚀 Backend running on http://192.168.0.100:5000');
});
