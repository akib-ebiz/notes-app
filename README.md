# Notes App (LocalStorage) — React + Vite

Frontend-only Notes app (no backend). Notes are saved in your browser using `localStorage`.

## Features

- Add / Edit / Delete notes
- Search notes
- Dark mode toggle
- Persists to `localStorage` automatically

## Run locally

```bash
cd notes-app
npm install
npm run dev
```

## Build (what Vercel runs)

```bash
npm run build
npm run preview
```

## Environment variables (demo)

This app doesn’t need any secrets, but it includes a small demo env var:

- Copy `.env.example` → `.env`
- Change `VITE_APP_NAME`

Important:

- **Vite only exposes variables that start with `VITE_` to the browser.**
- **Never put secrets in `VITE_*`** (they will be bundled and visible in DevTools).

## GitHub (create repo + push)

### Option A: GitHub website

- Go to your profile: [akib-ebiz on GitHub](https://github.com/akib-ebiz/)
- Create a new repository (example: `notes-app`)
- Then in your terminal (from `E:\Projects\Notes App\notes-app`):

```bash
git init
git add .
git commit -m "Initial commit: notes app (localStorage)"
git branch -M main
git remote add origin https://github.com/akib-ebiz/notes-app.git
git push -u origin main
```

### Option B: GitHub CLI (if you have `gh`)

```bash
git init
git add .
git commit -m "Initial commit: notes app (localStorage)"
gh repo create notes-app --public --source . --remote origin --push
```

## Deploy to Vercel

- Go to Vercel → **Add New… → Project**
- Import your GitHub repo
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Click **Deploy**

## Real project secret management (quick rules)

- **Local dev**: put secrets in `.env.local` (never commit it).
- **Vercel**: Project → Settings → Environment Variables.
- **Frontend (public)** config: ok to expose (Vite: `VITE_*`, Next.js: `NEXT_PUBLIC_*`).
- **Backend-only secrets**: keep on server/runtime only (API keys, DB URLs, JWT secrets).
- **Rotate keys** if you ever accidentally commit them.

