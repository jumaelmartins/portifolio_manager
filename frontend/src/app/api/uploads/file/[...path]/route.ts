import "server-only";

import { backendFetch } from "@/lib/api/backend";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const response = await backendFetch(`/uploads/${path.join("/")}`, {}, false);

  if (!response.ok) {
    return new Response(null, { status: response.status });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/octet-stream",
    },
  });
}
