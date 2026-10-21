# APEX AI - Project Report

Author: Aabhas Gupta
Version: 0.1.0 (working prototype)
Event: Tech Utsav 2026, October 22-23
Live demo: https://apex-ai-three-sigma.vercel.app
Source: https://github.com/coderx-glitch/apex-ai

## 1. Overview

APEX AI is a personal workbench that keeps my daily tools in one place instead of many tabs and apps. It has a chat assistant (named Vyom), notes, tasks, documents, converters, a code space, a slide maker, plugins and a large game arcade. It runs in the browser and can be installed on a phone as a web app.

Goals:

1. One place for study and daily work: chat, notes, tasks and files.
2. Keep user data on the user's device. No cloud database of chats or notes.
3. Run entirely on free tiers, so it costs nothing to host and demo.
4. Stay usable when a free provider is slow or full, by falling back to a backup.
5. Be honest in the interface: if something is not set up or not built, the app says so.

## 2. Features

### Built and working

**Chat**
- Streaming answers in three modes: Assistant, Research (live web sources) and Reasoning.
- Replies in English and Hinglish, remembers earlier turns in the same chat.
- Attach files or images, record voice notes, and have answers read aloud.
- Branch a chat from any message, rename, pin, archive, search and export.
- Math symbols and formulas are cleaned up for display. Citations are shown only when a real source exists.

**Notes, tasks and memory**
- Note editor with import, study tools and PDF export.
- Task board and calendar, templates, priorities, tags and reminders (while the app is open).
- A memory page for facts the user chooses to keep.

**Documents and research**
- Read PDFs, scan and OCR images in the browser.
- Web research with sources and a Wikipedia lookup.

**Code**
- Write and run Python in the browser. A step-by-step project builder for small projects.

**Media and converters**
- Free image generation, background removal and upscaling.
- A video enhancer and slideshow maker that run on the device.
- File and image converters that never upload the file.

**Slides**
- Generates a real `.pptx` presentation.

**Plugins** (all free tiers): weather, recipes, news, movies and TV, music, anime, books, currency, YouTube, space photos and near-earth objects, stock photos, Wikipedia.

**Games**
- 67 games with local bots, including games controlled by hand, face or eye movement through the camera, and a Rooms mode for a shared quiz.

**Look and feel**
- 24 themes, five of them open to guests.
- A cinematic login with a 3D scene and liquid-glass panels on strong devices, a lighter look on weak devices and a static one on phones.
- Reduced-motion setting is respected.

**Accounts and plans**
- Guest mode with a shared daily allowance, or sign in with Google or email.
- Free, Go, Plus and Pro tiers, a token counter, and tokens earned by playing games. UPI purchases are verified by hand by the owner.

### Upcoming

Labelled "Coming next" in the app and not working yet:

- Failure Forecast
- Time Travel
- Multi-agent tasks
- Cash Pro purchases (paused)
- Paid video generation (locked)

## 3. Architecture

```
Browser (React app, local storage)
   |  fetch
   v
Serverless functions (api/*.js on Vercel)
   |-- chat.js        language model streaming, backup routing, limits
   |-- connect.js     plugins and optional connectors (keys stay server-side)
   |-- status.js      health, configuration and shared rooms
   |-- image.js, video.js, code.js, summarize.js, file-upload.js, ...
   |
   +--> language model API (main) --slow or full--> second free provider (backup)
   +--> Firestore: one small record with the shared guest quota counters
   +--> plugin APIs (weather, news, movies, space, photos ...)
```

Key design points:

- **Data stays local.** Chats, notes, tasks and settings are kept in the browser, separated into owner, guest and per-account workspaces. The server does not store user content.
- **Keys stay on the server.** Browser code never contains an API key. The build runs `setup/check-public-secrets.mjs` and fails if a known key pattern appears in the public output.
- **Fast fallback.** The chat endpoint waits up to 5 seconds for the first word from the main model. If nothing arrives, or the provider returns an error, a backup provider answers instead.
- **Fair use for the demo.** A transaction in Firestore reserves one request from a shared daily allowance. Limits apply per visitor, per IP (hashed) and overall, plus per-minute limits. Failed calls still count.
- **Safe caching.** A small cache answers only repeated plain single questions that contain nothing personal, live or time-based. The cache key includes everything that could change the answer.
- **Adaptive visuals.** The app checks the device (cores, touch, measured frame rate) and picks a 3D, light or static look. Heavy effects are off on phones.
- **Function limit.** The free hosting plan allows 12 serverless functions, so new endpoints are routed through existing ones (for example, Rooms goes through `status.js`).

## 4. Tech stack

| Layer | Technology |
| --- | --- |
| Front end | React 19, Vite 6, CSS |
| Back end | Node.js serverless functions (Vercel) |
| Auth and quota | Firebase Authentication, Firestore |
| AI | Free-tier hosted language model API plus a free backup provider |
| In-browser runtimes | Pyodide, Tesseract.js, FFmpeg (wasm), MediaPipe Tasks Vision, PDF.js, pdf-lib, pptxgenjs, background-removal model |
| Tests | Node built-in test runner |
| Hosting | Vercel (free plan), Mumbai region |

## 5. Setup

Requirements: Node.js 20 or newer.

```bash
git clone https://github.com/coderx-glitch/apex-ai.git
cd apex-ai
npm install
cp .env.example .env     # add your own keys; all are optional
npm run dev              # front end
npx vercel dev           # front end plus the api/ functions
```

Variables are listed by name in `.env.example`. Login and guest-quota setup is in `setup/FIREBASE-SETUP.md`.

## 6. Testing

- **Unit tests:** `npm test` runs 24 tests across 14 files. They cover the answer cache and its safety rules, first-token fallback, provider fallback, math handling, the clock and date helpers, research citation rules, document context, speaker selection and YouTube link handling. All pass at the time of writing.
- **Build check:** `npm run build` also scans the public output for secrets.
- **Manual end-to-end pass (headless Chrome, before the event):** all 27 pages open without layout overflow or script errors at desktop (1280 px), tablet (768 px) and phone (390 px) widths; guest login, back to sign-in and login again; chat, follow-up memory, Hinglish and the input-length limit; task create and reload; the plugin endpoints; text-to-speech.

## 7. Limits and known gaps

I want this section to be honest.

- **Free tiers.** Speed and availability depend on provider quotas. When the main model is slow, the backup answers, and answer style can differ a little.
- **Space photo plugin.** The photo-of-the-day service is sometimes unavailable. The app then shows an error message and nothing is faked. The asteroid list works.
- **Guest cap.** Guests get a small shared allowance (15 requests per visitor per day) and a 2,000-character message limit.
- **Not tested on real hardware.** Automated tests ran in headless Chrome with software rendering. I did not run frame-rate tests on real phones. The microphone and "Hey APEX" voice trigger, Google sign-in with real accounts, image generation, and the paid-plan flows were not part of the automated pass.
- **No cloud sync.** Data is per browser. Clearing browser data removes it unless exported.
- **Reminders** work only while the app is open.
- **Phone app.** The main route is the installable web app (PWA). An Android APK that wraps the live site is on the GitHub Releases page; it is not on the Play Store, its source is not in this repository, and it was not part of the automated tests. There is no iOS build; on iPhone, use Add to Home Screen.
- **Optional connectors** (Google Calendar, Gmail, GitHub, Notion) exist in the code but are not enabled on the public demo.
- **Provider names.** The assistant is told not to name the model provider behind it.

## 8. History

The first version of this repository was a Flask server that served a React front end. I moved to serverless functions on Vercel so the app could be hosted for free with fast regional response, and the old server files were removed in the commit that restructured the repository. They are still available in the git history.
