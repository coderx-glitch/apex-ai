# APEX AI

A personal AI workbench I built as a student project. It puts the tools I use every day in one web app: a chat assistant, notes, tasks, documents, converters, a code space, a slide maker and a large arcade of games. It also works as an installable phone app.

**Live demo:** https://apex-ai-three-sigma.vercel.app (open it and press *Continue as guest*)

The assistant inside the app is called **Vyom**.

> Project status: working prototype, built for Tech Utsav 2026 (October 22-23). See [docs/REPORT.md](docs/REPORT.md) for the full project report, architecture and honest limits.

## What it does

Everything below is built and working in the current version.

| Area | What you get |
| --- | --- |
| Chat | Streaming answers in Assistant, Research and Reasoning modes, Hinglish support, follow-up memory, file and image attachments, voice notes, read-aloud replies, branch from any message, export a chat |
| Notes and tasks | A note editor with study tools and PDF export, a task board and calendar view, templates, reminders while the app is open, and a confirm dialog before a task is saved |
| Documents and research | Read PDFs, scan and OCR images, web research with sources, Wikipedia lookup |
| Code | Write and run Python in the browser, a step-by-step project builder |
| Media | Free image generation, image tools (background removal, upscale), a video enhancer and slideshow maker that run on the device |
| Converters | File and image conversion in the browser (no upload to a server) |
| Slides | Builds a real `.pptx` file |
| Plugins | Weather, recipes, news, movies and TV, music, anime, books, currency, YouTube, space photos, stock photos, Wikipedia |
| Games | 67 games with a bot to play against, including games you control with your hand, face or eyes through the camera, plus a quiz Rooms mode |
| Look and feel | 24 themes (5 open to guests), liquid-glass login with a 3D scene on strong devices, a lighter version on weak devices, reduced-motion support |
| Plans and tokens | Free, Go, Plus and Pro tiers, a token counter, and tokens earned by playing games. Plan purchases by UPI are checked by hand by the owner |

### Upcoming (not built yet)

These appear in the app labelled **Coming next**. They are not working features:

- Failure Forecast (warn when a task is likely to slip)
- Time Travel (ask what you were working on 30 days ago)
- Multi-agent tasks (planner, researcher and critic with a visible trace)
- Cash Pro purchases (paused)
- Paid video generation (locked)

## Privacy by design

- Chats, notes, tasks and memory are stored in the visitor's own browser (local storage). There is no cloud database of user content.
- API keys live only in server environment variables. The browser never sees them, and the build runs a scan that fails if a known key pattern ends up in the public files.
- The public demo shares a small free allowance between all guests. Daily limits per visitor, per IP and overall protect the free quotas.

## Tech stack

- **Front end:** React 19, Vite 6, plain CSS, a few canvas/WebGL scenes
- **Back end:** serverless functions in `api/` (Node.js on Vercel)
- **AI:** a free-tier hosted language model API, with a second free provider that answers automatically when the first is slow or full
- **Sign-in and guest allowance:** Firebase Authentication (Google and email) and Firestore for the shared quota counter
- **In the browser:** Pyodide (Python), Tesseract (OCR), FFmpeg (video), MediaPipe (hand, face and eye tracking), pdf-lib and PDF.js, pptxgenjs, a background-removal model
- **Tests:** Node's built-in test runner

## Project layout

```
api/        serverless endpoints (chat, connect, status, image, code, uploads ...)
lib/        shared logic used by the server and the app (limits, security, caches, games ...)
src/        React app: screens, styles, 3D scenes
public/     static assets and the browser-side runtimes (OCR, FFmpeg, Pyodide, vision)
tests/      unit tests
setup/      setup notes and build-time checks
docs/       project report
```

## Run it locally

You need Node.js 20 or newer.

```bash
git clone https://github.com/coderx-glitch/apex-ai.git
cd apex-ai
npm install
cp .env.example .env      # then add your own keys (all optional)
npm run dev
```

The dev server serves the front end. The `api/` functions need a serverless host to run; the easiest way is `npx vercel dev` with your own free account. Without keys, the app still opens and every tool that does not need a server key works. Features that need a missing key say so on screen.

### Build and test

```bash
npm run build     # production build plus the public-secret scan
npm test          # unit tests
```

### Deploy

The project is set up for Vercel (`vercel.json`). Add the variables from `.env.example` in the project settings, then deploy. Login setup is described in [setup/FIREBASE-SETUP.md](setup/FIREBASE-SETUP.md).

## Honest limits

- The AI runs on free tiers, so answers can be slow or temporarily unavailable when a provider is busy. The backup provider covers most of these cases.
- Guest use is capped (15 requests per visitor per day on the demo).
- Reminders only fire while the app is open.
- Notes and chats do not sync between devices.
- The 3D login look needs a reasonably strong device; weaker phones get a simpler version on purpose.
- Tested mainly in Chrome. The phone app is an installable web app (PWA). An Android APK that wraps the live site is on the Releases page; it is not on the Play Store and its source is not part of this repository.

## Author

Aabhas Gupta
