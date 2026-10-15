import { notFound } from "next/navigation";
import { getAccounts, getPostById } from "@/lib/db";
import ReviewView from "./ReviewView";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, accounts] = await Promise.all([getPostById(id), getAccounts()]);
  if (!post) notFound();

  return <ReviewView post={post} accounts={accounts} />;
}
