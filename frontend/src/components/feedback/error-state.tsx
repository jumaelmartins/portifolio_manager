import { CircleAlert, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title: string;
  description: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-72 flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <CircleAlert className="size-5" aria-hidden="true" />
      </div>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
