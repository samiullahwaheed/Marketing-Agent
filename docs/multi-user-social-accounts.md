# Multi-user social accounts

**Status:** Planned, not started
**Goal:** Anyone can sign up, connect their own LinkedIn, Facebook and Instagram in Settings, and post to *their* accounts. One dashboard and one n8n agent serve every user.

---

## 1. What we want

Today the dashboard is single-company: the Facebook, Instagram and LinkedIn credentials are fixed inside n8n, and every post goes to those accounts. To sell the product, each customer must use their own accounts.

**The new user journey:**

1. A person opens the dashboard link and **signs up** (name, email, password). No invite link and no access code.
2. Before they can post, they see **"Connect your accounts first"**.
3. In **Settings → Accounts** they click **Connect Facebook** (which also brings in the Instagram account linked to their Page) and **Connect LinkedIn**.
4. They create posts, approve them, and the posts go to **their own** accounts.
5. If a connection expires, the dashboard shows **"Reconnect needed"** and one click fixes it.

**Rules:**

- A user only ever sees their own posts, calendar, settings, brand voice and connected accounts.
- Social tokens are never shown in the browser and are stored encrypted.
- n8n stays a single workflow and holds no customer credentials.

---

## 2. Where each credential lives

| What | Whose | Where | How many |
|---|---|---|---|
| Meta App ID / App Secret | Ours (the product owner's) | Vercel env vars | One set |
| LinkedIn Client ID / Client Secret | Ours | Vercel env vars | One set |
| Token encryption key | Ours | Vercel env var `TOKEN_ENCRYPTION_KEY` | One |
| Claude / OpenAI keys | Ours | n8n credentials (as today) | One set |
| Each user's Facebook Page, Instagram and LinkedIn tokens | **Each user's own** | Supabase table `social_connections`, encrypted | One row per user per platform |

**App credentials vs. user tokens:**

- **App credentials** identify *our app* to Facebook and LinkedIn ("this is the Marketing Agent app").
- **User tokens** are the permission a user gives our app ("Marketing Agent may post on Ali's Bakery Page").

We have one app and many user tokens.

---

## 3. How one agent knows whose accounts to use

The **dashboard** decides; **n8n** just follows instructions in the request.

```
User A clicks "Approve"
   │
   ▼
Dashboard: this post belongs to user A
   │
   ▼
Read user A's rows from social_connections → decrypt tokens (server only)
   │
   ▼
POST to the n8n publish webhook (HTTPS + x-api-key):
{
  post: {...},
  platforms: ["facebook", "instagram"],
  accounts: {
    facebook:  { pageId: "...",   token: "..." },
    instagram: { igUserId: "...", token: "..." },
    linkedin:  { personUrn: "...", token: "..." }
  }
}
   │
   ▼
n8n publishes with the tokens from the request (HTTP Request nodes)
   │
   ▼
Callback to the dashboard with per-platform results (same as today)
```

If user B approves a post a minute later, the same workflow receives user B's tokens instead. Nothing in n8n changes per customer.

---

## 4. How users' data is kept apart

Each table gets a `user_id`. Every query in the dashboard filters by the signed-in user.

| Table | Change |
|---|---|
| `users` | Already exists (signup). |
| `posts` | Add `user_id`. All lists, the calendar, approvals and counts filter by it. |
| `settings` | Change from one global row to one row per user (`user_id` as the key). |
| `accounts` | Replaced by `social_connections`. |
| `social_connections` (new) | `id`, `user_id`, `platform`, `account_id`, `account_name`, `access_token` (encrypted), `expires_at`, `status`, `created_at`. One row per user per platform. |

Supporting changes:

- **Storage:** image paths get the user id as a prefix (`posts/<userId>/<postId>/...`).
- **n8n callback:** it updates posts by id as today. The id is a random UUID, and the callback is protected by the shared secret.
- **Server actions:** every action that loads a post checks that `post.user_id` is the signed-in user before doing anything.

---

## 5. Implementation steps (developer work)

### Step 1: Open signup and per-user data

- Remove the team access code from the signup form, the action and the env var.
- Add `user_id` to `posts`, and make `settings` per user.
- Filter every read and write in `src/lib/db.ts` and `src/lib/actions.ts` by the signed-in user.
- Migration: assign the existing posts to the first account (the owner's).
- **Done when:** two test users each see only their own posts and settings.

### Step 2: `social_connections` and encryption

- Create the table (SQL added to `supabase/schema.sql`).
- Add `src/lib/crypto.ts` with AES-256-GCM encrypt and decrypt using `TOKEN_ENCRYPTION_KEY`.
- Add helpers to save, read and delete a connection, and to mark one expired.
- **Done when:** a token can be saved and read back, and the database only ever holds ciphertext.

### Step 3: Connect Facebook + Instagram (OAuth)

- Route `/api/connect/facebook` redirects to the Facebook login with our permissions and a signed `state` value (CSRF protection).
- Route `/api/connect/facebook/callback` does the following:
  1. Exchanges the code for a user token.
  2. Upgrades it to a long-lived token.
  3. Lists the user's Pages; if there is more than one, the user picks a Page on a small screen.
  4. Saves the **Page token** (non-expiring) and the Page id and name.
  5. Reads the Page's linked Instagram Business account and saves it too.
- **Done when:** a tester connects a Page and Settings shows the Page and Instagram names.

### Step 4: Connect LinkedIn (OAuth)

- Routes `/api/connect/linkedin` and `/api/connect/linkedin/callback`.
- Scopes: `openid profile w_member_social`.
- Save the token, the person URN and the expiry (about 60 days).
- **Done when:** Settings shows the LinkedIn name and the expiry date.

### Step 5: Settings → Accounts screen

- One card per platform: logo, connected account name, status (Connected / Expires soon / Reconnect needed), and Connect / Disconnect / Reconnect buttons.
- Disconnect deletes the row. Reconnect runs the same OAuth again.
- **Done when:** all three states display correctly.

### Step 6: Gate posting on connected accounts

- New post only offers platforms the user has connected.
- With no connections, show a setup screen: "Connect at least one account to start" with a link to Settings.
- Approve is blocked, with a clear message, if a chosen platform got disconnected or expired after the draft was made.

### Step 7: Send tokens to n8n on publish

- In `publishAt()` (`src/lib/actions.ts`), load the post owner's connections and add an `accounts` object to the publish payload (see section 3).
- Update the payload type in `src/lib/n8n.ts`.

### Step 8: n8n workflow changes

- Replace the Facebook, Instagram and LinkedIn nodes with **HTTP Request** nodes that read the token and ids from the request body:
  - **Facebook:** `POST /{pageId}/photos` (or `/feed`) with `access_token` from the payload.
  - **Instagram:** `POST /{igUserId}/media`, wait, `POST /{igUserId}/media_publish`, then get the permalink.
  - **LinkedIn:** register the image upload, upload the image, then `POST /rest/posts` with the `Bearer` token from the payload.
- Remove the hard-coded `ACCOUNTS` block and the old Facebook and LinkedIn credentials.
- On a token error (Facebook code 190, LinkedIn 401), report `reconnect_needed` so the dashboard can flag the connection.

### Step 9: Expiry handling

- When n8n reports `reconnect_needed`, mark the connection expired.
- Show a banner on Home and on the post: "Reconnect LinkedIn to keep posting".
- Show "Expires soon" from 7 days before `expires_at`.

### Step 10: Test end to end

- Two tester accounts, each with their own Page and LinkedIn.
- Check that their posts never cross, that disconnect works, and that an expired token shows Reconnect.

---

## 6. What the product owner needs to do

These are outside the code. Each one is needed because Facebook and LinkedIn only let approved, registered apps act on people's accounts.

### A. Add the redirect URLs to the Meta app (about 2 minutes, needed for Step 3)

- **Why:** after a user clicks "Allow", Facebook only sends them back to URLs listed in the app. This stops attackers from stealing tokens with fake return addresses.
- **Where:** developers.facebook.com → your app → Facebook Login → Settings → **Valid OAuth Redirect URIs**.
- **Add:**
  - `https://marketing-agent-azure.vercel.app/api/connect/facebook/callback`
  - `http://localhost:3000/api/connect/facebook/callback` (for local testing)
- **Also:** put the App ID and App Secret in Vercel env as `META_APP_ID` and `META_APP_SECRET`.

### B. Create a LinkedIn developer app (15–20 minutes, needed for Step 4)

- **Why:** today LinkedIn goes through n8n's shared connection, which caused the "too many requests" errors. Our own app gives us our own Client ID and Secret, our own rate limits, and shows our app name when users connect.
- **Where:** linkedin.com/developers → Create app. A LinkedIn **Company Page** is required.
- **Products to add:** "Sign In with LinkedIn using OpenID Connect" and "Share on LinkedIn" (both are approved instantly).
- **Redirect URLs:** `.../api/connect/linkedin/callback` (production and localhost).
- **Env:** `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`.
- **Note:** this allows posting to a user's **personal profile**. Posting to **company pages** needs LinkedIn's "Community Management API" approval, which is a separate and harder application for later.

### C. Generate the encryption key (1 minute, needed for Step 2)

- Run `openssl rand -base64 32`, or ask the developer to generate one.
- Set it as `TOKEN_ENCRYPTION_KEY` in `.env.local` and in Vercel.
- **Never change or lose it:** every saved token becomes unreadable without it.

### D. Meta App Review + Business Verification (days to weeks, needed before selling)

- **Why:** the Meta app is in **Development mode**. Only people added as Admin, Developer or Tester in the app can connect. Real customers get an error until Meta approves the app.
- **Permissions to request:** `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management`.
- **Meta will ask for:**
  - A screen recording showing connect → create post → approve → post appears on the Page.
  - A Privacy Policy URL and a Terms URL.
  - A data deletion instructions URL (or callback).
  - **Business Verification:** company documents.
- **Until approved:** add testers in the Meta app (App roles → Roles) so development and demos still work.

### E. Later, before selling

- Privacy Policy and Terms pages on the site (also needed for D).
- Decide on AI usage limits or billing per user. Today all users share the same Claude and OpenAI credits.

---

## 7. Order of work

| # | Who | Task | Blocks |
|---|---|---|---|
| 1 | Dev | Open signup + per-user data | — |
| 2 | Owner | Encryption key (C) | Step 2 |
| 3 | Dev | `social_connections` + encryption | — |
| 4 | Owner | Meta redirect URLs + env (A) | Step 3 |
| 5 | Dev | Connect Facebook + Instagram | — |
| 6 | Owner | LinkedIn app (B) | Step 4 |
| 7 | Dev | Connect LinkedIn, Settings screen, posting gate | — |
| 8 | Dev | Tokens in the payload + n8n HTTP nodes | — |
| 9 | Dev | Expiry handling + end-to-end test | — |
| 10 | Owner | **Start Meta App Review early (D)**, in parallel with everything above | Selling |

---

## 8. Risks and decisions

- **Meta review can be rejected.** Fix what they ask for and resubmit. Testers keep working meanwhile.
- **LinkedIn tokens last about 60 days** and cannot be refreshed without partner approval, so users must reconnect roughly every two months. The reconnect banner covers this.
- **Shared AI cost:** one heavy user can use up the credits for everyone. Per-user limits are needed before launch.
- **Alternative:** a posting service such as Ayrshare handles account connections and platform approvals for us, at a monthly cost per customer and with a dependency on them. It is worth considering if Meta review takes too long.
