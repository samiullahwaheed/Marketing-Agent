import { notFound } from "next/navigation";
import { getAccounts } from "@/lib/connections";
import { getPostById } from "@/lib/db";
import { requireUserId } from "@/lib/users";
import ReviewView from "./ReviewView";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const [post, accounts] = await Promise.all([getPostById(userId, id), getAccounts(userId)]);
  if (!post) notFound();

  return <ReviewView post={post} accounts={accounts} />;
}
