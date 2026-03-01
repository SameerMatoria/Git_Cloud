# GitCloud

**Turn your GitHub repositories into a personal cloud drive.**

Upload, preview, organize, and share files — all from a sleek web interface, powered by the GitHub API. No extra storage costs, no setup, no command line needed.

> **Note:** The latest code is on the **`Test2`** branch. The `main` branch may be behind.

**Live:** [gitcloud-r.onrender.com](https://gitcloud-r.onrender.com)

---

## Features

- **Cloud File Manager** — Browse repos like folders. Navigate, upload, rename, delete files visually.
- **Drag & Drop Upload** — Drop files or entire folders to upload. Auto-committed to GitHub. Up to 25 MB per file.
- **Subfolder Management** — Create and delete folders inside repos.
- **Media Preview** — View images in a fullscreen gallery with size toggle (S/M/L/List). Play audio and video inline.
- **Code & Markdown Preview** — Syntax-highlighted code viewer (50+ languages) and rendered markdown preview.
- **Shareable Links** — Generate public links for any file. Anyone can view or download without a GitHub account.
- **Multi-File Select** — Select multiple files with checkboxes, bulk delete with one click.
- **Storage Analytics** — See per-repo storage usage with visual progress bars and percentage breakdowns.
- **Search** — Filter files within a repo instantly.
- **Privacy Transparent** — Full permissions breakdown on the login page + dedicated privacy policy page.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| Backend | Express.js 5, Node.js |
| Auth | GitHub OAuth via [AuthSnap](https://www.npmjs.com/package/auth-snap) |
| Database | SQLite (better-sqlite3) — for share links & session tokens |
| Storage | GitHub API (Contents API, repos, commits) |
| Deployment | Render (frontend + backend) |

---

## Architecture

```
Browser
  │
  ├── Login ──────────► Express Backend ──► GitHub OAuth ──► Redirect with JWT
  │
  └── Dashboard/Repo ──► Next.js Frontend ──(proxy /api/*)──► Express Backend ──► GitHub API
                                                                    │
                                                                    └──► SQLite (shares, tokens)
```

- **Auth** goes directly to the backend (avoids cross-origin cookie issues on Render)
- **API calls** are proxied through Next.js rewrites (same-origin, cookies flow naturally)
- **GitHub tokens** are stored in SQLite so sessions survive server restarts
- **Rate limiting** protects API (300 req/15min), uploads (60/15min), and auth (20/15min)

---

## Getting Started

### Prerequisites

- Node.js 20+
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))
  - Homepage URL: `http://localhost:3000`
  - Callback URL: `http://localhost:5000/auth/github/callback`

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your GitHub OAuth credentials
npm start
```

### Frontend

```bash
cd gitcloud
npm install
cp .env.example .env
# Edit .env if your backend runs on a different port
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with GitHub.

---

## Environment Variables

### Backend (`backend/.env`)

```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback
SESSION_SECRET=random_64_char_string
FRONTEND_URL=http://localhost:3000
```

### Frontend (`gitcloud/.env`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

---

## Deployment (Render)

**Backend** — Web Service:
- Build: `cd backend && npm install`
- Start: `cd backend && node index.js`
- Set all backend env vars (use production URLs)

**Frontend** — Web Service:
- Build: `cd gitcloud && npm install && npm run build`
- Start: `cd gitcloud && npm start`
- Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL

**GitHub OAuth App** — Update the callback URL to point to your backend's deployed URL.

---

## Project Structure

```
├── backend/
│   ├── index.js          # All API routes, auth, middleware
│   ├── db.js             # SQLite setup (shares, tokens tables)
│   ├── .env.example      # Environment template
│   └── package.json
│
├── gitcloud/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js           # Landing page
│   │   │   ├── login/page.js     # Login + permissions card
│   │   │   ├── dashboard/page.js # Repo dashboard + storage stats
│   │   │   ├── repo/page.js      # File browser (main feature)
│   │   │   ├── privacy/page.js   # Privacy policy
│   │   │   └── s/[id]/page.js    # Public share page
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── CodePreviewModal.jsx
│   │   └── lib/
│   │       └── api.js            # Axios instance
│   ├── next.config.mjs           # API proxy rewrites
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Storage Limits (GitHub)

| Limit | Value |
|-------|-------|
| Per file (API upload) | 25 MB |
| Per file (hard limit) | 100 MB |
| Per repo (recommended) | 1 GB |
| Per account | No total cap, up to 100K repos |
| Theoretical max | ~100 TB |

---

## Contributing

Contributions are welcome! Check out the [open issues](https://github.com/SameerMatoria/Git_Cloud/issues) for things to work on.

1. Fork the repo
2. Create a branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a PR against the `Test2` branch

Look for issues labeled `good first issue` if you're new to the project.

---

## License

MIT
