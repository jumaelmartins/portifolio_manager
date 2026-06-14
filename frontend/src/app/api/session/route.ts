import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

export async function GET() {
  return toBffResponse(await backendFetch("/auth/me"));
}
