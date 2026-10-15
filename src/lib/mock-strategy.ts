// Illustrative data for the Strategy pages (Insights / Plan / Audiences).
// These pages have no real analytics backend yet, so this is sample content
// to preview the screens — not tied to real posts or dates.
import type { Platform } from "./types";

export interface Stat {
  label: string;
  value: string;
  note: string;
  noteTone?: "success" | "warning" | "error" | "muted";
  /** Green-tinted card, used for the headline number. */
  highlight?: boolean;
}

export interface Insights {
  stats: Stat[];
  weekNote: string;
  weeks: { label: string; views: number; partial?: boolean }[];
  platforms: {
    platform: Platform;
    connected: boolean;
    posts?: number;
    views?: number;
    interactions?: number;
    engagement?: string;
    weak?: boolean;
  }[];
  topics: { name: string; avg: number; posts: number; color: string }[];
  tip: string;
  ranges: string[];
}

export interface PlanAction {
  id: string;
  kind: string;
  tone: "success" | "error" | "info" | "warning";
  title: string;
  text: string;
  buttons: { label: string; to?: string; variant?: "primary" | "secondary" | "ghost"; doneLabel?: string }[];
}

export interface Plan {
  week: { label: string; title: string; text: string; done: number; total: number };
  basis: string;
  actions: PlanAction[];
  mix: { topic: string; current: number; target: number; color: string }[];
  heatmap: { slots: string[]; rows: { day: string; values: number[] }[] };
  experiment: { title: string; text: string; variants: { label: string; value: number }[] };
}

export interface Audience {
  id: string;
  name: string;
  location: string;
  wants: string;
  tags: string[];
  status: "default" | "suggested" | "saved";
  reason?: string;
}

export interface AudiencesData {
  audiences: Audience[];
  banner: { title: string; text: string; audience: Audience };
  followers: {
    total: string;
    growth: string;
    locations: { label: string; pct: number; color: string }[];
    industries: { label: string; pct: number; color: string }[];
  };
}

export const insights: Insights = {
  stats: [
    { label: "Posts published", value: "12", note: "▲ 3 more than previous 30 days", noteTone: "success" },
    { label: "Views", value: "6,300", note: "▲ 18%", noteTone: "success" },
    { label: "Interactions", value: "315", note: "▲ 9% · reactions + comments", noteTone: "success" },
    { label: "Engagement rate", value: "5.0%", note: "Interactions ÷ views" },
  ],
  weekNote: "This week so far: Mon–Wed",
  weeks: [
    { label: "15 Sep", views: 1100 },
    { label: "22 Sep", views: 1350 },
    { label: "29 Sep", views: 1250 },
    { label: "6 Oct", views: 1650 },
    { label: "13 Oct", views: 950, partial: true },
  ],
  platforms: [
    { platform: "linkedin", connected: true, posts: 7, views: 4200, interactions: 231, engagement: "5.5%" },
    { platform: "instagram", connected: true, posts: 4, views: 1700, interactions: 76, engagement: "4.5%" },
    { platform: "x", connected: true, posts: 1, views: 400, interactions: 8, engagement: "2.0%", weak: true },
    { platform: "facebook", connected: false },
  ],
  topics: [
    { name: "Invoice automation", avg: 38, posts: 4, color: "#1F5C46" },
    { name: "Client onboarding", avg: 29, posts: 3, color: "#5E9A78" },
    { name: "Tool comparisons", avg: 15, posts: 5, color: "#E8A33D" },
  ],
  tip: "You post tool comparisons the most, but they get the least interaction.",
  ranges: ["Last 30 days", "Last 90 days", "This year"],
};

export const plan: Plan = {
  week: {
    label: "This week",
    title: "1 of 3 posts done",
    text: "Two more keep you on your usual rhythm. The calendar has a gap this week.",
    done: 1,
    total: 3,
  },
  basis: "Based on your last 30 days · 12 posts",
  actions: [
    {
      id: "more-invoicing",
      kind: "Do more of this",
      tone: "success",
      title: "Invoice automation gets 2.5× the interactions of tool comparisons",
      text: "But it's only 4 of your 12 posts. Swap a couple of tool-comparison slots for invoicing stories.",
      buttons: [{ label: "Draft 3 invoicing posts", to: "/new-post", variant: "primary" }],
    },
    {
      id: "rethink-x",
      kind: "Rethink this",
      tone: "error",
      title: "X isn't working for you yet",
      text: "1 post, 8 interactions (2% engagement vs 5.5% on LinkedIn). Try short, question-led posts, or pause X and spend the time on LinkedIn.",
      buttons: [
        { label: "Try X-style posts", doneLabel: "X-style posts on" },
        { label: "Pause X", variant: "ghost", doneLabel: "X paused" },
      ],
    },
    {
      id: "timing",
      kind: "Timing",
      tone: "info",
      title: "Tuesday and Wednesday mornings work best",
      text: "Only 12 posts so far, so it's a hint, not a rule. We'll keep checking as you post more.",
      buttons: [{ label: "Use for new posts", doneLabel: "Used for new posts" }],
    },
    {
      id: "late-payments",
      kind: "Try this",
      tone: "warning",
      title: "Talk about late payments",
      text: "Your audience brings up chasing unpaid invoices in comments. Test “invoice reminders” as a keyword in your next post.",
      buttons: [{ label: "Add to next post", to: "/new-post" }],
    },
  ],
  mix: [
    { topic: "Invoice automation", current: 33, target: 50, color: "#1F5C46" },
    { topic: "Client onboarding", current: 25, target: 30, color: "#5E9A78" },
    { topic: "Tool comparisons", current: 42, target: 20, color: "#E8A33D" },
  ],
  heatmap: {
    slots: ["8–11", "11–2", "2–5", "5–9 pm"],
    rows: [
      { day: "Mon", values: [2, 1, 1, 0] },
      { day: "Tue", values: [4, 3, 1, 1] },
      { day: "Wed", values: [4, 2, 2, 0] },
      { day: "Thu", values: [2, 2, 1, 1] },
      { day: "Fri", values: [1, 1, 0, 0] },
      { day: "Sat", values: [0, 0, 0, 1] },
      { day: "Sun", values: [1, 0, 0, 1] },
    ],
  },
  experiment: {
    title: "Number hooks vs question hooks",
    text: "3 posts each so far. Number hooks are ahead by 22%, but it's too early to call.",
    variants: [
      { label: "“11 hours…”", value: 100 },
      { label: "“Ever wondered…?”", value: 82 },
    ],
  },
};

export const audiences: AudiencesData = {
  audiences: [
    {
      id: "small-business-owners",
      name: "Small business owners",
      location: "Pakistan · English & Urdu",
      wants: "less repetitive admin work",
      tags: ["Invoicing", "Automation"],
      status: "default",
    },
    {
      id: "finance-ops",
      name: "Finance & operations teams",
      location: "Pakistan · English",
      wants: "faster invoices and reminders",
      tags: [],
      status: "suggested",
      reason: "Suggested because 17% of your followers work in finance.",
    },
    {
      id: "freelancers",
      name: "Freelancers & agencies",
      location: "Pakistan · English",
      wants: "simpler client onboarding",
      tags: ["Client management", "Productivity"],
      status: "saved",
    },
  ],
  banner: {
    title: "40% of your followers are in the UK and US,",
    text: "but every audience above is in Pakistan. Want an audience for them too, or keep the focus at home?",
    audience: {
      id: "uk-us-owners",
      name: "UK & US business owners",
      location: "United Kingdom, United States · English",
      wants: "less repetitive admin work",
      tags: ["Invoicing", "Automation"],
      status: "saved",
    },
  },
  followers: {
    total: "1,280",
    growth: "+84 in the last 30 days",
    locations: [
      { label: "Pakistan", pct: 48, color: "#1F5C46" },
      { label: "United Kingdom", pct: 22, color: "#E8A33D" },
      { label: "United States", pct: 18, color: "#E8A33D" },
      { label: "Other", pct: 12, color: "#9AA59E" },
    ],
    industries: [
      { label: "Prof. services", pct: 35, color: "#1F5C46" },
      { label: "Technology", pct: 28, color: "#1F5C46" },
      { label: "Finance", pct: 17, color: "#1F5C46" },
      { label: "Other", pct: 20, color: "#9AA59E" },
    ],
  },
};
