import { redirect } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { PlatformBadge } from "@/components/PlatformBadge";
import { dropFacebookToken, facebookPages, heldFacebookToken, saveFacebookPage } from "@/lib/oauth";
import { requireUserId } from "@/lib/users";

export const dynamic = "force-dynamic";

async function choosePage(formData: FormData) {
  "use server";
  const userId = await requireUserId();
  const token = await heldFacebookToken();
  if (!token) redirect("/settings?connect_error=facebook_expired");

  // Re-read the Pages rather than trusting a token from the form.
  const page = (await facebookPages(token)).find((p) => p.id === String(formData.get("pageId")));
  if (!page) redirect("/settings?connect_error=facebook_failed");

  const { instagram } = await saveFacebookPage(userId, page);
  await dropFacebookToken();
  redirect(`/settings?connected=${instagram ? "facebook_instagram" : "facebook"}`);
}

export default async function ChooseFacebookPage() {
  await requireUserId();
  const token = await heldFacebookToken();
  if (!token) redirect("/settings?connect_error=facebook_expired");

  let pages: Awaited<ReturnType<typeof facebookPages>>;
  try {
    pages = await facebookPages(token);
  } catch {
    redirect("/settings?connect_error=facebook_failed");
  }

  return (
    <div className="flex flex-col gap-6 max-w-[720px] mx-auto">
      <BackLink to="/settings">Settings</BackLink>
      <PageHeader
        size="md"
        title="Which Page should we post to?"
        subtitle="You manage more than one Facebook Page. Pick the one for this workspace. Its linked Instagram account comes with it."
      />
      <Card className="p-2">
        <ul className="m-0 p-0 list-none flex flex-col">
          {pages.map((page) => (
            <li key={page.id}>
              <form action={choosePage}>
                <input type="hidden" name="pageId" value={page.id} />
                <button
                  type="submit"
                  className="press w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-0 bg-transparent text-left cursor-pointer hover:bg-white/70"
                >
                  <PlatformBadge platform="facebook" size="lg" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-ink truncate">{page.name}</span>
                    <span className="flex items-center gap-1.5 text-[13.5px] text-muted">
                      {page.instagram_business_account ? (
                        <>
                          <PlatformBadge platform="instagram" size="sm" />
                          {page.instagram_business_account.username
                            ? `@${page.instagram_business_account.username} linked`
                            : "Instagram linked"}
                        </>
                      ) : (
                        "No Instagram account linked"
                      )}
                    </span>
                  </span>
                  <span className="text-primary font-bold text-sm">Choose</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
