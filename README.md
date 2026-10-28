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

3. **n8n integration** — the dashboard defaults to these n8n webhooks; set the environment
   variables to override them:
   ```
   N8N_CREATE_POST_WEBHOOK_URL=https://marketing-agent1.app.n8n.cloud/webhook/social-post-create
   N8N_PUBLISH_POST_WEBHOOK_URL=https://marketing-agent1.app.n8n.cloud/webhook/social-post-publish
   APP_BASE_URL=https://<your-public-dashboard-host>
   N8N_WEBHOOK_API_KEY=<shared-webhook-key>
   N8N_CALLBACK_SECRET=<shared-callback-secret>
   ```
   `APP_BASE_URL` must be reachable by n8n so it can call the dashboard callback.
   The workflow's create webhook receives `postId`, `topic`, `date`, `time`, `scheduledAt`
   (an ISO timestamp from the user's browser), `platforms`, `imageMode`, `imageUrl`,
   `imagePrompt`, `audience`, `goal`, `language`, `brandVoice`, and `callbackUrl`. It returns
   generated platform content to `callbackUrl` (`/api/n8n/callback`) with header
   `x-callback-secret` set to `N8N_CALLBACK_SECRET`. Rewrites use the same create webhook,
   with `rewrite` and `currentContent` included.

   When a post is approved or retried, the dashboard POSTs its saved post data and
   `callbackUrl` to the publish webhook. n8n waits until `scheduledAt`, publishes each
   platform, and reports each result to the callback route using `platformResults`.

   Both webhook nodes in the exported workflow use header authentication. Configure their
   n8n credential to accept `x-api-key` and set the same value in `N8N_WEBHOOK_API_KEY`.
   Configure the workflow's callback HTTP credentials to send `x-callback-secret` with the
   value of `N8N_CALLBACK_SECRET`. Keep these secrets only in environment variables and n8n
   credentials.

   The export is inactive until you import and activate it. Before activation, replace its
   content-generation, image-generation, Drive-upload, and per-platform publish adapter
   placeholder URLs with your real service endpoints. The supplied webhook URLs alone are
   not credentials for those external services.
   The callback body for generated content is:
   ```json
   {
     "postId": "...",
     "imageUrl": "https://drive.google.com/...",
     "content": {
       "linkedin": { "text": "...", "hashtags": ["automation"], "suggestedHashtags": ["n8n"] },
       "x": { "text": "...", "hashtags": [] }
     },
     "warnings": ["optional fact-check note"],
     "status": "waiting_approval"
   }
   ```
   This moves the post to `waiting_approval` in the dashboard.

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
- **Strategic Insights, Plan, and Audiences** — intentionally remain prototype screens using
  illustrative data; they are not inputs to or outputs from the n8n workflow.
- **Publishing** — the dashboard sends approved posts to the n8n publish webhook. Actual
  social publishing still depends on configuring valid platform adapter endpoints and
  credentials in the workflow.
