# APEX AI - Flask backend
# Serves the built front end from /dist and the /api routes the app talks to.
# Run:  python app.py   (needs GEMINI_API_KEY and APEX_ACCESS_TOKEN in .env)

import os
import time
import json
import hmac
import requests
from flask import Flask, request, jsonify, send_from_directory, Response
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="dist", static_url_path="")

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
OWNER_CODE = os.environ.get("APEX_ACCESS_TOKEN", "")
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"
UPLOAD_BASE = "https://generativelanguage.googleapis.com/upload/v1beta/files"

# biggest file the AI upload bridge accepts (bytes)
MAX_FILE_SIZE = 400 * 1024 * 1024
MAX_CHUNK_B64 = 4_200_000

# basic per-IP bucket so one visitor can't hammer the free quota
_calls = {}


def owner_ok():
    auth = request.headers.get("Authorization", "")
    code = auth.removeprefix("Bearer ")
    return bool(OWNER_CODE) and hmac.compare_digest(code, OWNER_CODE)


def rate_limited(limit=12, window=60):
    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "?")
    ip = ip.split(",")[0].strip()
    now = time.time()
    start, count = _calls.get(ip, (now, 0))
    if now - start > window:
        start, count = now, 0
    count += 1
    _calls[ip] = (start, count)
    return count > limit


@app.errorhandler(404)
def spa_fallback(e):
    # client-side router handles every non-API path
    if request.path.startswith("/api/"):
        return jsonify(error="Not found"), 404
    return send_from_directory("dist", "index.html")


@app.get("/api/status")
def status():
    return jsonify(
        gemini=bool(GEMINI_KEY),
        openai=bool(os.environ.get("OPENAI_API_KEY")),
        image={"enabled": bool(os.environ.get("CLOUDFLARE_ACCOUNT_ID"))},
        research={"enabled": False,
                  "reason": "General AI search entitlement not verified; no paid search fallback."},
        video={"enabled": False},
        version="0.1.0",
        storage="device-local",
        reminders="app-open-only",
        integrations=False,
    )


def sse(event):
    return "data: " + json.dumps(event) + "\n\n"


@app.post("/api/chat")
def chat():
    if not owner_ok():
        return jsonify(error="Owner access required"), 401
    if rate_limited():
        return jsonify(error="Too many requests. Try again in a minute."), 429
    if not GEMINI_KEY:
        return jsonify(error="gemini is not configured. Add a server-side API key."), 503

    body = request.get_json(silent=True) or {}
    messages = body.get("messages") or []
    if not messages or len(messages) > 60:
        return jsonify(error="Invalid or oversized request."), 400

    model = os.environ.get("GEMINI_FAST_MODEL", "gemini-2.5-flash-lite")
    contents = []
    for m in messages:
        role = "model" if m.get("role") == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": str(m.get("content") or "(empty)")}]})

    # attachments arrive either as small inline images or Files API handles
    for a in (body.get("attachments") or [])[:2]:
        part = None
        if a.get("data") and len(a["data"]) < 3_500_000:
            part = {"inline_data": {"mime_type": a["mime"], "data": a["data"]}}
        elif str(a.get("fileUri", "")).startswith("https://generativelanguage.googleapis.com/"):
            part = {"file_data": {"mime_type": a["mime"], "file_uri": a["fileUri"]}}
        if part:
            contents[-1]["parts"].append(part)

    url = f"{GEMINI_BASE}/models/{model}:streamGenerateContent"
    params = {"key": GEMINI_KEY, "alt": "sse"}
    payload = {"contents": contents,
               "generationConfig": {"maxOutputTokens": 4096}}

    def stream():
        yield sse({"type": "model", "model": model, "provider": "gemini"})
        try:
            with requests.post(url, params=params, json=payload,
                               stream=True, timeout=60) as r:
                if r.status_code != 200:
                    yield sse({"type": "error",
                               "message": "AI service usage limit reached. Try again later."})
                    return
                for line in r.iter_lines(decode_unicode=True):
                    if not line or not line.startswith("data: "):
                        continue
                    chunk = json.loads(line[6:])
                    for cand in chunk.get("candidates", []):
                        for part in cand.get("content", {}).get("parts", []):
                            if part.get("text"):
                                yield sse({"type": "delta", "text": part["text"]})
        except requests.RequestException:
            yield sse({"type": "error", "message": "Provider unavailable. Try again."})
            return
        yield sse({"type": "done"})

    return Response(stream(), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})


@app.post("/api/file-upload")
def file_upload():
    # bridge to Google's resumable file upload, owner only
    if not owner_ok():
        return jsonify(error="Large-file AI upload needs the owner sign-in."), 403
    if not GEMINI_KEY:
        return jsonify(error="Gemini is not configured."), 503
    body = request.get_json(silent=True) or {}
    action = body.get("action")

    if action == "start":
        if rate_limited():
            return jsonify(error="Too many uploads starting at once."), 429
        size = body.get("size") or 0
        if not 0 < size <= MAX_FILE_SIZE:
            return jsonify(error="Limit: 400 MB per file for AI upload."), 400
        r = requests.post(
            UPLOAD_BASE, params={"key": GEMINI_KEY},
            headers={"X-Goog-Upload-Protocol": "resumable",
                     "X-Goog-Upload-Command": "start",
                     "X-Goog-Upload-Header-Content-Length": str(size),
                     "X-Goog-Upload-Header-Content-Type": body.get("mime", ""),
                     "Content-Type": "application/json"},
            json={"file": {"display_name": str(body.get("name", "file"))[:160]}},
            timeout=30)
        if r.status_code != 200:
            return jsonify(error="Google refused the upload start."), 502
        return jsonify(uploadUrl=r.headers.get("x-goog-upload-url"))

    if action == "chunk":
        upload_url = str(body.get("uploadUrl", ""))
        if not upload_url.startswith("https://generativelanguage.googleapis.com/"):
            return jsonify(error="Upload session invalid. Start again."), 400
        data = body.get("data") or ""
        if not data or len(data) > MAX_CHUNK_B64:
            return jsonify(error="Chunk too large or empty."), 400
        import base64
        blob = base64.b64decode(data)
        cmd = "upload, finalize" if body.get("final") else "upload"
        r = requests.put(upload_url, data=blob, timeout=60, headers={
            "Content-Length": str(len(blob)),
            "X-Goog-Upload-Offset": str(body.get("offset", 0)),
            "X-Goog-Upload-Command": cmd})
        if r.status_code != 200:
            return jsonify(error="Google refused an upload chunk."), 502
        if not body.get("final"):
            return jsonify(received=int(body.get("offset", 0)) + len(blob))
        f = r.json().get("file", {})
        return jsonify(file=f.get("name"), uri=f.get("uri"),
                       state=f.get("state", "PROCESSING"), mime=f.get("mimeType"))

    if action == "status":
        name = str(body.get("file", ""))
        if not name.startswith("files/"):
            return jsonify(error="File handle invalid."), 400
        r = requests.get(f"{GEMINI_BASE}/{name}", params={"key": GEMINI_KEY}, timeout=30)
        if r.status_code != 200:
            return jsonify(error="Google could not report the file state."), 502
        f = r.json()
        return jsonify(state=f.get("state", "PROCESSING"), uri=f.get("uri"),
                       mime=f.get("mimeType"))

    return jsonify(error="Unknown upload action."), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
