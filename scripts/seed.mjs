// Seeds Supabase with sample data so the dashboard looks populated on first run.
// Usage: npm run seed   (run supabase/schema.sql in the SQL editor first)
// Safe to re-run: only inserts posts if the "posts" table is currently empty.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function check({ error }, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function daysFromNow(days, hh = 9, mm = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const date = d.toISOString().slice(0, 10);
  const time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  return { date, time };
}

function isoAt(days, hh, mm) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function toRow(doc) {
  return {
    topic: doc.topic,
    post_date: doc.date,
    post_time: doc.time,
    scheduled_at: new Date(`${doc.date}T${doc.time}:00`).toISOString(),
    post_now: false,
    platforms: doc.platforms,
    image_mode: doc.imageMode,
    image_prompt: doc.imagePrompt ?? null,
    content: doc.content,
    warnings: doc.warnings,
    status: doc.status,
    attempts: doc.attempts,
    max_attempts: doc.maxAttempts,
    last_error: doc.lastError ?? null,
    last_attempt_at: doc.lastAttemptAt ?? null,
    results: doc.results ?? {},
  };
}

async function main() {
  const { count: accountCount } = await supabase.from("accounts").select("platform", { count: "exact", head: true });
  if (!accountCount) {
    check(
      await supabase.from("accounts").upsert([
        { platform: "linkedin", label: "LinkedIn", status: "connected" },
        { platform: "instagram", label: "Instagram", status: "connected" },
        { platform: "facebook", label: "Facebook", status: "connected" },
      ]),
      "Seeding accounts"
    );
    console.log("Seeded accounts");
  }

  check(
    await supabase
      .from("settings")
      .upsert({ id: "global", ai_credits_percent: 12, ai_credits_posts_left: 6 }, { onConflict: "id", ignoreDuplicates: true }),
    "Seeding settings"
  );

  const { count: postCount, error } = await supabase.from("posts").select("id", { count: "exact", head: true });
  if (error) throw new Error(`Counting posts: ${error.message}`);
  if (postCount) {
    console.log("posts table already has data — skipping post seed.");
    return;
  }

  const manualInvoicing = daysFromNow(10);
  const n8nVsZapier = daysFromNow(8);
  const ghostInvoices = daysFromNow(11);
  const threeAutomations = daysFromNow(15);
  const onboardingDue = daysFromNow(-3);
  const fiveN8nMistakes = daysFromNow(-3);
  const whyILeftZapier = daysFromNow(-6);

  const docs = [
    {
      topic: "n8n vs Zapier",
      ...n8nVsZapier,
      platforms: ["linkedin"],
      imageMode: "ai",
      imagePrompt: "Flat illustration, two robots shaking hands, muted colours",
      content: {},
      warnings: [],
      status: "scheduled",
      attempts: 0,
      maxAttempts: 3,
      results: { linkedin: { status: "scheduled" } },
    },
    {
      topic: "Why clients ghost invoices",
      ...ghostInvoices,
      platforms: ["linkedin", "facebook"],
      imageMode: "ai",
      imagePrompt: "Flat illustration, an unpaid invoice on a desk",
      content: {},
      warnings: [],
      status: "scheduled",
      attempts: 0,
      maxAttempts: 3,
      results: { linkedin: { status: "scheduled" }, facebook: { status: "scheduled" } },
    },
    {
      topic: "Three automations to start with",
      ...threeAutomations,
      platforms: ["linkedin"],
      imageMode: "ai",
      imagePrompt: "Flat illustration, three gears turning, muted colours",
      content: {},
      warnings: [],
      status: "scheduled",
      attempts: 0,
      maxAttempts: 3,
      results: { linkedin: { status: "scheduled" } },
    },
    {
      topic: "Automating client onboarding",
      ...onboardingDue,
      platforms: ["linkedin", "instagram"],
      imageMode: "ai",
      imagePrompt: "Flat illustration, a welcome form filling itself in",
      content: {
        linkedin: {
          text: "Onboarding a new client used to take me four emails and a spreadsheet. Now it takes one form...",
          hashtags: ["automation", "n8n"],
        },
        instagram: {
          text: "Onboarding a new client used to take four emails and a spreadsheet. Now it's one form.",
          hashtags: ["automation"],
        },
      },
      warnings: [],
      status: "failed",
      attempts: 2,
      maxAttempts: 3,
      lastError:
        "The post was written and the image was made. Instagram refused it because the account needs reconnecting.",
      lastAttemptAt: isoAt(-3, 9, 32),
      results: {
        linkedin: {
          status: "published",
          url: "https://www.linkedin.com/feed/",
          publishedAt: isoAt(-3, 9, 0),
        },
        instagram: { status: "failed", error: "Login expired" },
      },
    },
    {
      topic: "Five n8n mistakes",
      ...fiveN8nMistakes,
      platforms: ["linkedin"],
      imageMode: "ai",
      imagePrompt: "Flat illustration, a checklist with five items",
      content: {
        linkedin: {
          text: "Most people set up n8n wrong on day one. Here are the five mistakes I made so you don't have to...",
          hashtags: ["n8n", "automation"],
        },
      },
      warnings: [],
      status: "published",
      attempts: 1,
      maxAttempts: 3,
      results: {
        linkedin: {
          status: "published",
          url: "https://www.linkedin.com/feed/",
          publishedAt: isoAt(-3, 9, 0),
          views: 84,
          reactions: 7,
          comments: 2,
        },
      },
    },
    {
      topic: "Why I left Zapier",
      ...whyILeftZapier,
      platforms: ["linkedin"],
      imageMode: "ai",
      imagePrompt: "Flat illustration, a person walking away from a maze",
      content: {
        linkedin: {
          text: "I moved every workflow off Zapier this year. Here's what changed, and what I'd tell you before you do the same...",
          hashtags: ["automation", "n8n"],
        },
      },
      warnings: [],
      status: "published",
      attempts: 1,
      maxAttempts: 3,
      results: {
        linkedin: {
          status: "published",
          url: "https://www.linkedin.com/feed/",
          publishedAt: isoAt(-6, 9, 0),
          views: 211,
          reactions: 15,
          comments: 3,
        },
      },
    },
    {
      topic: "Manual invoicing costs",
      ...manualInvoicing,
      platforms: ["linkedin", "instagram", "facebook"],
      imageMode: "ai",
      imagePrompt: "Flat illustration, muted colours, a desk with papers",
      content: {
        linkedin: {
          text: "A client called me last month. His accountant quit.\n\nTurns out she was spending 11 hours a week on invoices. Copying numbers from emails into a spreadsheet. Then into the accounting software. Then chasing people who didn't pay.\n\nEleven hours. Every week. For copy-paste.\n\nWe rebuilt it in two days. Invoice arrives, data gets pulled out, row added, reminder sent on day 7 if nobody paid.\n\nWhat's the dumbest manual task still eating your week?",
          hashtags: ["automation", "n8n", "smallbusiness"],
          suggestedHashtags: ["invoicing", "nocode", "workflow", "bookkeeping"],
        },
        instagram: {
          text: "Eleven hours a week, gone to copy-paste.\n\nOne client was moving invoice numbers from email to spreadsheet to accounting software by hand. Then chasing everyone who hadn't paid.\n\nWe rebuilt the whole thing in two days. Now the invoice arrives and everything happens on its own.\n\nWhat's the dumbest manual job still eating your week?",
          hashtags: ["automation", "n8n", "smallbusiness", "invoicing", "productivity"],
          suggestedHashtags: ["nocode", "workflow", "bookkeeping", "freelance", "accounting"],
        },
        facebook: {
          text: "A client of ours called last month. Her accountant had just quit.\n\nTurns out she was spending 11 hours a week on invoices — copying numbers from emails into a spreadsheet, then into the accounting software, then chasing down the people who hadn't paid.\n\nWe rebuilt it in two days. Now the invoice arrives, the data gets pulled out automatically, and a reminder goes out on day 7 if nobody's paid.\n\nWhat's the most tedious manual task still eating up your week?",
          hashtags: ["automation", "smallbusiness", "invoicing"],
          suggestedHashtags: ["nocode", "workflow", "bookkeeping"],
        },
      },
      warnings: ['"11 hours" has no source — check before posting'],
      status: "waiting_approval",
      attempts: 0,
      maxAttempts: 3,
    },
  ];

  check(await supabase.from("posts").insert(docs.map(toRow)), "Seeding posts");
  console.log(`Seeded ${docs.length} posts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
