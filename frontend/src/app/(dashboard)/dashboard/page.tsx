"use client";

import { useSession } from "@/features/auth/api/use-session";
import { useDashboard } from "@/features/dashboard/api/use-dashboard";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export default function DashboardPage() {
  const session = useSession();
  const dashboard = useDashboard();

  return (
    <DashboardView
      data={dashboard.data}
      isPending={dashboard.isPending}
      error={dashboard.error}
      onRetry={() => {
        void dashboard.refetch();
      }}
      username={session.data?.username}
    />
  );
}
