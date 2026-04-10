# 🎬 Fetchr — YouTube Downloader

A clean, full-stack YouTube downloader built with Node.js (Express) on the backend and plain HTML/CSS/JS on the frontend. Powered by `yt-dlp`.

---

## 📁 Folder Structure

```
ytdl/
├── backend/
│   ├── routes/
│   │   ├── info.js          # GET /api/info — fetch video metadata & formats
│   │   └── download.js      # GET /api/download — stream file to browser
│   ├── utils/
│   │   ├── ytdlp.js         # yt-dlp CLI wrappers (exec + spawn)
│   │   └── validate.js      # YouTube URL validation
│   ├── server.js            # Express app entrypoint
│   └── package.json
└── frontend/
    └── index.html           # Single-file frontend (HTML + CSS + JS)
```

---

## ⚙️ Prerequisites

| Tool | How to install |
|------|---------------|
| **Node.js 18+** | https://nodejs.org |
| **yt-dlp** | `pip install yt-dlp` or `brew install yt-dlp` |
| **ffmpeg** (required for merging HD video + audio) | `brew install ffmpeg` or https://ffmpeg.org |

Verify installations:
```bash
node --version      # v18+
yt-dlp --version    # 2024.x
ffmpeg -version
```

---

## 🚀 Setup & Run

### 1. Install backend dependencies

```bash
cd ytdl/backend
npm install
```

### 2. Start the backend server

```bash
npm start
# Server runs on http://localhost:3001
```

For development with auto-restart:
```bash
npm run dev    # uses nodemon
```

### 3. Open the frontend

Simply open `frontend/index.html` in your browser.

> **Tip:** For local dev, you can also serve it with:
> ```bash
> npx serve frontend
> ```
> Then visit http://localhost:3000

---

## 🔧 Environment Variables

Create a `.env` file in `/backend` to override defaults:

```env
PORT=3001
YTDLP_BIN=/usr/local/bin/yt-dlp    # custom yt-dlp path
FRONTEND_URL=http://localhost:3000   # for CORS in production
```

---

## 🌐 Deployment

### Backend — Railway / Render / Fly.io

1. Push the `backend/` folder to a Git repo.
2. Add a `Procfile`:
   ```
   web: node server.js
   ```
3. Set env vars in the dashboard (`PORT`, `YTDLP_BIN`, `FRONTEND_URL`).
4. Ensure `yt-dlp` and `ffmpeg` are available in the runtime. Most Node.js buildpacks support installing them via a `postinstall` script:
   ```json
   "scripts": {
     "postinstall": "pip install yt-dlp"
   }
   ```

### Frontend — Netlify / Vercel / GitHub Pages

1. Update `API_BASE` in `frontend/index.html` to your deployed backend URL:
   ```js
   const API_BASE = 'https://your-backend.railway.app/api';
   ```
2. Deploy the `frontend/` folder as a static site.

---

## 📌 API Reference

### `GET /api/info?url=<youtube_url>`
Returns video metadata and available format list.

**Response:**
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": 212,
  "duration_string": "3:32",
  "uploader": "Channel Name",
  "view_count": 1400000,
  "formats": {
    "video": [{ "format_id": "137", "label": "1080p (HD)", "height": 1080, "filesize": 54321000 }],
    "audio": [{ "format_id": "140", "label": "128kbps M4A", "abr": 128, "filesize": 3400000 }]
  }
}
```

### `GET /api/download?url=&format_id=&type=video|audio&title=`
Streams the file directly. Nothing is saved on the server.

---

## 🔒 Legal Notice

This tool must only be used to download content you have the right to access and use. Do not download or redistribute copyrighted content without permission. Respect YouTube's Terms of Service.

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `yt-dlp: command not found` | Add yt-dlp to PATH, or set `YTDLP_BIN` env var |
| 1080p downloads are slow | ffmpeg is merging video+audio — this is normal |
| CORS error in browser | Set `FRONTEND_URL` env var on backend to your frontend origin |
| Video is private/age-restricted | yt-dlp may need cookies: `--cookies-from-browser chrome` |
