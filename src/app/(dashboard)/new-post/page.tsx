import { Link2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { PlatformBadge } from "@/components/PlatformBadge";
import { getAccounts } from "@/lib/connections";
import { PLATFORM_ORDER } from "@/lib/platforms";
import { requireUserId } from "@/lib/users";
import NewPostView from "./NewPostView";

export const dynamic = "force-dynamic";

/** Shown until the user has connected at least one account: there'd be nowhere to post. */
function ConnectFirst() {
  return (
    <div className="flex flex-col gap-6 max-w-[720px] mx-auto">
      <PageHeader title="New post" subtitle="One quick step before your first post." />
      <Card className="px-7 py-8 flex flex-col items-start gap-5">
        <span className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
          <Link2 size={24} strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="heading text-2xl">Connect an account to start posting</h2>
          <p className="m-0 text-muted max-w-[520px]">
            Link your Facebook Page (its Instagram comes along) or your LinkedIn profile. The agent posts there, and
            only after you approve each post.
          </p>
        </div>
        <div className="flex items-center gap-2" aria-hidden="true">
          {PLATFORM_ORDER.map((p) => (
            <PlatformBadge key={p} platform={p} size="lg" />
          ))}
        </div>
        <Button variant="primary" size="lg" to="/settings">
          Go to Settings → Connected accounts
        </Button>
      </Card>
    </div>
  );
}

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const userId = await requireUserId();
  const [accounts, { topic }] = await Promise.all([getAccounts(userId), searchParams]);

  if (accounts.every((a) => a.status === "not_connected")) return <ConnectFirst />;

  return <NewPostView accounts={accounts} defaultTopic={topic ?? ""} />;
}
