"use client";

export default function PortfolioError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">We could not load this portfolio right now.</p>
      <button type="button" onClick={() => reset()} className="mt-4 underline">
        Try again
      </button>
    </div>
  );
}
