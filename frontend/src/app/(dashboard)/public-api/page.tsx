import { PublicApiPanel } from "@/features/public-api/components/public-api-panel";

// Render per request so BACKEND_PUBLIC_URL is read at runtime. Without this the
// page is statically prerendered at build time (when the env var is unset,
// since it is a runtime-only container env, not a build arg) and the endpoint /
// docs links get baked to the localhost fallback.
export const dynamic = "force-dynamic";

export default function PublicApiPage() {
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
          Consume your portfolio content from any external site using an API
          key.
        </p>
      </header>

      <PublicApiPanel baseUrl={baseUrl} />
    </div>
  );
}
