import {
  Cpu,
  FolderKanban,
  ImageIcon,
  ImageOff,
  Tags,
} from "lucide-react";

import { ErrorState } from "@/components/feedback/error-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardData } from "../types";
import { MetricCard } from "./metric-card";
import { QuickActions } from "./quick-actions";
import { RecentProjects } from "./recent-projects";

type DashboardViewProps = {
  data: DashboardData | undefined;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  username: string | null | undefined;
};

function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      className="space-y-6"
    >
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <Skeleton className="h-[420px] rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
      <span className="sr-only">Loading dashboard</span>
    </div>
  );
}

function firstName(username: string | null | undefined) {
  return username?.trim().split(/\s+/)[0] || "there";
}

export function DashboardView({
  data,
  isPending,
  error,
  onRetry,
  username,
}: DashboardViewProps) {
  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description={
          error?.message ||
          "The portfolio overview could not be loaded. Please try again."
        }
        onRetry={onRetry}
      />
    );
  }

  const completion =
    data.metrics.projects === 0
      ? 0
      : Math.round(
          (data.metrics.withCover / data.metrics.projects) * 100,
        );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio overview</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            <span>Welcome back, {firstName(username)}.</span>{" "}
            <span>Here is what is happening with your portfolio.</span>
          </p>
        </div>
      </section>

      <section
        aria-label="Portfolio metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        <MetricCard
          label="Projects"
          value={data.metrics.projects}
          description="Portfolio entries"
          icon={FolderKanban}
        />
        <MetricCard
          label="Categories"
          value={data.metrics.categories}
          description="Content groups"
          icon={Tags}
          tone="blue"
        />
        <MetricCard
          label="Technologies"
          value={data.metrics.technologies}
          description="Skills in use"
          icon={Cpu}
          tone="violet"
        />
        <MetricCard
          label="With cover"
          value={data.metrics.withCover}
          description="Ready to present"
          icon={ImageIcon}
          tone="amber"
        />
        <MetricCard
          label="Missing cover"
          value={data.metrics.withoutCover}
          description="Needs attention"
          icon={ImageOff}
          tone="slate"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <RecentProjects projects={data.recentProjects} />
        <div className="space-y-6">
          <QuickActions />
          <Card className="bg-card/75">
            <CardHeader>
              <CardTitle>Portfolio completeness</CardTitle>
              <CardDescription>
                Cover image coverage across your projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-heading text-4xl font-semibold tracking-tight">
                    {completion}%
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.metrics.withCover} of {data.metrics.projects} projects
                    have a cover.
                  </p>
                </div>
                <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <ImageIcon className="size-5" aria-hidden="true" />
                </div>
              </div>
              <div
                role="progressbar"
                aria-label="Portfolio cover completeness"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
                className="mt-6 h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Add covers to make every project easier to recognize in your
                public portfolio.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
