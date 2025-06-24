# GitCloud – GitHub-Powered Cloud Storage

GitCloud is a web application that transforms your GitHub repositories into a personal cloud storage platform. Upload, preview, and manage files using GitHub as a secure backend.

## 🌐 Live Demo
👉 [Visit GitCloud on Render](https://gitcloud-r.onrender.com)

---

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Authentication**: GitHub OAuth
- **API**: GitHub REST API
- **Storage**: GitHub repositories

---

## Features

-  GitHub OAuth Login
-  Upload multiple files directly to GitHub
-  Live preview for images, videos, and PDFs
-  Delete files with confirmation
-  Dashboard with storage usage & file type breakdown (coming soon)
-  Sleek, dark-themed UI

---

## Local Setup Guide

### Clone the Repository
⚠️ Important: Make sure to clone the Localhost branch, not the default main branch.

```bash
git clone https://github.com/your-username/gitcloud.git
cd gitcloud 

frontend/.env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id

backend/.env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=some_random_secret
```
Make sure your Authorization Callback URL is: 
```bash
http://localhost:3000/api/auth/github/callback
```
## Install Dependencies
Frontend
```bash
cd .\gitcloud\
npm install
```
Backend
```bash
cd .\backend\ 
npm install
```

### Open in Browser
Go to: http://localhost:3000

## Notes
All uploaded files are stored in your GitHub repo.

Only authenticated users can access file operations.

Tested on modern browsers and responsive for mobile devices.

## Contributing
Feel free to fork this repo and submit a pull request. Let's build GitCloud together!


