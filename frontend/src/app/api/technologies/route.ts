import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type BackendTechnology = {
  id: number;
  tech: string;
};

export async function GET() {
  const response = await backendFetch("/technologies");
  if (!response.ok) {
    return toBffResponse(response);
  }

  const technologies = (await response.json()) as BackendTechnology[];
  return NextResponse.json(
    technologies.map((technology) => ({
      id: technology.id,
      name: technology.tech,
    })),
  );
}
