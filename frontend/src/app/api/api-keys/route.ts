import { NextResponse } from "next/server";
import { z } from "zod";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

const createKeySchema = z.object({
  label: z.string().trim().min(1).max(60),
});

export async function GET() {
  const response = await backendFetch("/api-keys", { method: "GET" });
  return toBffResponse(response);
}

export async function POST(request: Request) {
  const parsed = createKeySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const response = await backendFetch("/api-keys", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  return toBffResponse(response);
}
