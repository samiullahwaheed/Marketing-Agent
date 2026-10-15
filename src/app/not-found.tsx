import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page px-4 text-center">
      <h1 className="heading text-xl">Not found</h1>
      <p className="text-sm text-muted">That page doesn&apos;t exist.</p>
      <Link href="/" className="text-sm font-bold text-primary hover:text-primary-hover">
        Back to Home
      </Link>
    </div>
  );
}
