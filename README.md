# APEX AI

My personal AI workbench. One Flask server that serves the web app and talks
to the AI provider, so the API key never sits in the browser.

I built this to keep my daily stuff in one place - chat with documents, notes,
tasks, a few games, and some camera experiments. Everything a visitor saves
stays in their own browser (localStorage). There is no cloud account database
to leak because there is no cloud account database.

## Tech stack

- **Backend:** Python + Flask (this repo, `app.py`)
- **Frontend:** React + Vite (source in `frontend/`, builds into `dist/`)
- **AI:** Google Gemini free tier (chat + file understanding)
- **Hosting:** any box that can run Python - gunicorn for production

## Run it locally (VS Code)

1. Install Python 3.11+ and Node 20+.
2. `pip install -r requirements.txt`
3. Build the front end once:
   ```
   cd frontend
   npm install
   npm run build
   xcopy /E /I dist ..\dist     :: on Mac/Linux: cp -r dist ../dist
   ```
4. Make a `.env` file in the project root:
   ```
   GEMINI_API_KEY=paste-your-free-key-from-aistudio.google.com
   APEX_ACCESS_TOKEN=make-up-a-long-owner-code
   # optional, only for AI images (free account at cloudflare.com):
   CLOUDFLARE_ACCOUNT_ID=
   CLOUDFLARE_API_TOKEN=
   CLOUDFLARE_FREE_TIER_CONFIRMED=true
   APEX_GUEST_IMAGE_ENABLED=true
   APEX_GEMINI_FREE_CONFIRMED=true
   ```
5. `python app.py` and open http://localhost:5000

The owner code is what unlocks AI features. Without it you still get the
guest workspace (notes, tasks, games - all local).

## What works

- Chat with Gemini, streaming replies
- Attach photos (resized on-device, original never touched)
- Upload big files (video/audio/large PDFs, up to 400 MB) to the AI through
  a chunked bridge - Google keeps them max 48 hours on the free tier
- Notes, tasks, projects, memory - all saved on the device
- 50+ small games with a token system: play games, earn tokens, unlock themes
- Voice launcher ("Hey APEX") and experimental eye/hand controls

## Honest limits

- The free Gemini tier has daily limits; when it runs out, chat pauses.
- Reminders only fire while the app is open (no background service).
- No paid features, no tracking, no analytics.
- This is a learning project, not a production multi-user system.

## Project layout

```
app.py             Flask server + API routes (chat for owner + guests,
                   code builder, image generation, summarize, status,
                   file upload bridge, access check, model list)
requirements.txt   Python dependencies
frontend/          React source (Vite build -> ../dist)
```

Image generation goes through a free Cloudflare Workers AI account and
the code builder through the same free Gemini key - both need their own
free accounts in .env (see the example above) and stay off until you add
them. Paid video stays locked on purpose; the free short clips go
straight from the browser to the public LTX demo, so no key for that
either. Guest limits are simple in-memory counters (one small server),
with the same daily numbers the site shows.
