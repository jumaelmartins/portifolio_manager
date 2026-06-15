import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone?: "green" | "blue" | "violet" | "amber" | "slate";
};

const tones = {
  green: "bg-primary/12 text-primary ring-primary/20",
  blue: "bg-sky-500/12 text-sky-400 ring-sky-500/20",
  violet: "bg-violet-500/12 text-violet-400 ring-violet-500/20",
  amber: "bg-amber-500/12 text-amber-400 ring-amber-500/20",
  slate: "bg-zinc-500/12 text-zinc-300 ring-zinc-500/20",
};

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "green",
}: MetricCardProps) {
  return (
    <Card
      role="article"
      aria-label={`${label}: ${value}`}
      className="min-h-36 justify-center bg-card/75 shadow-sm"
    >
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-xl ring-1",
            tones[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
