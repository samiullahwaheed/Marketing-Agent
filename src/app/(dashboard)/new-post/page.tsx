import { getAccounts } from "@/lib/db";
import NewPostForm from "@/components/NewPostForm";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const [accounts, { topic }] = await Promise.all([getAccounts(), searchParams]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">New post</h1>
      <p className="mt-1 text-sm text-neutral-500">Fill this in and the agent writes it</p>

      <NewPostForm accounts={accounts} defaultTopic={topic ?? ""} />
    </div>
  );
}
