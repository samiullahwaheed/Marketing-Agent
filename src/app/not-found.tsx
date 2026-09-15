import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7f6f3] px-4 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">Not found</h1>
      <p className="text-sm text-neutral-500">That page doesn&apos;t exist.</p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        Back to Home
      </Link>
    </div>
  );
}
