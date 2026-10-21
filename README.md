<p align="center">
  <img src="docs/images/banner.svg" alt="APEX AI - my personal AI workbench" width="100%">
</p>

<p align="center">
  <a href="https://apex-ai-three-sigma.vercel.app"><img alt="Live demo" src="https://img.shields.io/badge/live%20demo-open%20the%20app-d4ff61?style=for-the-badge&labelColor=0b0d10"></a>
  <a href="docs/REPORT.md"><img alt="Project report" src="https://img.shields.io/badge/project-report-8a93a6?style=for-the-badge&labelColor=0b0d10"></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white&labelColor=20232a">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white&labelColor=20232a">
  <img alt="Node" src="https://img.shields.io/badge/Node.js-20%2B-5fa04e?logo=nodedotjs&logoColor=white&labelColor=20232a">
  <img alt="Vercel" src="https://img.shields.io/badge/hosted%20on-Vercel-000000?logo=vercel&logoColor=white">
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28?logo=firebase&logoColor=black&labelColor=20232a">
  <img alt="Tests" src="https://img.shields.io/badge/unit%20tests-24%20passing-3fb950">
  <img alt="PWA" src="https://img.shields.io/badge/installable-PWA-5a0fc8?logo=pwa&logoColor=white">
</p>

# APEX AI

APEX AI is a personal workbench I built as a student. Instead of switching between a chat app, a notes app, a to-do list, a PDF reader and a few games, I wanted one place that does all of it and keeps my data on my own device.

The assistant inside is called **Vyom**. It answers in English and Hinglish, reads my documents, runs Python in the browser, makes slide decks and helps me study. When it is not working on something, there are 67 games to play.

**Try it:** https://apex-ai-three-sigma.vercel.app (press *Continue as guest*, no sign-up needed)

<p align="center">
  <img src="docs/images/login.jpg" alt="APEX AI login screen with a 3D scene" width="100%">
</p>

---

## Contents

- [Screenshots](#screenshots)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Honest limits](#honest-limits)
- [Project layout](#project-layout)

## Screenshots

All screenshots below were taken from the live app in a guest session.

### Chat with Vyom

<p align="center"><img src="docs/images/chat.jpg" alt="Chat answering in Hinglish" width="100%"></p>

Streaming answers, three modes (Assistant, Research, Reasoning), follow-up memory, attachments, voice notes, branching and export.

### Home and all tools

<table>
  <tr>
    <td width="50%"><img src="docs/images/home.jpg" alt="Home dashboard"></td>
    <td width="50%"><img src="docs/images/tools.jpg" alt="All tools directory"></td>
  </tr>
  <tr>
    <td align="center"><sub>Home: shortcuts and project overview</sub></td>
    <td align="center"><sub>All tools: search and pin your favourites</sub></td>
  </tr>
</table>

### Tasks, code and plugins

<table>
  <tr>
    <td width="33%"><img src="docs/images/tasks.jpg" alt="Task board"></td>
    <td width="33%"><img src="docs/images/code.jpg" alt="Code studio"></td>
    <td width="33%"><img src="docs/images/plugins.jpg" alt="Plugin library"></td>
  </tr>
  <tr>
    <td align="center"><sub>Tasks with calendar and templates</sub></td>
    <td align="center"><sub>Code space with Python in the browser</sub></td>
    <td align="center"><sub>Twelve free live-data plugins</sub></td>
  </tr>
</table>

### Games, themes and plans

<table>
  <tr>
    <td width="33%"><img src="docs/images/games.jpg" alt="Game shelf"></td>
    <td width="33%"><img src="docs/images/themes.jpg" alt="Theme picker"></td>
    <td width="33%"><img src="docs/images/plans.jpg" alt="Plans and tokens"></td>
  </tr>
  <tr>
    <td align="center"><sub>67 games with local bots</sub></td>
    <td align="center"><sub>24 themes</sub></td>
    <td align="center"><sub>Plans and the token counter</sub></td>
  </tr>
</table>

### Light theme and phone

<table>
  <tr>
    <td width="52%"><img src="docs/images/light-theme.jpg" alt="Light theme"></td>
    <td width="24%"><img src="docs/images/phone-login.jpg" alt="Phone login"></td>
    <td width="24%"><img src="docs/images/phone-chat.jpg" alt="Phone chat"></td>
  </tr>
  <tr>
    <td align="center"><sub>A light theme</sub></td>
    <td align="center" colspan="2"><sub>Installable on a phone as a web app</sub></td>
  </tr>
</table>

## Features

Everything in this section is built and working in the current version.

### Chat and voice
- Streaming answers in **Assistant**, **Research** (live web sources) and **Reasoning** modes
- English and Hinglish, with memory of earlier turns in the same chat
- Attach files and images, record **voice notes**, have answers **read aloud**
- Branch from any message, rename, pin, archive, search and export a chat
- Clean maths output: symbols and formulas are rendered, not shown as raw markup

### Notes, tasks and memory
- Note editor with import, study tools and PDF export
- Task board and calendar, templates, priorities, tags, reminders while the app is open
- A confirm dialog before a task is saved
- A memory page for facts you choose to keep

### Documents, research and code
- Read PDFs, scan and OCR images in the browser
- Web research with sources, and Wikipedia lookup
- Write and run **Python in the browser**, plus a step-by-step project builder

### Media and converters
- Free image generation, background removal and upscaling
- A video enhancer and slideshow maker that run on the device
- File and image converters that never upload the file

### Slides
- Builds a real `.pptx` presentation you can open in PowerPoint

### Plugins (free tiers)
Weather, recipes, news, movies and TV, music, anime, books, currency, YouTube, space photos and asteroids, stock photos, Wikipedia.

### Games
- **67 games** with local bots, including games you control with your **hand, face or eyes** through the camera
- A Rooms mode: share a code and play a live quiz together

### Look and feel
- **24 themes** (5 open to guests), light and dark
- A cinematic login with a 3D scene and liquid-glass panels on strong devices, and a lighter version on weaker ones
- Animations are on by default. A setting in *Appearance > Reading > Motion* lets you follow your device setting or reduce motion

### Accounts and plans
- Guest mode with a shared daily allowance, or sign in with Google or email
- Free, Go, Plus and Pro tiers, a token counter, and tokens earned by playing games. UPI purchases are checked by hand by the owner

### Privacy
- Chats, notes, tasks and memory stay in your browser. There is no cloud database of your content
- API keys live only in server settings and never reach the browser. The build fails if a known key pattern shows up in the public files

## Architecture

```mermaid
flowchart LR
  U[User on phone or desktop] --> B[React app<br/>browser storage]
  B -->|fetch| API[Serverless functions<br/>api/*.js on Vercel]
  API --> M1[Main language model<br/>free tier]
  API -. slow or full .-> M2[Backup provider<br/>free tier]
  API --> FS[(Firestore<br/>guest quota counter)]
  API --> PL[Plugin APIs<br/>weather, news, movies, space, photos]
  B --> RT[In-browser runtimes<br/>Python, OCR, FFmpeg, hand and face tracking]
  B --> AU[Firebase Auth<br/>Google and email]
```

How it works:

1. **Local first.** The app keeps chats, notes and tasks in browser storage, separated into owner, guest and per-account workspaces.
2. **Thin server.** The `api/` functions only hold secrets and talk to outside services. They do not store user content.
3. **Fast fallback.** The chat function waits up to 5 seconds for the first word from the main model. If nothing arrives, or the provider errors, a backup provider answers.
4. **Fair use.** A Firestore transaction reserves one request from a shared daily allowance, with limits per visitor, per IP (hashed) and overall.
5. **Safe caching.** Only a repeated plain single question with nothing personal or live in it can be answered from cache.
6. **Adaptive visuals.** The app picks a 3D, light or static look from the device, so weaker phones stay smooth.

More detail is in [docs/REPORT.md](docs/REPORT.md).

## Tech stack

| Layer | Technology |
| --- | --- |
| Front end | React 19, Vite 6, plain CSS, canvas and WebGL scenes |
| Back end | Node.js serverless functions on Vercel (Mumbai region) |
| Auth and quota | Firebase Authentication, Firestore |
| AI | A free-tier hosted language model API with a second free provider as backup |
| In the browser | Pyodide (Python), Tesseract.js (OCR), FFmpeg (wasm), MediaPipe (hand, face and eye tracking), PDF.js, pdf-lib, pptxgenjs, a background-removal model |
| Tests | Node's built-in test runner |

## Getting started

You need Node.js 20 or newer.

```bash
git clone https://github.com/coderx-glitch/apex-ai.git
cd apex-ai
npm install
cp .env.example .env      # add your own keys, all are optional
npm run dev
```

The dev server serves the front end. To run the `api/` functions as well, use `npx vercel dev` with your own free account. Without keys the app still opens, and every tool that does not need a server key works. A feature whose key is missing says so on screen.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the front end with hot reload |
| `npm run build` | Production build, then scan the public files for secrets |
| `npm test` | Run the unit tests |
| `npm run check:public` | Run only the secret scan |

### Deploy

The project is ready for Vercel (see `vercel.json`). Add the variable names from `.env.example` in the project settings. Login and guest quota setup is written up in [setup/FIREBASE-SETUP.md](setup/FIREBASE-SETUP.md).

## Testing

- **Unit tests:** `npm test` runs 24 tests in 14 files: answer cache safety, first-word fallback, provider fallback, maths handling, date and clock helpers, research citation rules, document context, speaker selection and YouTube links. All pass.
- **Build check:** every build scans the public output for secrets.
- **Manual pass in headless Chrome before the event:** all 27 pages at desktop, tablet and phone widths with no overflow or script errors, guest login and re-login, chat, follow-up memory, Hinglish, the input limit, task save and reload, the plugin endpoints and text-to-speech.

## Roadmap

Not built yet. These show as **Coming next** in the app:

- [ ] Failure Forecast: warn when a task is likely to slip
- [ ] Time Travel: ask what you were working on 30 days ago
- [ ] Multi-agent tasks: planner, researcher and critic with a visible trace
- [ ] Cash Pro purchases (paused)
- [ ] Paid video generation (locked)

## Honest limits

- The AI runs on free tiers. Answers can be slow or briefly unavailable when a provider is busy. The backup covers most cases.
- Guests get a small shared allowance (15 requests per visitor per day).
- Reminders only fire while the app is open.
- Chats and notes do not sync between devices.
- The 3D login needs a reasonably strong device. Weaker phones get a simpler look on purpose.
- The NASA photo of the day is sometimes unavailable. The app then shows the last real photo it fetched with its date, or an error. It never shows a made-up image.
- I tested in headless Chrome. I did not run frame-rate tests on real phones, and the microphone, the "Hey APEX" voice trigger, Google sign-in with real accounts and image generation were not in the automated pass.
- The phone app is an installable web app (PWA). An Android APK that wraps the live site is on the Releases page. It is not on the Play Store, and its source is not in this repository.

## Project layout

```
api/        serverless endpoints (chat, connect, status, image, code, uploads ...)
lib/        shared logic for the server and the app (limits, security, caches, games ...)
src/        React app: screens, styles, 3D scenes
public/     static assets and the browser-side runtimes (OCR, FFmpeg, Pyodide, vision)
tests/      unit tests
setup/      setup notes and build-time checks
docs/       project report and README images
```

## Author

Built by **Aabhas Gupta**.
