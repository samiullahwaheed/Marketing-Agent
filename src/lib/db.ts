import { Collection, ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import type {
  AccountDoc,
  Account,
  PostDoc,
  Post,
  SettingsDoc,
} from "./types";

export async function postsCollection(): Promise<Collection<PostDoc>> {
  const db = await getDb();
  return db.collection<PostDoc>("posts");
}

export async function accountsCollection(): Promise<Collection<AccountDoc>> {
  const db = await getDb();
  return db.collection<AccountDoc>("accounts");
}

export async function settingsCollection(): Promise<Collection<SettingsDoc>> {
  const db = await getDb();
  return db.collection<SettingsDoc>("settings");
}

export function serializePost(doc: PostDoc): Post {
  const { _id, createdAt, updatedAt, ...rest } = doc;
  return {
    ...rest,
    id: String(_id),
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(updatedAt).toISOString(),
  };
}

export function serializeAccount(doc: AccountDoc): Account {
  const { _id, updatedAt, ...rest } = doc;
  return {
    ...rest,
    id: String(_id),
    updatedAt: new Date(updatedAt).toISOString(),
  };
}

const DEFAULT_ACCOUNTS: Array<Pick<AccountDoc, "platform" | "label" | "status">> = [
  { platform: "linkedin", label: "LinkedIn", status: "connected" },
  { platform: "x", label: "X", status: "reconnect" },
  { platform: "instagram", label: "Instagram", status: "connected" },
  { platform: "facebook", label: "Facebook", status: "not_connected" },
];

export async function getAccounts(): Promise<Account[]> {
  const col = await accountsCollection();
  const count = await col.countDocuments();
  if (count === 0) {
    const now = new Date();
    await col.insertMany(
      DEFAULT_ACCOUNTS.map((a) => ({ ...a, updatedAt: now }))
    );
  }
  const order = ["linkedin", "x", "instagram", "facebook"];
  const docs = await col.find().toArray();
  docs.sort((a, b) => order.indexOf(a.platform) - order.indexOf(b.platform));
  return docs.map(serializeAccount);
}

export async function getSettings(): Promise<SettingsDoc> {
  const col = await settingsCollection();
  let doc = await col.findOne({ _id: "global" });
  if (!doc) {
    doc = {
      _id: "global",
      aiCreditsPercent: 100,
      aiCreditsPostsLeft: 50,
      brandVoice: {
        tone: "",
        keywords: "",
        sampleText: "",
        doNots: "",
      },
    };
    await col.insertOne(doc);
  }
  return doc;
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await postsCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return serializePost(doc);
}

export interface HomeData {
  publishedThisMonth: number;
  waitingCount: number;
  failedCount: number;
  scheduledCount: number;
  comingUp: Post[];
  recent: Post[];
}

export async function getHomeData(): Promise<HomeData> {
  const col = await postsCollection();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    publishedThisMonth,
    waitingCount,
    failedCount,
    scheduledCount,
    comingUpDocs,
    recentDocs,
  ] = await Promise.all([
    col.countDocuments({ status: "published", updatedAt: { $gte: monthStart } }),
    col.countDocuments({ status: "waiting_approval" }),
    col.countDocuments({ status: "failed" }),
    col.countDocuments({ status: "scheduled" }),
    col
      .find({ status: "scheduled" })
      .sort({ date: 1, time: 1 })
      .limit(3)
      .toArray(),
    col
      .find({ status: { $in: ["published", "failed"] } })
      .sort({ updatedAt: -1 })
      .limit(3)
      .toArray(),
  ]);

  return {
    publishedThisMonth,
    waitingCount,
    failedCount,
    scheduledCount,
    comingUp: comingUpDocs.map(serializePost),
    recent: recentDocs.map(serializePost),
  };
}

export interface ActivityData {
  waiting: Post[];
  others: Post[];
}

export async function getActivityData(): Promise<ActivityData> {
  const col = await postsCollection();
  const [waitingDocs, otherDocs] = await Promise.all([
    col.find({ status: "waiting_approval" }).sort({ createdAt: -1 }).toArray(),
    col
      .find({ status: { $ne: "waiting_approval" } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray(),
  ]);
  return {
    waiting: waitingDocs.map(serializePost),
    others: otherDocs.map(serializePost),
  };
}
