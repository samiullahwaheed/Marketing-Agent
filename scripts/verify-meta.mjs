// Checks that the Meta token used by n8n's "Facebook Graph account" can publish to the
// Facebook Page and its Instagram account. Read-only: it never posts anything.
// Usage: put META_ACCESS_TOKEN (and FACEBOOK_PAGE_ID) in .env.local, then `npm run verify:meta`.
const API = "https://graph.facebook.com/v23.0";
const token = process.env.META_ACCESS_TOKEN?.trim();
const pageId = process.env.FACEBOOK_PAGE_ID?.trim() || "1458689310655772";

const NEEDED = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish"];

if (!token) {
  console.error("Set META_ACCESS_TOKEN in .env.local to the same token as n8n's Facebook Graph credential.");
  process.exit(1);
}

let failures = 0;
const ok = (msg) => console.log(`  OK    ${msg}`);
const bad = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const info = (msg) => console.log(`        ${msg}`);

async function graph(path, params = {}) {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries({ ...params, access_token: token })) url.searchParams.set(k, v);
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  return body.error ? { error: `${body.error.message} (code ${body.error.code}${body.error.error_subcode ? "/" + body.error.error_subcode : ""})` } : { data: body };
}

console.log("\n1. Token");
const dbg = await graph("debug_token", { input_token: token });
const t = dbg.data?.data;
if (dbg.error || !t) {
  bad(`Meta could not read the token: ${dbg.error ?? "no data"}`);
} else {
  if (t.is_valid) ok("token is valid");
  else bad(`token is NOT valid${t.error?.message ? ": " + t.error.message : ""}`);
  info(`type: ${t.type}  (must be PAGE for Facebook posting)`);
  if (t.type === "PAGE") ok("it is a Page token");
  else bad("it is not a Page token: generate a Page access token for your Page");
  info(`expires: ${t.expires_at ? (t.expires_at === 0 ? "never" : new Date(t.expires_at * 1000).toISOString()) : "never"}`);
  if (t.expires_at && t.expires_at * 1000 < Date.now() + 2 * 864e5) bad("token expires within 2 days: use a long-lived Page token");
  const scopes = t.scopes ?? [];
  for (const s of NEEDED) {
    if (scopes.includes(s)) ok(`permission ${s}`);
    else bad(`missing permission ${s}`);
  }
  if (t.profile_id) info(`token belongs to Page/profile id ${t.profile_id}`);
}

console.log("\n2. Facebook Page");
const me = await graph("me", { fields: "id,name" });
if (me.error) bad(`/me failed: ${me.error}`);
else {
  info(`token acts as: ${me.data.name} (${me.data.id})`);
  if (me.data.id === pageId) ok(`token belongs to Page ${pageId}`);
  else bad(`token belongs to ${me.data.id}, but the workflow posts to Page ${pageId}`);
}
const page = await graph(pageId, { fields: "id,name,instagram_business_account{id,username}" });
if (page.error) bad(`cannot read Page ${pageId}: ${page.error}`);
else {
  ok(`Page found: ${page.data.name}`);
  const ig = page.data.instagram_business_account;
  if (!ig) bad("no Instagram Business/Creator account is linked to this Page");
  else {
    ok(`linked Instagram: @${ig.username}`);
    console.log(`\n  >> Put this in n8n "Normalize Publish Request": instagramAccountId: '${ig.id}'`);

    console.log("\n3. Instagram publishing");
    const limit = await graph(`${ig.id}/content_publishing_limit`, { fields: "quota_usage,config" });
    if (limit.error) bad(`cannot check publishing permission: ${limit.error}`);
    else ok(`can publish to Instagram (used ${limit.data.data?.[0]?.quota_usage ?? 0} of ${limit.data.data?.[0]?.config?.quota_total ?? "?"} posts in 24h)`);
  }
}

console.log(failures ? `\n${failures} problem(s) found. Fix them, update the n8n credential, and run again.\n` : "\nAll checks passed.\n");
process.exit(failures ? 1 : 0);
