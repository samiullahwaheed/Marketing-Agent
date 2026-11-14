# Marketing agent dashboard

A Next.js dashboard for the n8n marketing agent: create a post from a topic, review what
the agent generated per platform, approve/reject/rewrite it, and track what's published,
scheduled, or failed. Posts, accounts and settings are stored in Supabase Postgres; images
live in Supabase Storage.

## Setup

1. **Supabase** — create a project, then in the SQL editor run [`supabase/schema.sql`](supabase/schema.sql).
   It creates the `posts`, `accounts` and `settings` tables, the public `post-images`
   bucket, and the `apply_publish_results` function. Add to `.env.local`
   (Project Settings → API):
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   ```
   The service role key is only used on the server. Never expose it to the browser.

2. **Dashboard password** — `.env.local` has `DASHBOARD_PASSWORD` (change it anytime; it's
   the only login credential, checked by `src/app/login`).

3. **n8n integration** — import [`agent/n8n_marketing_agent.json`](agent/n8n_marketing_agent.json)
   and follow the *Setup* sticky note inside it. Dashboard env vars:
   ```
   N8N_CREATE_POST_WEBHOOK_URL=https://marketing-agent1.app.n8n.cloud/webhook/social-post-create
   N8N_PUBLISH_POST_WEBHOOK_URL=https://marketing-agent1.app.n8n.cloud/webhook/social-post-publish
   APP_BASE_URL=https://<your-public-dashboard-host>
   N8N_WEBHOOK_API_KEY=<shared secret>
   N8N_CALLBACK_SECRET=<same shared secret>
   ```
   `APP_BASE_URL` must be reachable by n8n so it can call `/api/n8n/callback`. The workflow
   uses one Header Auth credential (`x-api-key`) for both directions, so set both secrets to
   the same value (the callback accepts `x-api-key` or `x-callback-secret`).

   **Create / rewrite** (`social-post-create`) receives `postId`, `topic`, `date`, `time`,
   `scheduledAt` (ISO, or `null` for *Post now*), `postNow`, `platforms`, `imageMode`,
   `imageUrl` (existing public image), `imagePrompt`, `imageUpload` (a signed Supabase upload
   URL for the AI image), `audience`, `language`, `brandVoice`, `bannedWords` and
   `callbackUrl`. Rewrites add `rewrite`, `rewriteRequest` (instructions, options, platforms,
   keepHashtags) and `currentContent`. Claude writes each platform's post and the image
   prompt; OpenAI `gpt-image-2` (n8n free credits) renders the image, converted to JPEG, which n8n PUTs to `imageUpload.signedUrl`.
   The webhook answers `202` once the request is valid, or `400` with the reason.

   Generation callback:
   ```json
   {
     "postId": "...",
     "imageUrl": "https://<project-ref>.supabase.co/storage/v1/object/public/post-images/posts/.../ai-123.jpg",
     "content": {
       "linkedin": { "text": "...", "hashtags": ["automation"], "suggestedHashtags": ["n8n"] }
     },
     "warnings": ["optional fact-check note"],
     "status": "waiting_approval"
   }
   ```
   (`"status": "failed"` with `"error"` if Claude could not write any version.)

   **Publish** (`social-post-publish`) is called on approve and retry with `scheduledAt` set
   to the scheduled time, or to *now* for *Post now* posts. n8n waits if the time is in the
   future, publishes each platform, and reports every result as
   `{ "postId": "...", "platformResults": { "linkedin": { "status": "published", "url": "..." } } }`.

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

- **Posts, accounts, brand voice, AI credit display** — read/write Supabase via
  `src/lib/db.ts` and `src/lib/actions.ts` (Next.js Server Actions).
- **Images** — "Upload mine" and "Change image" upload the file to the `post-images` bucket
  from the server; AI images are uploaded there by n8n. Instagram only accepts JPEG.
- **Post now vs. schedule** — leaving the schedule off publishes the post as soon as it is
  approved.
- **Reconnect / Add account buttons** — flip the account's status to `connected` in the
  database. There's no real LinkedIn/Instagram/Facebook OAuth in the app; those
  credentials live in n8n.
- **Strategic Insights, Plan, and Audiences** — intentionally remain prototype screens using
  illustrative data; they are not inputs to or outputs from the n8n workflow.

