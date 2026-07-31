import { getSessionUserId } from "@/lib/auth/session";
import { PublicApiPanel } from "@/features/public-api/components/public-api-panel";

export default async function PublicApiPage() {
  const userId = await getSessionUserId();
  const baseUrl =
    process.env.BACKEND_PUBLIC_URL ??
    process.env.BACKEND_URL ??
    "http://localhost:3000";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">System</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Public API
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Consume your portfolio content from any external site.
        </p>
      </header>

      <PublicApiPanel userId={userId} baseUrl={baseUrl} />
    </div>
  );
}
