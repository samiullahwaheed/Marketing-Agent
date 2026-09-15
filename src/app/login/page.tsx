import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f6f3] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white">
            M
          </div>
          <span className="text-sm font-medium text-neutral-800">Marketing agent</span>
        </div>

        <h1 className="text-xl font-semibold text-neutral-900">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">Enter the dashboard password to continue.</p>

        <form action={loginAction} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="next" value={next || "/"} />
          <input
            type="password"
            name="password"
            autoFocus
            required
            placeholder="Password"
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {error && (
            <p className="text-sm text-red-600">That password isn&apos;t right. Try again.</p>
          )}
          <button
            type="submit"
            className="mt-1 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
