import { notFound } from "next/navigation";
import { getAccounts, getPostById } from "@/lib/db";
import FullPostEditor from "@/components/FullPostEditor";
import PostDetailView from "@/components/PostDetailView";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, accounts] = await Promise.all([getPostById(id), getAccounts()]);

  if (!post) notFound();

  if (post.status === "waiting_approval") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Full post</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {post.topic} · {new Date(`${post.date}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short" })}, {post.time}
        </p>
        <div className="mt-6">
          <FullPostEditor post={post} accounts={accounts} />
        </div>
      </div>
    );
  }

  return <PostDetailView post={post} accounts={accounts} />;
}
