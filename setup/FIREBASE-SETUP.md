# Login and shared guest allowance setup (Firebase)

1. In Firebase Console, create a separate APEX project. Keep the **Spark** plan, no billing account, no Google Cloud trial, Analytics off. Do not change existing projects.
2. Add a Web app. Copy its public `firebaseConfig` object. This is app configuration, not the private service-account JSON.
3. Authentication > Get started > Sign-in method: enable Google (choose your support email) and Email/Password. Settings > Authorized domains: add `apex-ai-three-sigma.vercel.app`. No Google OAuth secret is needed for Firebase's normal Google provider.
4. Firestore Database > Create database > Standard edition, default database, Production mode. Pick your region. Publish `firestore.rules` from this package: browser access is denied; only the server credential can reserve quota. Do not turn on TTL, backups, PITR, billing, Storage or Cloud Functions.
5. Project settings > Service accounts > Generate new private key. This downloads JSON containing a private key. Store its full contents only as the server environment variable `FIREBASE_SERVICE_ACCOUNT_JSON` in your hosting dashboard. Never put it in chat, GitHub, a screenshot, or public browser code.
6. Server configuration: `FIREBASE_PUBLIC_CONFIG` (public object), `FIREBASE_SERVICE_ACCOUNT_JSON` (private JSON), `APEX_AUTH_PROVIDERS=google`, `APEX_AUTH_EMAIL_READY=true`, `APEX_FIREBASE_SPARK_CONFIRMED=true`, generated `APEX_GUEST_SECRET`, `APEX_GEMINI_FREE_CONFIRMED=true` only after matching the installed key's project, then `APEX_GUEST_ENABLED=true` only after transaction and provider tests pass. No `VITE_` secrets.
7. GitHub login: create an OAuth app in your own GitHub Developer settings. Use the Firebase provider panel's **actual callback URL**, not a guessed URL. Enable GitHub with its client ID/secret, and add `github` to the verified enabled-provider list after a real login test. Keep the client secret in your hosting environment variables only. Microsoft and Yahoo work the same way but each needs its own app registration and actual callback from Firebase. Leave them “Not set up” until ready.

## What will be verified before guest AI is opened

- Spark/no billing, project matches the service credential, deny-public rules.
- A real transaction, concurrent reservation test, simulated new server instances, exhausted-cap denial and UTC-day reset.
- One real anonymous chat and one owner-code chat; no paid/research/fallback calls for guests.
- Fresh visitor has no owner data or settings. Signing in does not grant owner access or sync local chats.
- Shared demo caps: 50 reservations/day globally, 10/IP/day, 5/visitor/day, 10 globally/minute and 2/IP/visitor/minute. UTC calendar day. Failed/timed-out calls count, no auto-retry/refund. A private HttpOnly signed cookie identifies a visitor; raw IPs/chats are not stored in the quota record. IPs are HMAC hashed. Reset cookies do not reset the IP cap; VPNs can change IPs, so this is not perfect bot prevention. The global cap still applies.
- Up to8messages, latest message2,000characters, each older message4,000, total12,000; one image under128KB; output1,024tokens. Provider limits can run out sooner. No guarantee of unlimited availability.

## Free limits and boundaries

Firebase Spark: no payment method, most social/email Auth included. Firestore free quotas:50,000reads/day,20,000writes/day,1GiB storage. Service stops at free-plan limits instead of charging. Counters use one bounded record, no scheduled cleanup/TTL service. Vercel server executes the quota transaction; Firebase Functions and Storage are not used. Provider accounts have their own signup/email rate limits. Email verification delivery is not guaranteed.

Chats/notes/tasks remain browser-local, separated into owner, guest and per-account workspaces. Accounts do not add cloud sync or recover an unsaved local workspace. Someone with developer access to your browser can inspect its local storage; do not treat UI locks as encrypted local storage. Never share your owner code.

Sources:
https://firebase.google.com/pricing/
https://firebase.google.com/docs/firestore/quotas
https://firebase.google.com/docs/admin/setup
https://firebase.google.com/docs/auth/web/start
https://vercel.com/docs/headers/request-headers
