"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6">
      <h2 className="text-sm font-semibold text-red-700">Something went wrong</h2>
      <p className="mt-1 text-sm text-red-600">{error.message || "Unexpected error."}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
      >
        Try again
      </button>
    </div>
  );
}
