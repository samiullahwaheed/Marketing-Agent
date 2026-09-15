# Marketing agent dashboard

A Next.js dashboard for the n8n marketing agent: create a post from a topic, review what
the agent generated per platform, approve/reject/rewrite it, and track what's published,
scheduled, or failed. Posts and account state are stored in MongoDB.

## Setup

1. **MongoDB** — open `.env.local` and replace the placeholder connection string:
   ```
   MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/Agent?retryWrites=true&w=majority
   ```
   with your real Atlas URI.

2. **Dashboard password** — `.env.local` has `DASHBOARD_PASSWORD` (change it anytime; it's
   the only login credential, checked by `src/app/login`).

3. **n8n webhook (optional)** — set `N8N_CREATE_POST_WEBHOOK_URL` to the webhook your n8n
   workflow exposes. When set, "Create post" POSTs `{ postId, topic, date, time, platforms,
   imageMode, imagePrompt, callbackUrl }` to it. Your n8n workflow should generate the
   per-platform text/hashtags and image, upload the image to Google Drive, then `POST` the
   result to `callbackUrl` (`/api/n8n/callback`) with header `x-callback-secret` set to
   `N8N_CALLBACK_SECRET` from `.env.local`:
   ```json
   {
     "postId": "...",
     "imageUrl": "https://drive.google.com/...",
     "content": {
       "linkedin": { "text": "...", "hashtags": ["automation"], "suggestedHashtags": ["n8n"] },
       "x": { "text": "...", "hashtags": [] }
     },
     "warnings": ["optional fact-check note"]
   }
   ```
   This flips the post to `waiting_approval` so it shows up on the Activity page. "Rewrite"
   re-triggers the same webhook. If `N8N_CREATE_POST_WEBHOOK_URL` is left blank, posts are
   still created and stored, just without generated content — fill content in by hand or
   wire the webhook later.

4. **Seed sample data** (optional, safe to run once):
   ```bash
   npm run seed
   ```
   Populates the four social accounts, AI credit settings, and a handful of sample posts so
   the dashboard isn't empty on first load.

5. **Run it**:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, sign in with `DASHBOARD_PASSWORD`.

## Notes on what's real vs. stubbed

- **Posts, accounts, brand voice, AI credit display** — all read/write MongoDB via
  `src/lib/db.ts` and `src/lib/actions.ts` (Next.js Server Actions).
- **Image uploads to Google Drive** — done by your n8n workflow, not this app. The
  dashboard just stores whatever `imageUrl` the callback sends. The "Upload mine" option on
  New Post and "Change image" on a post store the file directly on the post document as a
  data URL (capped at 5MB) since there's no Drive credential wired into the app itself.
- **Reconnect / Add account buttons** — flip the account's status to `connected` in Mongo.
  There's no real LinkedIn/X/Instagram/Facebook OAuth wired up (that needs app credentials
  per platform); swap `reconnectAccountAction` in `src/lib/actions.ts` for a real OAuth flow
  when you're ready.
- **Publishing** — this dashboard doesn't call social platform APIs directly. Approving a
  post sets its status to `scheduled`; the assumption is your n8n workflow has its own
  scheduler that watches for due `scheduled` posts and publishes them, then updates
  `results.<platform>` (ideally via the same `/api/n8n/callback` route, extended for that
  case, or directly in Mongo).
