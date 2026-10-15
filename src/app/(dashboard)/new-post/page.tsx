import { getAccounts } from "@/lib/db";
import NewPostView from "./NewPostView";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const [accounts, { topic }] = await Promise.all([getAccounts(), searchParams]);

  return <NewPostView accounts={accounts} defaultTopic={topic ?? ""} />;
}
