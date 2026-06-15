import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type BackendCategory = {
  id: number;
  category: string;
};

export async function GET() {
  const response = await backendFetch("/category");
  if (!response.ok) {
    return toBffResponse(response);
  }

  const categories = (await response.json()) as BackendCategory[];
  return NextResponse.json(
    categories.map((category) => ({
      id: category.id,
      name: category.category,
    })),
  );
}
