"use client";

import { Button } from "@/components/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E3BDB7] bg-error-bg p-6">
      <h2 className="heading text-lg text-error">Something went wrong</h2>
      <p className="mt-1 text-sm text-error">{error.message || "Unexpected error."}</p>
      <Button className="mt-3 border-[#E3BDB7]" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
