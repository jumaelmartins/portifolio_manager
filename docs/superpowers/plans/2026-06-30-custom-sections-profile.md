# Custom Sections & Profile / Account Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the two remaining Fase 3 frontend features — Custom Sections (two-level dynamic-schema CRUD) and Profile / Account Settings — in the Next.js admin panel, following the established BFF + feature-slice pattern.

**Architecture:** Browser → Next.js Route Handlers (`app/api/`) → NestJS backend via the `pm_session` HttpOnly cookie (`backendFetch`). Server state via TanStack Query v5. Forms via react-hook-form + zod. Custom Sections normalize on the client (pure normalizer); Profile normalizes in the BFF (needs `process.env.BACKEND_URL` + node `path`).

**Tech Stack:** Next.js 16 App Router, TanStack Query v5, react-hook-form + zod, shadcn/ui (base-ui primitives), Lucide icons, TypeScript, Vitest + Testing Library.

## Global Constraints

- Feature files live under `frontend/src/features/<module>/`: `types.ts`, `schemas.ts`, `server/normalize-*.ts`, `api/*-api.ts`, `api/*-queries.ts`, `components/`.
- BFF Route Handlers under `frontend/src/app/api/`; dashboard pages under `frontend/src/app/(dashboard)/`.
- `"use client"` is the literal first line of every client component and query-hook file.
- Form components: `<form noValidate>`, `zodResolver`, `criteriaMode: "all"`, `shouldFocusError: true`; root errors in `<p role="alert">`; field errors via `<FieldErrors error={errors.x} id="..." />` from `@/features/auth/components/field-errors`.
- BFF validation errors: `{ status: 400, message: "...", fieldErrors: z.flattenError(parsed.error).fieldErrors }` with HTTP 400.
- Image URLs: rewrite backend URLs with `rewriteUploadUrl` from `@/features/projects/server/normalize-project` before returning to the client.
- Dashboard page files that use hooks wrap inner content in `<Suspense>` with a `fallback`.
- Next.js 16: dynamic route `params` is a `Promise` — `type RouteContext = { params: Promise<{ ... }> }` and `await context.params`.
- BFF route test files start with `// @vitest-environment node`.
- Commit prefixes: `feat(custom-sections):`, `feat(profile):`, `test(...):`.
- **OVERRIDE of spec Global Constraint #3 ("no `onSuccess` inside hook definitions"):** the existing codebase (`experience-queries.ts`, `projects`, etc.) puts cache invalidation inside `useMutation({ onSuccess })`. This plan follows the codebase, not the spec's constraint, so the new modules stay consistent with every other module. Callers use `.mutateAsync(...)` for sequencing; invalidation lives in the hook.
- **Custom Sections BFF is passthrough; the client normalizes** (spec §BFF Routes). `normalize-custom-sections.ts` is a pure module (no node/env deps) imported by the client-side api functions. Profile is the opposite — its BFF normalizes because `normalize-profile.ts` needs `process.env.BACKEND_URL` and node `path`.
- **Item mutations return `void`** (deviation from spec's `createItem: Promise<CustomSection>`): the UI is driven by invalidating `["custom-sections"]` and re-deriving the active section from the refetched list, so the backend's item-response shape is never depended upon.

---

## File Structure

**Custom Sections feature slice** (`frontend/src/features/custom-sections/`):
- `types.ts` — frontend + backend shapes
- `schemas.ts` — `fieldSchemaItemSchema`, `customSectionSchema`, `buildItemSchema`
- `server/normalize-custom-sections.ts` — pure normalizers + input mappers
- `api/custom-sections-api.ts` — `requestJson` + fetch/mutation functions
- `api/custom-sections-queries.ts` — query keys + hooks
- `components/section-form.tsx`, `section-editor.tsx`, `item-form.tsx`, `items-drawer.tsx`, `sections-view.tsx`, `section-card.tsx`, `delete-section-dialog.tsx`, `delete-item-dialog.tsx`

**Custom Sections BFF** (`frontend/src/app/api/custom-sections/`):
- `route.ts`, `[id]/route.ts`, `[id]/items/route.ts`, `items/[itemId]/route.ts`

**Custom Sections pages** (`frontend/src/app/(dashboard)/custom-sections/`):
- `page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`

**Profile feature slice** (`frontend/src/features/profile/`):
- `types.ts`, `schemas.ts`, `server/normalize-profile.ts`
- `api/profile-api.ts`, `api/profile-queries.ts`
- `components/profile-picture-upload.tsx`, `profile-form.tsx`, `password-form.tsx`, `profile-view.tsx`

**Profile BFF** (`frontend/src/app/api/profile/`):
- `route.ts`, `password/route.ts`

**Profile page** (`frontend/src/app/(dashboard)/profile/`):
- `page.tsx`

**Shared:** `frontend/src/components/layout/navigation.ts` (enable Custom Sections + add Profile).

---

## Task 1: Custom Sections — Types, Schemas, Normalizer

**Files:**
- Create: `frontend/src/features/custom-sections/types.ts`
- Create: `frontend/src/features/custom-sections/schemas.ts`
- Create: `frontend/src/features/custom-sections/server/normalize-custom-sections.ts`
- Test: `frontend/src/features/custom-sections/schemas.test.ts`
- Test: `frontend/src/features/custom-sections/server/normalize-custom-sections.test.ts`

**Interfaces:**
- Produces: `FieldSchema`, `CustomSection`, `CustomItem`, `CustomSectionInput`, `CustomItemInput`, `BackendCustomSection`, `BackendCustomItem`, `BackendCustomSectionInput` (types); `fieldSchemaItemSchema`, `customSectionSchema`, `CustomSectionFormValues`, `buildItemSchema(fields)` (schemas); `normalizeSection`, `normalizeItem`, `toBackendSectionInput`, `toBackendItemInput` (normalizer).

- [ ] **Step 1: Write `types.ts`**

```typescript
// frontend/src/features/custom-sections/types.ts

export type FieldSchema = {
  key: string;
  label: string;
  type: "text" | "url" | "date";
  required?: boolean;
};

export type CustomSection = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  fieldSchema: FieldSchema[];
  order: number | null;
  items: CustomItem[];
};

export type CustomItem = {
  id: number;
  sectionId: number;
  data: Record<string, string>;
  order: number | null;
};

export type CustomSectionInput = {
  name: string;
  description?: string;
  icon?: string;
  fieldSchema: FieldSchema[];
};

export type CustomItemInput = {
  data: Record<string, string>;
};

export type BackendCustomSection = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  field_schema: FieldSchema[];
  order: number | null;
  user_id: number;
  items: BackendCustomItem[];
};

export type BackendCustomItem = {
  id: number;
  section_id: number;
  data: Record<string, string>;
  order: number | null;
};

export type BackendCustomSectionInput = {
  name: string;
  description?: string;
  icon?: string;
  field_schema: FieldSchema[];
};

export type BackendCustomItemInput = {
  data: Record<string, string>;
};
```

- [ ] **Step 2: Write the failing schema tests**

```typescript
// frontend/src/features/custom-sections/schemas.test.ts
import { describe, expect, it } from "vitest";
import { customSectionSchema, buildItemSchema } from "./schemas";
import type { FieldSchema } from "./types";

const validSection = {
  name: "Awards",
  description: "Recognition",
  icon: "Trophy",
  fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
};

describe("customSectionSchema", () => {
  it("accepts a valid section", () => {
    expect(customSectionSchema.safeParse(validSection).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(customSectionSchema.safeParse({ ...validSection, name: "" }).success).toBe(false);
  });

  it("rejects an invalid key pattern", () => {
    const result = customSectionSchema.safeParse({
      ...validSection,
      fieldSchema: [{ key: "1bad", label: "Title", type: "text" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty fieldSchema array", () => {
    const result = customSectionSchema.safeParse({ ...validSection, fieldSchema: [] });
    expect(result.success).toBe(false);
  });
});

describe("buildItemSchema", () => {
  const fields: FieldSchema[] = [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "link", label: "Link", type: "url", required: false },
  ];

  it("errors when a required text field is empty", () => {
    const result = buildItemSchema(fields).safeParse({ title: "", link: "" });
    expect(result.success).toBe(false);
  });

  it("errors when a url field is not a valid URL", () => {
    const result = buildItemSchema(fields).safeParse({ title: "Best Dev", link: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("passes when optional fields are empty and required are filled", () => {
    const result = buildItemSchema(fields).safeParse({ title: "Best Dev", link: "" });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 3: Run the schema tests to verify they fail**

Run: `cd frontend && npm run test:run -- src/features/custom-sections/schemas.test.ts`
Expected: FAIL — cannot resolve `./schemas`.

- [ ] **Step 4: Write `schemas.ts`**

```typescript
// frontend/src/features/custom-sections/schemas.ts
import { z } from "zod";
import type { FieldSchema } from "./types";

export const fieldSchemaItemSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Key must start with a letter and contain only lowercase letters, numbers, and underscores",
    ),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "url", "date"]),
  required: z.boolean().optional(),
});

export const customSectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  fieldSchema: z.array(fieldSchemaItemSchema).min(1, "At least one field is required"),
});

export type CustomSectionFormValues = z.infer<typeof customSectionSchema>;

// Builds a zod schema for an item's `data` from the section's field schema.
// Required fields must be non-empty; url fields must be valid URLs when non-empty;
// date fields must be YYYY-MM-DD when non-empty.
export function buildItemSchema(fields: FieldSchema[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let validator: z.ZodTypeAny;
    if (field.type === "url") {
      validator = z.string().url("Must be a valid URL");
      if (!field.required) validator = validator.or(z.literal("")).optional();
    } else if (field.type === "date") {
      validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)");
      if (!field.required) validator = validator.or(z.literal("")).optional();
    } else {
      validator = field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();
    }
    shape[field.key] = validator;
  }
  return z.object(shape);
}
```

- [ ] **Step 5: Run the schema tests to verify they pass**

Run: `cd frontend && npm run test:run -- src/features/custom-sections/schemas.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Write the failing normalizer tests**

```typescript
// frontend/src/features/custom-sections/server/normalize-custom-sections.test.ts
import { describe, expect, it } from "vitest";
import {
  normalizeSection,
  normalizeItem,
  toBackendSectionInput,
} from "./normalize-custom-sections";
import type { BackendCustomSection } from "../types";

const backendSection: BackendCustomSection = {
  id: 1,
  name: "Awards",
  description: "Recognition",
  icon: "Trophy",
  field_schema: [{ key: "title", label: "Title", type: "text", required: true }],
  order: 0,
  user_id: 7,
  items: [{ id: 10, section_id: 1, data: { title: "Best Dev" }, order: 0 }],
};

describe("normalizeSection", () => {
  it("maps field_schema to fieldSchema and normalizes items", () => {
    expect(normalizeSection(backendSection)).toEqual({
      id: 1,
      name: "Awards",
      description: "Recognition",
      icon: "Trophy",
      fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
      order: 0,
      items: [{ id: 10, sectionId: 1, data: { title: "Best Dev" }, order: 0 }],
    });
  });

  it("defaults a missing field_schema to an empty array", () => {
    const result = normalizeSection({ ...backendSection, field_schema: undefined as never });
    expect(result.fieldSchema).toEqual([]);
  });

  it("handles an empty items array", () => {
    expect(normalizeSection({ ...backendSection, items: [] }).items).toEqual([]);
  });
});

describe("normalizeItem", () => {
  it("maps section_id to sectionId and defaults null data to {}", () => {
    expect(normalizeItem({ id: 5, section_id: 2, data: null as never, order: null })).toEqual({
      id: 5,
      sectionId: 2,
      data: {},
      order: null,
    });
  });
});

describe("toBackendSectionInput", () => {
  it("maps fieldSchema to field_schema and omits empty description/icon", () => {
    expect(
      toBackendSectionInput({
        name: "Awards",
        description: "",
        icon: "",
        fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
      }),
    ).toEqual({
      name: "Awards",
      field_schema: [{ key: "title", label: "Title", type: "text", required: true }],
      description: undefined,
      icon: undefined,
    });
  });
});
```

- [ ] **Step 7: Run the normalizer tests to verify they fail**

Run: `cd frontend && npm run test:run -- src/features/custom-sections/server/normalize-custom-sections.test.ts`
Expected: FAIL — cannot resolve `./normalize-custom-sections`.

- [ ] **Step 8: Write `normalize-custom-sections.ts`**

```typescript
// frontend/src/features/custom-sections/server/normalize-custom-sections.ts
import type {
  BackendCustomItem,
  BackendCustomSection,
  BackendCustomSectionInput,
  CustomItem,
  CustomItemInput,
  CustomSection,
  CustomSectionInput,
} from "../types";

export function normalizeSection(s: BackendCustomSection): CustomSection {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    fieldSchema: Array.isArray(s.field_schema) ? s.field_schema : [],
    order: s.order,
    items: (s.items ?? []).map(normalizeItem),
  };
}

export function normalizeItem(i: BackendCustomItem): CustomItem {
  return {
    id: i.id,
    sectionId: i.section_id,
    data: (i.data ?? {}) as Record<string, string>,
    order: i.order,
  };
}

export function toBackendSectionInput(input: CustomSectionInput): BackendCustomSectionInput {
  return {
    name: input.name,
    field_schema: input.fieldSchema,
    description: input.description || undefined,
    icon: input.icon || undefined,
  };
}

export function toBackendItemInput(input: CustomItemInput): { data: Record<string, string> } {
  return { data: input.data };
}
```

- [ ] **Step 9: Run the normalizer tests to verify they pass**

Run: `cd frontend && npm run test:run -- src/features/custom-sections/server/normalize-custom-sections.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 10: Commit**

```bash
git add frontend/src/features/custom-sections/types.ts frontend/src/features/custom-sections/schemas.ts frontend/src/features/custom-sections/schemas.test.ts frontend/src/features/custom-sections/server/normalize-custom-sections.ts frontend/src/features/custom-sections/server/normalize-custom-sections.test.ts
git commit -m "feat(custom-sections): add types, schemas, and normalizer"
```

---

## Task 2: Custom Sections — BFF Routes

**Files:**
- Create: `frontend/src/app/api/custom-sections/route.ts`
- Create: `frontend/src/app/api/custom-sections/[id]/route.ts`
- Create: `frontend/src/app/api/custom-sections/[id]/items/route.ts`
- Create: `frontend/src/app/api/custom-sections/items/[itemId]/route.ts`
- Test: `frontend/src/app/api/custom-sections/route.test.ts`
- Test: `frontend/src/app/api/custom-sections/[id]/route.test.ts`
- Test: `frontend/src/app/api/custom-sections/[id]/items/route.test.ts`
- Test: `frontend/src/app/api/custom-sections/items/[itemId]/route.test.ts`

**Interfaces:**
- Consumes: `customSectionSchema`, `toBackendSectionInput` (Task 1); `backendFetch`, `toBffResponse`.
- Produces: HTTP endpoints. GET `/api/custom-sections` returns raw `BackendCustomSection[]`; POST validates and forwards; `[id]` PATCH/DELETE; `[id]/items` POST; `items/[itemId]` PATCH/DELETE.

- [ ] **Step 1: Write the failing test for the collection route**

```typescript
// frontend/src/app/api/custom-sections/route.test.ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { GET, POST } from "./route";

const validBody = {
  name: "Awards",
  fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
};

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/custom-sections", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("/api/custom-sections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the section list through from the backend", async () => {
    backendFetch.mockResolvedValue(Response.json([{ id: 1, name: "Awards" }]));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 1, name: "Awards" }]);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections");
  });

  it("rejects a section without a name", async () => {
    const response = await post({ ...validBody, name: "" });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects a section with an empty fieldSchema", async () => {
    const response = await post({ ...validBody, fieldSchema: [] });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a valid section with backend field names", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 9 }, { status: 201 }));
    const response = await post(validBody);
    expect(response.status).toBe(201);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections", {
      method: "POST",
      body: JSON.stringify({
        name: "Awards",
        field_schema: [{ key: "title", label: "Title", type: "text", required: true }],
        description: undefined,
        icon: undefined,
      }),
    });
  });

  it("passes through a backend error", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 500 }));
    const response = await post(validBody);
    expect(response.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/app/api/custom-sections/route.test.ts"`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 3: Write the collection route**

```typescript
// frontend/src/app/api/custom-sections/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { customSectionSchema } from "@/features/custom-sections/schemas";
import { toBackendSectionInput } from "@/features/custom-sections/server/normalize-custom-sections";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

export async function GET() {
  return toBffResponse(await backendFetch("/custom-sections"));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = customSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  return toBffResponse(
    await backendFetch("/custom-sections", {
      method: "POST",
      body: JSON.stringify(toBackendSectionInput(parsed.data)),
    }),
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/app/api/custom-sections/route.test.ts"`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing test for the `[id]` route**

```typescript
// frontend/src/app/api/custom-sections/[id]/route.test.ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { PATCH, DELETE } from "./route";

const validBody = {
  name: "Awards",
  fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
};

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patch(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/custom-sections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    ctx(id),
  );
}

describe("/api/custom-sections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid id on PATCH", async () => {
    const response = await patch("abc", validBody);
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects invalid data on PATCH", async () => {
    const response = await patch("3", { ...validBody, name: "" });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a valid update", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 3 }));
    const response = await patch("3", validBody);
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/3", {
      method: "PATCH",
      body: JSON.stringify({
        name: "Awards",
        field_schema: [{ key: "title", label: "Title", type: "text", required: true }],
        description: undefined,
        icon: undefined,
      }),
    });
  });

  it("rejects an invalid id on DELETE", async () => {
    const response = await DELETE(new Request("http://localhost/api/custom-sections/0", { method: "DELETE" }), ctx("0"));
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a delete", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 200 }));
    const response = await DELETE(new Request("http://localhost/api/custom-sections/4", { method: "DELETE" }), ctx("4"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 4 });
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/4", { method: "DELETE" });
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/app/api/custom-sections/[id]/route.test.ts"`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 7: Write the `[id]` route**

```typescript
// frontend/src/app/api/custom-sections/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { customSectionSchema } from "@/features/custom-sections/schemas";
import { toBackendSectionInput } from "@/features/custom-sections/server/normalize-custom-sections";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type RouteContext = { params: Promise<{ id: string }> };

async function readId(context: RouteContext) {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function invalidIdResponse() {
  return NextResponse.json({ status: 400, message: "Invalid section ID" }, { status: 400 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const parsed = customSectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  return toBffResponse(
    await backendFetch(`/custom-sections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toBackendSectionInput(parsed.data)),
    }),
  );
}

export async function DELETE(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/custom-sections/${id}`, { method: "DELETE" });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json({ id });
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/app/api/custom-sections/[id]/route.test.ts"`
Expected: PASS (5 tests).

- [ ] **Step 9: Write the failing test for the items collection route**

```typescript
// frontend/src/app/api/custom-sections/[id]/items/route.test.ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { POST } from "./route";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function post(id: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/custom-sections/${id}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
    ctx(id),
  );
}

describe("/api/custom-sections/[id]/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid section id", async () => {
    const response = await post("abc", { data: { title: "X" } });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects a body without a data object", async () => {
    const response = await post("1", { data: null });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a valid item", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 10 }, { status: 201 }));
    const response = await post("1", { data: { title: "Best Dev" } });
    expect(response.status).toBe(201);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/1/items", {
      method: "POST",
      body: JSON.stringify({ data: { title: "Best Dev" } }),
    });
  });
});
```

- [ ] **Step 10: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/app/api/custom-sections/[id]/items/route.test.ts"`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 11: Write the items collection route**

```typescript
// frontend/src/app/api/custom-sections/[id]/items/route.ts
import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type RouteContext = { params: Promise<{ id: string }> };

function isDataObject(value: unknown): value is { data: Record<string, unknown> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof (value as { data: unknown }).data === "object" &&
    (value as { data: unknown }).data !== null &&
    !Array.isArray((value as { data: unknown }).data)
  );
}

export async function POST(request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ status: 400, message: "Invalid section ID" }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  if (!isDataObject(body)) {
    return NextResponse.json({ status: 400, message: "Item data is required" }, { status: 400 });
  }
  return toBffResponse(
    await backendFetch(`/custom-sections/${id}/items`, {
      method: "POST",
      body: JSON.stringify({ data: body.data }),
    }),
  );
}
```

- [ ] **Step 12: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/app/api/custom-sections/[id]/items/route.test.ts"`
Expected: PASS (3 tests).

- [ ] **Step 13: Write the failing test for the item detail route**

```typescript
// frontend/src/app/api/custom-sections/items/[itemId]/route.test.ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { PATCH, DELETE } from "./route";

function ctx(itemId: string) {
  return { params: Promise.resolve({ itemId }) };
}

describe("/api/custom-sections/items/[itemId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid itemId on PATCH", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/custom-sections/items/abc", {
        method: "PATCH",
        body: JSON.stringify({ data: { title: "X" } }),
      }),
      ctx("abc"),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a valid item update", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 200 }));
    const response = await PATCH(
      new Request("http://localhost/api/custom-sections/items/10", {
        method: "PATCH",
        body: JSON.stringify({ data: { title: "Updated" } }),
      }),
      ctx("10"),
    );
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/items/10", {
      method: "PATCH",
      body: JSON.stringify({ data: { title: "Updated" } }),
    });
  });

  it("rejects an invalid itemId on DELETE", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/custom-sections/items/0", { method: "DELETE" }),
      ctx("0"),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a delete", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 200 }));
    const response = await DELETE(
      new Request("http://localhost/api/custom-sections/items/11", { method: "DELETE" }),
      ctx("11"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 11 });
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/items/11", { method: "DELETE" });
  });
});
```

- [ ] **Step 14: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/app/api/custom-sections/items/[itemId]/route.test.ts"`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 15: Write the item detail route**

```typescript
// frontend/src/app/api/custom-sections/items/[itemId]/route.ts
import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type RouteContext = { params: Promise<{ itemId: string }> };

async function readItemId(context: RouteContext) {
  const itemId = Number((await context.params).itemId);
  return Number.isInteger(itemId) && itemId > 0 ? itemId : null;
}

function invalidIdResponse() {
  return NextResponse.json({ status: 400, message: "Invalid item ID" }, { status: 400 });
}

function isDataObject(value: unknown): value is { data: Record<string, unknown> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof (value as { data: unknown }).data === "object" &&
    (value as { data: unknown }).data !== null &&
    !Array.isArray((value as { data: unknown }).data)
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const itemId = await readItemId(context);
  if (!itemId) return invalidIdResponse();
  const body = await request.json().catch(() => null);
  if (!isDataObject(body)) {
    return NextResponse.json({ status: 400, message: "Item data is required" }, { status: 400 });
  }
  return toBffResponse(
    await backendFetch(`/custom-sections/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ data: body.data }),
    }),
  );
}

export async function DELETE(_req: Request, context: RouteContext) {
  const itemId = await readItemId(context);
  if (!itemId) return invalidIdResponse();
  const response = await backendFetch(`/custom-sections/items/${itemId}`, { method: "DELETE" });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json({ id: itemId });
}
```

- [ ] **Step 16: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/app/api/custom-sections/items/[itemId]/route.test.ts"`
Expected: PASS (4 tests).

- [ ] **Step 17: Commit**

```bash
git add frontend/src/app/api/custom-sections
git commit -m "feat(custom-sections): add BFF route handlers for sections and items"
```

---

## Task 3: Custom Sections — API Functions & Query Hooks

**Files:**
- Create: `frontend/src/features/custom-sections/api/custom-sections-api.ts`
- Create: `frontend/src/features/custom-sections/api/custom-sections-queries.ts`

**Interfaces:**
- Consumes: `CustomSection`, `CustomSectionInput`, `CustomItemInput`, `BackendCustomSection` (Task 1 types); `normalizeSection` (Task 1); BFF routes (Task 2).
- Produces (api): `fetchSections(): Promise<CustomSection[]>`, `createSection(input): Promise<CustomSection>`, `updateSection(id, input): Promise<CustomSection>`, `deleteSection(id): Promise<{ id: number }>`, `createItem(sectionId, input): Promise<void>`, `updateItem(itemId, input): Promise<void>`, `deleteItem(itemId): Promise<void>`.
- Produces (queries): `customSectionKeys`, `useSections`, `useCreateSection`, `useUpdateSection`, `useDeleteSection`, `useCreateItem`, `useUpdateItem`, `useDeleteItem`.

- [ ] **Step 1: Write `custom-sections-api.ts`**

```typescript
// frontend/src/features/custom-sections/api/custom-sections-api.ts
import type { ApiError } from "@/lib/api/types";
import { normalizeSection } from "../server/normalize-custom-sections";
import type {
  BackendCustomSection,
  CustomItemInput,
  CustomSection,
  CustomSectionInput,
} from "../types";

async function requestJson<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(input, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const error: ApiError =
      payload && typeof payload === "object" && "message" in payload
        ? { ...(payload as ApiError), status: response.status }
        : { status: response.status, message: "Request failed" };
    throw error;
  }
  return payload as T;
}

export async function fetchSections(): Promise<CustomSection[]> {
  const data = await requestJson<BackendCustomSection[]>("/api/custom-sections");
  return data.map(normalizeSection);
}

export async function createSection(input: CustomSectionInput): Promise<CustomSection> {
  const data = await requestJson<BackendCustomSection>("/api/custom-sections", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeSection(data);
}

export async function updateSection(id: number, input: CustomSectionInput): Promise<CustomSection> {
  const data = await requestJson<BackendCustomSection>(`/api/custom-sections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return normalizeSection(data);
}

export function deleteSection(id: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/${id}`, { method: "DELETE" });
}

export async function createItem(sectionId: number, input: CustomItemInput): Promise<void> {
  await requestJson(`/api/custom-sections/${sectionId}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateItem(itemId: number, input: CustomItemInput): Promise<void> {
  await requestJson(`/api/custom-sections/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteItem(itemId: number): Promise<void> {
  await requestJson(`/api/custom-sections/items/${itemId}`, { method: "DELETE" });
}
```

- [ ] **Step 2: Write `custom-sections-queries.ts`**

```typescript
// frontend/src/features/custom-sections/api/custom-sections-queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CustomItemInput, CustomSectionInput } from "../types";
import {
  createItem,
  createSection,
  deleteItem,
  deleteSection,
  fetchSections,
  updateItem,
  updateSection,
} from "./custom-sections-api";

export const customSectionKeys = {
  all: ["custom-sections"] as const,
};

export function useSections() {
  return useQuery({
    queryKey: customSectionKeys.all,
    queryFn: fetchSections,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSection,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customSectionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CustomSectionInput }) =>
      updateSection(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customSectionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSection,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customSectionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, input }: { sectionId: number; input: CustomItemInput }) =>
      createItem(sectionId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customSectionKeys.all });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: number; input: CustomItemInput }) =>
      updateItem(itemId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customSectionKeys.all });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customSectionKeys.all });
    },
  });
}
```

- [ ] **Step 3: Verify the project still type-checks and lints**

Run: `cd frontend && npm run lint`
Expected: PASS (no errors in the new files).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/custom-sections/api
git commit -m "feat(custom-sections): add API functions and query hooks"
```

---

## Task 4: Custom Sections — SectionForm & SectionEditor

**Files:**
- Create: `frontend/src/features/custom-sections/components/section-form.tsx`
- Create: `frontend/src/features/custom-sections/components/section-editor.tsx`
- Test: `frontend/src/features/custom-sections/components/section-form.spec.tsx`

**Interfaces:**
- Consumes: `customSectionSchema`, `CustomSectionFormValues` (Task 1); `useSections`, `useCreateSection`, `useUpdateSection` (Task 3); `CustomSectionInput` (Task 1).
- Produces: `SectionForm` (props: `mode`, `defaultValues?`, `onSubmit`), `SectionEditor` (props: `mode`, `sectionId?`).

- [ ] **Step 1: Write the failing SectionForm tests**

```typescript
// frontend/src/features/custom-sections/components/section-form.spec.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionForm } from "./section-form";

const baseProps = { mode: "create" as const, onSubmit: vi.fn() };

describe("SectionForm", () => {
  it("blocks submission when the name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SectionForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Create Section" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("appends a new field row when Add field is clicked", async () => {
    const user = userEvent.setup();
    render(<SectionForm {...baseProps} />);
    expect(screen.getAllByLabelText("Field label")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Add field" }));
    expect(screen.getAllByLabelText("Field label")).toHaveLength(2);
  });

  it("auto-populates the key from the label", async () => {
    const user = userEvent.setup();
    render(<SectionForm {...baseProps} />);
    await user.type(screen.getByLabelText("Field label"), "My Award");
    expect(screen.getByLabelText("Field key")).toHaveValue("my_award");
  });

  it("rejects an invalid key pattern on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SectionForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Section name"), "Awards");
    await user.type(screen.getByLabelText("Field label"), "Title");
    const keyInput = screen.getByLabelText("Field key");
    await user.clear(keyInput);
    await user.type(keyInput, "1bad");
    await user.click(screen.getByRole("button", { name: "Create Section" }));
    expect(
      await screen.findByText(/Key must start with a letter/),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<SectionForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Section name"), "Awards");
    await user.type(screen.getByLabelText("Field label"), "Title");
    await user.click(screen.getByRole("button", { name: "Create Section" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/features/custom-sections/components/section-form.spec.tsx"`
Expected: FAIL — cannot resolve `./section-form`.

- [ ] **Step 3: Write `section-form.tsx`**

```tsx
// frontend/src/features/custom-sections/components/section-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { FieldErrors } from "@/features/auth/components/field-errors";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customSectionSchema, type CustomSectionFormValues } from "../schemas";

type SectionFormProps = {
  mode: "create" | "edit";
  defaultValues?: CustomSectionFormValues;
  onSubmit: (input: CustomSectionFormValues) => Promise<void>;
};

const emptyValues: CustomSectionFormValues = {
  name: "",
  description: "",
  icon: "",
  fieldSchema: [{ key: "", label: "", type: "text", required: false }],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function SectionForm({ mode, defaultValues = emptyValues, onSubmit }: SectionFormProps) {
  const form = useForm<CustomSectionFormValues>({
    resolver: zodResolver(customSectionSchema),
    defaultValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "fieldSchema" });
  const manualKeys = useRef<Set<string>>(new Set());

  async function submit(values: CustomSectionFormValues) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save section",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="max-w-2xl space-y-6">
        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle>Section details</CardTitle>
            <CardDescription>
              A custom section shown in your public portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cs-name">Name</Label>
              <Input
                id="cs-name"
                aria-label="Section name"
                aria-invalid={Boolean(errors.name)}
                {...form.register("name")}
              />
              <FieldErrors error={errors.name} id="cs-name-error" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cs-description">Description</Label>
              <Input
                id="cs-description"
                aria-label="Description"
                {...form.register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cs-icon">Icon</Label>
              <Input
                id="cs-icon"
                aria-label="Icon name"
                placeholder="e.g. Star, Trophy, Award"
                {...form.register("icon")}
              />
              <p className="text-xs text-muted-foreground">Optional Lucide icon name.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle>Fields</CardTitle>
            <CardDescription>
              Define the fields each item in this section will have.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((item, index) => {
              const labelReg = form.register(`fieldSchema.${index}.label`);
              const keyReg = form.register(`fieldSchema.${index}.key`);
              return (
                <div key={item.id} className="space-y-3 rounded-lg border border-border p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`cs-field-label-${index}`}>Label</Label>
                      <Input
                        id={`cs-field-label-${index}`}
                        aria-label="Field label"
                        {...labelReg}
                        onChange={(event) => {
                          void labelReg.onChange(event);
                          if (!manualKeys.current.has(item.id)) {
                            form.setValue(
                              `fieldSchema.${index}.key`,
                              slugify(event.target.value),
                              { shouldValidate: false },
                            );
                          }
                        }}
                      />
                      <FieldErrors
                        error={errors.fieldSchema?.[index]?.label}
                        id={`cs-field-label-${index}-error`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cs-field-key-${index}`}>Key</Label>
                      <Input
                        id={`cs-field-key-${index}`}
                        aria-label="Field key"
                        {...keyReg}
                        onChange={(event) => {
                          manualKeys.current.add(item.id);
                          void keyReg.onChange(event);
                        }}
                      />
                      <FieldErrors
                        error={errors.fieldSchema?.[index]?.key}
                        id={`cs-field-key-${index}-error`}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`cs-field-type-${index}`}>Type</Label>
                      <select
                        id={`cs-field-type-${index}`}
                        aria-label="Field type"
                        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                        {...form.register(`fieldSchema.${index}.type`)}
                      >
                        <option value="text">Text</option>
                        <option value="url">URL</option>
                        <option value="date">Date</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        id={`cs-field-required-${index}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border border-input accent-primary"
                        aria-label="Required field"
                        {...form.register(`fieldSchema.${index}.required`)}
                      />
                      <Label htmlFor={`cs-field-required-${index}`}>Required</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto mt-6"
                      aria-label="Remove field"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 data-icon="inline-start" />
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}

            {typeof errors.fieldSchema?.message === "string" ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.fieldSchema.message}
              </p>
            ) : null}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ key: "", label: "", type: "text", required: false })}
            >
              <Plus data-icon="inline-start" />
              Add field
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/75">
          <CardContent className="space-y-3">
            {errors.root?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Save />
              )}
              {form.formState.isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Section"
                  : "Save changes"}
            </Button>
            <Link
              href="/custom-sections"
              className={buttonVariants({ variant: "outline", size: "lg", className: "h-11 w-full" })}
            >
              Cancel
            </Link>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/features/custom-sections/components/section-form.spec.tsx"`
Expected: PASS (5 tests).

- [ ] **Step 5: Write `section-editor.tsx`**

```tsx
// frontend/src/features/custom-sections/components/section-editor.tsx
"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateSection,
  useSections,
  useUpdateSection,
} from "../api/custom-sections-queries";
import type { CustomSectionFormValues } from "../schemas";
import { SectionForm } from "./section-form";

type SectionEditorProps = {
  mode: "create" | "edit";
  sectionId?: number;
};

export function SectionEditor({ mode, sectionId = 0 }: SectionEditorProps) {
  const router = useRouter();
  const sections = useSections();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const editing = mode === "edit";

  if (editing && (!Number.isInteger(sectionId) || sectionId <= 0)) {
    return (
      <ErrorState title="Invalid section" description="The requested section ID is not valid." />
    );
  }

  if (editing && sections.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[480px] max-w-2xl rounded-xl" />
      </div>
    );
  }

  const section = editing ? sections.data?.find((s) => s.id === sectionId) : undefined;

  if (editing && (sections.error || !section)) {
    return (
      <ErrorState
        title="Section unavailable"
        description={sections.error?.message ?? "The section could not be loaded."}
        onRetry={() => void sections.refetch()}
      />
    );
  }

  const defaultValues: CustomSectionFormValues | undefined = section
    ? {
        name: section.name,
        description: section.description ?? "",
        icon: section.icon ?? "",
        fieldSchema: section.fieldSchema.length
          ? section.fieldSchema
          : [{ key: "", label: "", type: "text", required: false }],
      }
    : undefined;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/custom-sections"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to custom sections
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {editing ? "Edit section" : "Add section"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {editing
            ? "Update this custom section and its fields."
            : "Create a custom section with its own set of fields."}
        </p>
      </header>

      <SectionForm
        key={editing ? sectionId : "new"}
        mode={mode}
        defaultValues={defaultValues}
        onSubmit={async (input) => {
          if (editing) {
            await updateSection.mutateAsync({ id: sectionId, input });
            router.push("/custom-sections?updated=1");
            return;
          }
          await createSection.mutateAsync(input);
          router.push("/custom-sections?created=1");
        }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Verify lint passes**

Run: `cd frontend && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/custom-sections/components/section-form.tsx frontend/src/features/custom-sections/components/section-form.spec.tsx frontend/src/features/custom-sections/components/section-editor.tsx
git commit -m "feat(custom-sections): add section form and editor"
```

---

## Task 5: Custom Sections — ItemForm

**Files:**
- Create: `frontend/src/features/custom-sections/components/item-form.tsx`
- Test: `frontend/src/features/custom-sections/components/item-form.spec.tsx`

**Interfaces:**
- Consumes: `buildItemSchema` (Task 1); `FieldSchema` (Task 1).
- Produces: `ItemForm` (props: `fields: FieldSchema[]`, `defaultValues?: Record<string, string>`, `submitLabel: string`, `onSubmit: (data: Record<string, string>) => Promise<void>`, `onCancel: () => void`).

- [ ] **Step 1: Write the failing ItemForm tests**

```tsx
// frontend/src/features/custom-sections/components/item-form.spec.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemForm } from "./item-form";
import type { FieldSchema } from "../types";

const fields: FieldSchema[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "link", label: "Link", type: "url", required: false },
];

const baseProps = {
  fields,
  submitLabel: "Add Item",
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe("ItemForm", () => {
  it("renders an input for each field in the schema", () => {
    render(<ItemForm {...baseProps} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Link")).toBeInTheDocument();
  });

  it("blocks submission when a required text field is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ItemForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Add Item" }));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error when a url field is invalid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ItemForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Title"), "Best Dev");
    await user.type(screen.getByLabelText("Link"), "not-a-url");
    await user.click(screen.getByRole("button", { name: "Add Item" }));
    expect(await screen.findByText("Must be a valid URL")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<ItemForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Title"), "Best Dev");
    await user.click(screen.getByRole("button", { name: "Add Item" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/features/custom-sections/components/item-form.spec.tsx"`
Expected: FAIL — cannot resolve `./item-form`.

- [ ] **Step 3: Write `item-form.tsx`**

```tsx
// frontend/src/features/custom-sections/components/item-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { FieldErrors } from "@/features/auth/components/field-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildItemSchema } from "../schemas";
import type { FieldSchema } from "../types";

type ItemFormProps = {
  fields: FieldSchema[];
  defaultValues?: Record<string, string>;
  submitLabel: string;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
};

const INPUT_TYPE: Record<FieldSchema["type"], string> = {
  text: "text",
  url: "url",
  date: "date",
};

export function ItemForm({ fields, defaultValues, submitLabel, onSubmit, onCancel }: ItemFormProps) {
  const schema = useMemo(() => buildItemSchema(fields), [fields]);
  const initialValues = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.key, defaultValues?.[field.key] ?? ""])),
    [fields, defaultValues],
  );

  const form = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;

  async function submit(values: Record<string, string>) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save item",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={`item-${field.key}`}>
            {field.label}
            {field.required ? <span className="ml-1 text-destructive">*</span> : null}
          </Label>
          <Input
            id={`item-${field.key}`}
            type={INPUT_TYPE[field.type]}
            aria-label={field.label}
            aria-invalid={Boolean(errors[field.key])}
            {...form.register(field.key)}
          />
          <FieldErrors error={errors[field.key]} id={`item-${field.key}-error`} />
        </div>
      ))}

      {errors.root?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
          {form.formState.isSubmitting ? "Saving..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

Note: `FieldErrors` expects a `FieldError`; `errors[field.key]` is typed as `FieldError | undefined` under `Record<string, string>` — compatible.

- [ ] **Step 4: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/features/custom-sections/components/item-form.spec.tsx"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/custom-sections/components/item-form.tsx frontend/src/features/custom-sections/components/item-form.spec.tsx
git commit -m "feat(custom-sections): add dynamic item form"
```

---

## Task 6: Custom Sections — View, Cards, Drawer, Dialogs, Pages, Navigation

**Files:**
- Create: `frontend/src/features/custom-sections/components/delete-section-dialog.tsx`
- Create: `frontend/src/features/custom-sections/components/delete-item-dialog.tsx`
- Create: `frontend/src/features/custom-sections/components/section-card.tsx`
- Create: `frontend/src/features/custom-sections/components/items-drawer.tsx`
- Create: `frontend/src/features/custom-sections/components/sections-view.tsx`
- Create: `frontend/src/app/(dashboard)/custom-sections/page.tsx`
- Create: `frontend/src/app/(dashboard)/custom-sections/new/page.tsx`
- Create: `frontend/src/app/(dashboard)/custom-sections/[id]/edit/page.tsx`
- Modify: `frontend/src/components/layout/navigation.ts`

**Interfaces:**
- Consumes: `useSections`, `useDeleteSection`, `useCreateItem`, `useUpdateItem`, `useDeleteItem` (Task 3); `ItemForm` (Task 5); `SectionEditor` (Task 4); `CustomSection`, `CustomItem` (Task 1).
- Produces: `DeleteSectionDialog`, `DeleteItemDialog`, `SectionCard`, `ItemsDrawer`, `SectionsView`; three route pages; enabled navigation entry.

- [ ] **Step 1: Write `delete-section-dialog.tsx`**

```tsx
// frontend/src/features/custom-sections/components/delete-section-dialog.tsx
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CustomSection } from "../types";

type DeleteSectionDialogProps = {
  section: CustomSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (section: CustomSection) => Promise<void>;
};

export function DeleteSectionDialog({ section, open, onOpenChange, onConfirm }: DeleteSectionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!isDeleting) {
      if (!nextOpen) setError(null);
      onOpenChange(nextOpen);
    }
  }

  async function handleDelete() {
    if (!section) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(section);
      onOpenChange(false);
      toast.success("Section deleted");
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to delete section";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {section?.name ?? "section"}?</DialogTitle>
          <DialogDescription>
            This permanently removes the section and all of its items from your portfolio.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isDeleting} />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 data-icon="inline-start" />
            {isDeleting ? "Deleting..." : "Delete section"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Write `delete-item-dialog.tsx`**

```tsx
// frontend/src/features/custom-sections/components/delete-item-dialog.tsx
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CustomItem } from "../types";

type DeleteItemDialogProps = {
  item: CustomItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: CustomItem) => Promise<void>;
};

export function DeleteItemDialog({ item, open, onOpenChange, onConfirm }: DeleteItemDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!isDeleting) {
      if (!nextOpen) setError(null);
      onOpenChange(nextOpen);
    }
  }

  async function handleDelete() {
    if (!item) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(item);
      onOpenChange(false);
      toast.success("Item deleted");
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to delete item";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this item?</DialogTitle>
          <DialogDescription>This permanently removes the item from the section.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isDeleting} />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 data-icon="inline-start" />
            {isDeleting ? "Deleting..." : "Delete item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Write `section-card.tsx`**

```tsx
// frontend/src/features/custom-sections/components/section-card.tsx
"use client";

import { List, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomSection } from "../types";

type SectionCardProps = {
  section: CustomSection;
  onManageItems: (sectionId: number) => void;
  onDelete: (section: CustomSection) => void;
};

export function SectionCard({ section, onManageItems, onDelete }: SectionCardProps) {
  return (
    <Card className="bg-card/75">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {section.icon ? (
              <span className="text-xs text-muted-foreground">{section.icon}</span>
            ) : null}
            {section.name}
          </CardTitle>
          {section.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{section.description}</p>
          ) : null}
        </div>
        <Badge variant="secondary">
          {section.items.length} {section.items.length === 1 ? "item" : "items"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => onManageItems(section.id)}>
          <List data-icon="inline-start" />
          Manage items
        </Button>
        <Link
          href={`/custom-sections/${section.id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Pencil data-icon="inline-start" />
          Edit
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          aria-label={`Delete ${section.name}`}
          onClick={() => onDelete(section)}
        >
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Write `items-drawer.tsx`**

```tsx
// frontend/src/features/custom-sections/components/items-drawer.tsx
"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCreateItem, useDeleteItem, useUpdateItem } from "../api/custom-sections-queries";
import type { CustomItem, CustomSection } from "../types";
import { DeleteItemDialog } from "./delete-item-dialog";
import { ItemForm } from "./item-form";

type ItemsDrawerProps = {
  section: CustomSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormMode = null | "create" | CustomItem;

function summarize(section: CustomSection, item: CustomItem): string {
  return section.fieldSchema
    .map((field) => `${field.label}: ${item.data[field.key] || "—"}`)
    .join(" • ");
}

export function ItemsDrawer({ section, open, onOpenChange }: ItemsDrawerProps) {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [itemToDelete, setItemToDelete] = useState<CustomItem | null>(null);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setFormMode(null);
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{section?.name ?? "Items"}</SheetTitle>
          <SheetDescription>Manage the items in this section.</SheetDescription>
        </SheetHeader>

        {section ? (
          <div className="space-y-4 p-4">
            {formMode ? (
              <ItemForm
                fields={section.fieldSchema}
                defaultValues={formMode === "create" ? undefined : formMode.data}
                submitLabel={formMode === "create" ? "Add Item" : "Save"}
                onCancel={() => setFormMode(null)}
                onSubmit={async (data) => {
                  if (formMode === "create") {
                    await createItem.mutateAsync({ sectionId: section.id, input: { data } });
                  } else {
                    await updateItem.mutateAsync({ itemId: formMode.id, input: { data } });
                  }
                  setFormMode(null);
                }}
              />
            ) : (
              <>
                <Button onClick={() => setFormMode("create")}>
                  <Plus data-icon="inline-start" />
                  Add Item
                </Button>

                {section.items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No items yet. Add the first one.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <span className="text-sm">{summarize(section, item)}</span>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit item"
                            onClick={() => setFormMode(item)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete item"
                            className="text-destructive"
                            onClick={() => setItemToDelete(item)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        ) : null}
      </SheetContent>

      <DeleteItemDialog
        item={itemToDelete}
        open={itemToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setItemToDelete(null);
        }}
        onConfirm={async (item) => {
          await deleteItem.mutateAsync(item.id);
        }}
      />
    </Sheet>
  );
}
```

- [ ] **Step 5: Write `sections-view.tsx`**

```tsx
// frontend/src/features/custom-sections/components/sections-view.tsx
"use client";

import { Blocks, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteSection, useSections } from "../api/custom-sections-queries";
import type { CustomSection } from "../types";
import { DeleteSectionDialog } from "./delete-section-dialog";
import { ItemsDrawer } from "./items-drawer";
import { SectionCard } from "./section-card";

export function SectionsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sections = useSections();
  const deleteSection = useDeleteSection();
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<CustomSection | null>(null);

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Section created successfully" : "Section updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/custom-sections?${qs}` : "/custom-sections", { scroll: false });
  }, [router, searchParams]);

  if (sections.isPending) {
    return (
      <div role="status" aria-label="Loading custom sections" className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (sections.error) {
    return (
      <ErrorState
        title="Custom sections unavailable"
        description={sections.error.message}
        onRetry={() => void sections.refetch()}
      />
    );
  }

  const data = sections.data ?? [];
  const activeSection = data.find((s) => s.id === activeSectionId) ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Custom Sections
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Build custom sections with your own fields and items.
          </p>
        </div>
        <Link href="/custom-sections/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Section
        </Link>
      </header>

      {data.length === 0 ? (
        <EmptyState
          title="No custom sections yet"
          description="Create your first custom section to add tailored content to your portfolio."
          icon={<Blocks className="size-5" aria-hidden="true" />}
          action={
            <Link href="/custom-sections/new" className={buttonVariants({ size: "lg" })}>
              Add your first section
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onManageItems={setActiveSectionId}
              onDelete={setSectionToDelete}
            />
          ))}
        </div>
      )}

      <ItemsDrawer
        section={activeSection}
        open={activeSectionId !== null}
        onOpenChange={(open) => {
          if (!open) setActiveSectionId(null);
        }}
      />

      <DeleteSectionDialog
        section={sectionToDelete}
        open={sectionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSectionToDelete(null);
        }}
        onConfirm={async (section) => {
          await deleteSection.mutateAsync(section.id);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Write the list page**

```tsx
// frontend/src/app/(dashboard)/custom-sections/page.tsx
"use client";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { SectionsView } from "@/features/custom-sections/components/sections-view";

export default function CustomSectionsPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading custom sections" className="space-y-6">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <SectionsView />
    </Suspense>
  );
}
```

- [ ] **Step 7: Write the new-section page**

```tsx
// frontend/src/app/(dashboard)/custom-sections/new/page.tsx
import { SectionEditor } from "@/features/custom-sections/components/section-editor";

export default function NewCustomSectionPage() {
  return <SectionEditor mode="create" />;
}
```

- [ ] **Step 8: Write the edit-section page**

```tsx
// frontend/src/app/(dashboard)/custom-sections/[id]/edit/page.tsx
import { SectionEditor } from "@/features/custom-sections/components/section-editor";

export default async function EditCustomSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sectionId = Number((await params).id);
  return <SectionEditor mode="edit" sectionId={sectionId} />;
}
```

- [ ] **Step 9: Enable the Custom Sections navigation entry**

In `frontend/src/components/layout/navigation.ts`, replace this line inside the "Content" group:

```typescript
      { label: "Custom Sections", icon: Blocks, disabled: true },
```

with:

```typescript
      { label: "Custom Sections", icon: Blocks, href: "/custom-sections" },
```

- [ ] **Step 10: Run the full custom-sections test suite and lint**

Run: `cd frontend && npm run test:run -- src/features/custom-sections src/app/api/custom-sections`
Expected: PASS (all custom-sections tests green).

Run: `cd frontend && npm run lint`
Expected: PASS.

- [ ] **Step 11: Manually verify the build compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds; `/custom-sections`, `/custom-sections/new`, `/custom-sections/[id]/edit` appear in the route list.

- [ ] **Step 12: Commit**

```bash
git add frontend/src/features/custom-sections/components frontend/src/app/(dashboard)/custom-sections frontend/src/components/layout/navigation.ts
git commit -m "feat(custom-sections): add view, cards, items drawer, pages, and navigation"
```

---

## Task 7: Profile — Types, Schemas, Normalizer

**Files:**
- Create: `frontend/src/features/profile/types.ts`
- Create: `frontend/src/features/profile/schemas.ts`
- Create: `frontend/src/features/profile/server/normalize-profile.ts`
- Test: `frontend/src/features/profile/schemas.test.ts`
- Test: `frontend/src/features/profile/server/normalize-profile.test.ts`

**Interfaces:**
- Consumes: `rewriteUploadUrl` from `@/features/projects/server/normalize-project`.
- Produces: `ProfileData`, `ProfileInput`, `PasswordInput`, `BackendRawImage`, `BackendProfileData` (types); `profileSchema`, `passwordSchema`, `ProfileFormValues`, `PasswordFormValues` (schemas); `normalizeProfile(user, backendUrl)` (normalizer).

- [ ] **Step 1: Write `types.ts`**

```typescript
// frontend/src/features/profile/types.ts

export type ProfileData = {
  id: number;
  email: string;
  username: string | null;
  profilePicture: { id: number; url: string } | null;
};

export type ProfileInput = {
  username?: string;
  email?: string;
  profilePictureId?: number;
};

export type PasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type BackendRawImage = {
  id: number;
  src_path: string;
  f_userId: number;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type BackendProfileData = {
  id: number;
  email: string;
  username: string | null;
  images: BackendRawImage[];
  f_profile_picture: { id: number; f_imagesId: number } | null;
};
```

- [ ] **Step 2: Write the failing schema tests**

```typescript
// frontend/src/features/profile/schemas.test.ts
import { describe, expect, it } from "vitest";
import { profileSchema, passwordSchema } from "./schemas";

describe("profileSchema", () => {
  it("accepts an email with no username", () => {
    expect(profileSchema.safeParse({ email: "a@b.com", username: "" }).success).toBe(true);
  });

  it("accepts a valid username", () => {
    expect(profileSchema.safeParse({ email: "a@b.com", username: "jumael" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(profileSchema.safeParse({ email: "not-an-email", username: "" }).success).toBe(false);
  });

  it("rejects a username shorter than 3 characters", () => {
    expect(profileSchema.safeParse({ email: "a@b.com", username: "ab" }).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  const valid = {
    currentPassword: "OldPass1!",
    newPassword: "NewPass1!",
    confirmPassword: "NewPass1!",
  };

  it("accepts a valid password change", () => {
    expect(passwordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = passwordSchema.safeParse({ ...valid, confirmPassword: "Different1!" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("rejects a weak new password", () => {
    expect(passwordSchema.safeParse({ ...valid, newPassword: "weak", confirmPassword: "weak" }).success).toBe(false);
  });

  it("rejects a missing current password", () => {
    expect(passwordSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd frontend && npm run test:run -- src/features/profile/schemas.test.ts`
Expected: FAIL — cannot resolve `./schemas`.

- [ ] **Step 4: Write `schemas.ts`**

```typescript
// frontend/src/features/profile/schemas.ts
import { z } from "zod";

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional()
    .or(z.literal("")),
  email: z.string().min(1, "Email is required").email("Must be a valid email address"),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Must contain at least one uppercase letter, one number, and one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PasswordFormValues = z.infer<typeof passwordSchema>;
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd frontend && npm run test:run -- src/features/profile/schemas.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Write the failing normalizer tests**

```typescript
// frontend/src/features/profile/server/normalize-profile.test.ts
import { describe, expect, it } from "vitest";
import { normalizeProfile } from "./normalize-profile";
import type { BackendProfileData } from "../types";

const backendUrl = "http://localhost:3000";

const base: BackendProfileData = {
  id: 7,
  email: "user@example.com",
  username: "jumael",
  images: [
    {
      id: 9,
      src_path: "uploads/7/avatar.png",
      f_userId: 7,
      description: null,
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-01T00:00:00.000Z",
    },
  ],
  f_profile_picture: { id: 3, f_imagesId: 9 },
};

describe("normalizeProfile", () => {
  it("resolves the profile picture URL and rewrites it", () => {
    expect(normalizeProfile(base, backendUrl)).toEqual({
      id: 7,
      email: "user@example.com",
      username: "jumael",
      profilePicture: { id: 9, url: "/api/uploads/file/7/avatar.png" },
    });
  });

  it("returns null profilePicture when there is no join row", () => {
    expect(normalizeProfile({ ...base, f_profile_picture: null }, backendUrl).profilePicture).toBeNull();
  });

  it("returns null profilePicture when the referenced image is missing", () => {
    expect(
      normalizeProfile({ ...base, f_profile_picture: { id: 3, f_imagesId: 999 } }, backendUrl).profilePicture,
    ).toBeNull();
  });
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `cd frontend && npm run test:run -- src/features/profile/server/normalize-profile.test.ts`
Expected: FAIL — cannot resolve `./normalize-profile`.

- [ ] **Step 8: Write `normalize-profile.ts`**

```typescript
// frontend/src/features/profile/server/normalize-profile.ts
import { basename } from "path";

import { rewriteUploadUrl } from "@/features/projects/server/normalize-project";
import type { BackendProfileData, ProfileData } from "../types";

// backendUrl: the internal base URL of the NestJS backend (process.env.BACKEND_URL),
// injected by the BFF route so this function stays pure and testable.
export function normalizeProfile(user: BackendProfileData, backendUrl: string): ProfileData {
  let profilePicture: { id: number; url: string } | null = null;

  if (user.f_profile_picture) {
    const image = user.images.find((img) => img.id === user.f_profile_picture!.f_imagesId);
    if (image) {
      const fileName = basename(image.src_path.replace(/\\/g, "/"));
      const rawUrl = `${backendUrl}/uploads/${image.f_userId}/${fileName}`;
      profilePicture = { id: image.id, url: rewriteUploadUrl(rawUrl) };
    }
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    profilePicture,
  };
}
```

- [ ] **Step 9: Run to verify it passes**

Run: `cd frontend && npm run test:run -- src/features/profile/server/normalize-profile.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 10: Commit**

```bash
git add frontend/src/features/profile/types.ts frontend/src/features/profile/schemas.ts frontend/src/features/profile/schemas.test.ts frontend/src/features/profile/server/normalize-profile.ts frontend/src/features/profile/server/normalize-profile.test.ts
git commit -m "feat(profile): add types, schemas, and normalizer"
```

---

## Task 8: Profile — BFF Routes

**Files:**
- Create: `frontend/src/app/api/profile/route.ts`
- Create: `frontend/src/app/api/profile/password/route.ts`
- Test: `frontend/src/app/api/profile/route.test.ts`
- Test: `frontend/src/app/api/profile/password/route.test.ts`

**Interfaces:**
- Consumes: `normalizeProfile` (Task 7); `backendFetch`, `toBffResponse`; `BackendProfileData` (Task 7).
- Produces: GET `/api/profile` (normalized), PUT `/api/profile` (field-mapped update), POST `/api/profile/password` (field-mapped change).

- [ ] **Step 1: Write the failing test for `/api/profile`**

```typescript
// frontend/src/app/api/profile/route.test.ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { GET, PUT } from "./route";

const me = {
  id: 7,
  email: "user@example.com",
  username: "jumael",
  images: [],
  f_profile_picture: null,
};

function put(body: unknown) {
  return PUT(
    new Request("http://localhost/api/profile", { method: "PUT", body: JSON.stringify(body) }),
  );
}

describe("/api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes the current user on GET", async () => {
    backendFetch.mockResolvedValue(Response.json(me));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 7,
      email: "user@example.com",
      username: "jumael",
      profilePicture: null,
    });
    expect(backendFetch).toHaveBeenCalledWith("/auth/me");
  });

  it("passes through a backend error from GET /auth/me on PUT", async () => {
    backendFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));
    const response = await put({ email: "new@example.com" });
    expect(response.status).toBe(401);
  });

  it("rejects an invalid email on PUT", async () => {
    backendFetch.mockResolvedValueOnce(Response.json({ id: 7 }));
    const response = await put({ email: "not-an-email" });
    expect(response.status).toBe(400);
  });

  it("forwards a valid update with backend field names", async () => {
    backendFetch
      .mockResolvedValueOnce(Response.json({ id: 7 }))
      .mockResolvedValueOnce(Response.json({ id: 7 }));
    const response = await put({ username: "newname", profilePictureId: 12 });
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenLastCalledWith("/users/7", {
      method: "PUT",
      body: JSON.stringify({ username: "newname", f_profile_pictureId: 12 }),
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/app/api/profile/route.test.ts"`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 3: Write `/api/profile/route.ts`**

```typescript
// frontend/src/app/api/profile/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeProfile } from "@/features/profile/server/normalize-profile";
import type { BackendProfileData } from "@/features/profile/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

const profileUpdateBffSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  profilePictureId: z.number().int().positive().optional(),
});

export async function GET() {
  const res = await backendFetch("/auth/me");
  if (!res.ok) return toBffResponse(res);
  const user = (await res.json()) as BackendProfileData;
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
  return NextResponse.json(normalizeProfile(user, backendUrl));
}

export async function PUT(request: Request) {
  const meRes = await backendFetch("/auth/me");
  if (!meRes.ok) return toBffResponse(meRes);
  const me = (await meRes.json()) as { id: number };

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateBffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const backendBody: Record<string, unknown> = {};
  if (parsed.data.username !== undefined) backendBody.username = parsed.data.username;
  if (parsed.data.email !== undefined) backendBody.email = parsed.data.email;
  if (parsed.data.profilePictureId !== undefined) {
    backendBody.f_profile_pictureId = parsed.data.profilePictureId;
  }

  return toBffResponse(
    await backendFetch(`/users/${me.id}`, { method: "PUT", body: JSON.stringify(backendBody) }),
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/app/api/profile/route.test.ts"`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing test for `/api/profile/password`**

```typescript
// frontend/src/app/api/profile/password/route.test.ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { POST } from "./route";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/profile/password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("/api/profile/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a missing current password", async () => {
    const response = await post({ newPassword: "NewPass1!" });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects a missing new password", async () => {
    const response = await post({ currentPassword: "OldPass1!" });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards with backend field names", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 200 }));
    const response = await post({ currentPassword: "OldPass1!", newPassword: "NewPass1!" });
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: "OldPass1!", new_password: "NewPass1!" }),
    });
  });

  it("passes through a backend error", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 401 }));
    const response = await post({ currentPassword: "wrong", newPassword: "NewPass1!" });
    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/app/api/profile/password/route.test.ts"`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 7: Write `/api/profile/password/route.ts`**

```typescript
// frontend/src/app/api/profile/password/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

const passwordBffSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = passwordBffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  return toBffResponse(
    await backendFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: parsed.data.currentPassword,
        new_password: parsed.data.newPassword,
      }),
    }),
  );
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/app/api/profile/password/route.test.ts"`
Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
git add frontend/src/app/api/profile
git commit -m "feat(profile): add BFF routes for profile update and password change"
```

---

## Task 9: Profile — API Functions & Query Hooks

**Files:**
- Create: `frontend/src/features/profile/api/profile-api.ts`
- Create: `frontend/src/features/profile/api/profile-queries.ts`

**Interfaces:**
- Consumes: `ProfileData`, `ProfileInput` (Task 7); BFF routes (Task 8); existing `POST /api/uploads`.
- Produces (api): `fetchProfile(): Promise<ProfileData>`, `updateProfile(input): Promise<void>`, `changePassword(input): Promise<void>`, `uploadProfilePicture(file): Promise<void>`.
- Produces (queries): `profileKeys`, `useProfile`, `useUpdateProfile`, `useChangePassword`, `useUploadProfilePicture`.

- [ ] **Step 1: Write `profile-api.ts`**

```typescript
// frontend/src/features/profile/api/profile-api.ts
import type { ApiError } from "@/lib/api/types";
import type { ProfileData, ProfileInput } from "../types";

async function requestJson<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(input, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const error: ApiError =
      payload && typeof payload === "object" && "message" in payload
        ? { ...(payload as ApiError), status: response.status }
        : { status: response.status, message: "Request failed" };
    throw error;
  }
  return payload as T;
}

export function fetchProfile(): Promise<ProfileData> {
  return requestJson<ProfileData>("/api/profile");
}

export async function updateProfile(input: ProfileInput): Promise<void> {
  await requestJson("/api/profile", { method: "PUT", body: JSON.stringify(input) });
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await requestJson("/api/profile/password", { method: "POST", body: JSON.stringify(input) });
}

export async function uploadProfilePicture(file: File): Promise<void> {
  const formData = new FormData();
  formData.set("file", file);
  const { image } = await requestJson<{ message: string; image: { id: number } }>("/api/uploads", {
    method: "POST",
    body: formData,
  });
  await updateProfile({ profilePictureId: image.id });
}
```

- [ ] **Step 2: Write `profile-queries.ts`**

```typescript
// frontend/src/features/profile/api/profile-queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ProfileInput } from "../types";
import {
  changePassword,
  fetchProfile,
  updateProfile,
  uploadProfilePicture,
} from "./profile-api";

export const profileKeys = {
  me: ["profile"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: fetchProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => updateProfile(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.me }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
      ]);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useUploadProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.me }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
      ]);
    },
  });
}
```

- [ ] **Step 3: Verify lint passes**

Run: `cd frontend && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/profile/api
git commit -m "feat(profile): add API functions and query hooks"
```

---

## Task 10: Profile — Components, Page, Navigation

**Files:**
- Create: `frontend/src/features/profile/components/profile-picture-upload.tsx`
- Create: `frontend/src/features/profile/components/profile-form.tsx`
- Create: `frontend/src/features/profile/components/password-form.tsx`
- Create: `frontend/src/features/profile/components/profile-view.tsx`
- Create: `frontend/src/app/(dashboard)/profile/page.tsx`
- Modify: `frontend/src/components/layout/navigation.ts`
- Test: `frontend/src/features/profile/components/profile-form.spec.tsx`
- Test: `frontend/src/features/profile/components/password-form.spec.tsx`

**Interfaces:**
- Consumes: `profileSchema`, `passwordSchema`, `ProfileFormValues`, `PasswordFormValues` (Task 7); `useProfile`, `useUpdateProfile`, `useChangePassword`, `useUploadProfilePicture` (Task 9); `ProfileData` (Task 7).
- Produces: `ProfileForm` (props: `defaultValues`, `onSubmit`), `PasswordForm` (props: `onSubmit`), `ProfilePictureUpload` (props: `profilePicture`, `email`), `ProfileView`; profile page; navigation entry.

- [ ] **Step 1: Write the failing ProfileForm tests**

```tsx
// frontend/src/features/profile/components/profile-form.spec.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfileForm } from "./profile-form";

const baseProps = {
  defaultValues: { email: "user@example.com", username: "jumael" },
  onSubmit: vi.fn(),
};

describe("ProfileForm", () => {
  it("blocks submission when the email is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProfileForm {...baseProps} defaultValues={{ email: "", username: "" }} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submission on an invalid email format", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProfileForm {...baseProps} onSubmit={onSubmit} />);
    const email = screen.getByLabelText("Email");
    await user.clear(email);
    await user.type(email, "not-an-email");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Must be a valid email address")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<ProfileForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/features/profile/components/profile-form.spec.tsx"`
Expected: FAIL — cannot resolve `./profile-form`.

- [ ] **Step 3: Write `profile-form.tsx`**

```tsx
// frontend/src/features/profile/components/profile-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useForm } from "react-hook-form";

import { FieldErrors } from "@/features/auth/components/field-errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileFormValues } from "../schemas";

type ProfileFormProps = {
  defaultValues: ProfileFormValues;
  onSubmit: (input: ProfileFormValues) => Promise<void>;
};

export function ProfileForm({ defaultValues, onSubmit }: ProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;

  async function submit(values: ProfileFormValues) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save profile",
      });
    }
  }

  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle>Profile information</CardTitle>
        <CardDescription>Update your account details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              aria-label="Email"
              aria-invalid={Boolean(errors.email)}
              {...form.register("email")}
            />
            <FieldErrors error={errors.email} id="profile-email-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-username">Username</Label>
            <Input
              id="profile-username"
              aria-label="Username"
              aria-invalid={Boolean(errors.username)}
              {...form.register("username")}
            />
            <FieldErrors error={errors.username} id="profile-username-error" />
          </div>
          {errors.root?.message ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
            {form.formState.isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/features/profile/components/profile-form.spec.tsx"`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing PasswordForm tests**

```tsx
// frontend/src/features/profile/components/password-form.spec.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PasswordForm } from "./password-form";

const baseProps = { onSubmit: vi.fn() };

describe("PasswordForm", () => {
  it("blocks submission when confirmation does not match", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasswordForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Current password"), "OldPass1!");
    await user.type(screen.getByLabelText("New password"), "NewPass1!");
    await user.type(screen.getByLabelText("Confirm new password"), "Different1!");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submission when the new password is too weak", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasswordForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Current password"), "OldPass1!");
    await user.type(screen.getByLabelText("New password"), "weak");
    await user.type(screen.getByLabelText("Confirm new password"), "weak");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Current password is incorrect" });
    render(<PasswordForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Current password"), "WrongPass1!");
    await user.type(screen.getByLabelText("New password"), "NewPass1!");
    await user.type(screen.getByLabelText("Confirm new password"), "NewPass1!");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect");
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `cd frontend && npm run test:run -- "src/features/profile/components/password-form.spec.tsx"`
Expected: FAIL — cannot resolve `./password-form`.

- [ ] **Step 7: Write `password-form.tsx`**

```tsx
// frontend/src/features/profile/components/password-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FieldErrors } from "@/features/auth/components/field-errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordSchema, type PasswordFormValues } from "../schemas";

type PasswordFormProps = {
  onSubmit: (input: PasswordFormValues) => Promise<void>;
};

const emptyValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordForm({ onSubmit }: PasswordFormProps) {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: emptyValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;

  async function submit(values: PasswordFormValues) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
      form.reset(emptyValues);
      toast.success("Password updated");
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to update password",
      });
    }
  }

  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change the password used to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="pw-current">Current password</Label>
            <Input
              id="pw-current"
              type="password"
              aria-label="Current password"
              aria-invalid={Boolean(errors.currentPassword)}
              {...form.register("currentPassword")}
            />
            <FieldErrors error={errors.currentPassword} id="pw-current-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-new">New password</Label>
            <Input
              id="pw-new"
              type="password"
              aria-label="New password"
              aria-invalid={Boolean(errors.newPassword)}
              {...form.register("newPassword")}
            />
            <FieldErrors error={errors.newPassword} id="pw-new-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-confirm">Confirm new password</Label>
            <Input
              id="pw-confirm"
              type="password"
              aria-label="Confirm new password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...form.register("confirmPassword")}
            />
            <FieldErrors error={errors.confirmPassword} id="pw-confirm-error" />
          </div>
          {errors.root?.message ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
            {form.formState.isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `cd frontend && npm run test:run -- "src/features/profile/components/password-form.spec.tsx"`
Expected: PASS (3 tests).

- [ ] **Step 9: Write `profile-picture-upload.tsx`**

```tsx
// frontend/src/features/profile/components/profile-picture-upload.tsx
"use client";

import { LoaderCircle, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUploadProfilePicture } from "../api/profile-queries";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif"]);

type ProfilePictureUploadProps = {
  profilePicture: { id: number; url: string } | null;
  email: string;
};

export function ProfilePictureUpload({ profilePicture, email }: ProfilePictureUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadProfilePicture();
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Only JPEG, PNG, and GIF images are supported");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 5 MB or smaller");
      return;
    }
    try {
      await upload.mutateAsync(file);
    } catch (caught) {
      setError(
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to upload image",
      );
    }
  }

  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle>Profile photo</CardTitle>
        <CardDescription>Shown alongside your public portfolio.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar size="lg">
          {profilePicture ? <AvatarImage src={profilePicture.url} alt="Profile photo" /> : null}
          <AvatarFallback>{email.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            {upload.isPending ? "Uploading..." : "Change photo"}
          </Button>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="sr-only"
            aria-label="Upload profile photo"
            onChange={(event) => {
              void handleFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 10: Write `profile-view.tsx`**

```tsx
// frontend/src/features/profile/components/profile-view.tsx
"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
} from "../api/profile-queries";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";
import { ProfilePictureUpload } from "./profile-picture-upload";

export function ProfileView() {
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  if (profile.isPending) {
    return (
      <div role="status" aria-label="Loading profile" className="max-w-2xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (profile.error || !profile.data) {
    return (
      <ErrorState
        title="Profile unavailable"
        description={profile.error?.message ?? "Your profile could not be loaded."}
        onRetry={() => void profile.refetch()}
      />
    );
  }

  const data = profile.data;

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Profile & Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Manage your account details, photo, and password.
        </p>
      </header>

      <ProfilePictureUpload profilePicture={data.profilePicture} email={data.email} />

      <ProfileForm
        defaultValues={{ email: data.email, username: data.username ?? "" }}
        onSubmit={async (values) => {
          await updateProfile.mutateAsync({
            email: values.email,
            username: values.username ?? "",
          });
          toast.success("Profile updated");
        }}
      />

      <PasswordForm
        onSubmit={async (values) => {
          await changePassword.mutateAsync({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          });
        }}
      />
    </div>
  );
}
```

- [ ] **Step 11: Write the profile page**

```tsx
// frontend/src/app/(dashboard)/profile/page.tsx
"use client";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ProfileView } from "@/features/profile/components/profile-view";

export default function AccountSettingsPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading profile" className="max-w-2xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <ProfileView />
    </Suspense>
  );
}
```

- [ ] **Step 12: Add the Profile navigation entry**

In `frontend/src/components/layout/navigation.ts`:

Add `UserCog` to the lucide import block (keep alphabetical grouping near the other icons), e.g. add the line `  UserCog,` before `type LucideIcon,`.

Then in the "System" group `items` array, add a Profile entry as the first item:

```typescript
  {
    label: "System",
    items: [
      { label: "Profile", icon: UserCog, href: "/profile" },
      { label: "Public API", icon: Globe, disabled: true },
      { label: "Audit Logs", icon: ShieldCheck, disabled: true },
      { label: "Settings", icon: Settings, disabled: true },
    ],
  },
```

- [ ] **Step 13: Run the full profile test suite and lint**

Run: `cd frontend && npm run test:run -- src/features/profile src/app/api/profile`
Expected: PASS (all profile tests green).

Run: `cd frontend && npm run lint`
Expected: PASS.

- [ ] **Step 14: Verify the build compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds; `/profile` appears in the route list.

- [ ] **Step 15: Commit**

```bash
git add frontend/src/features/profile/components frontend/src/app/(dashboard)/profile frontend/src/components/layout/navigation.ts
git commit -m "feat(profile): add profile components, page, and navigation entry"
```

---

## Final Verification

- [ ] **Step 1: Run the entire frontend test suite**

Run: `cd frontend && npm run test:run`
Expected: All tests pass (existing + new Custom Sections and Profile suites).

- [ ] **Step 2: Lint the whole frontend**

Run: `cd frontend && npm run lint`
Expected: No errors.

- [ ] **Step 3: Production build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with `/custom-sections`, `/custom-sections/new`, `/custom-sections/[id]/edit`, and `/profile` routes present.

- [ ] **Step 4: Manual smoke test (dev server)**

Run backend (`cd backend && npm run start:dev`) and frontend (`cd frontend && npm run dev`), then:
1. Sign in, open the sidebar — "Custom Sections" and "Profile" are enabled links.
2. Create a section with two fields (one required text, one optional url); confirm the auto-slug and validation.
3. Open "Manage items", add an item, edit it, delete it.
4. Edit the section, delete the section.
5. On Profile: change the photo, update the email/username, change the password.

---

## Self-Review Notes (author checklist — completed during planning)

**Spec coverage:** Every spec section maps to a task — CS types/schemas/normalizer (T1), CS BFF incl. all 7 endpoints (T2), CS api/queries (T3), SectionForm/editor (T4), ItemForm (T5), view/cards/drawer/dialogs/pages/nav (T6); Profile types/schemas/normalizer (T7), Profile BFF (T8), Profile api/queries (T9), Profile components/page/nav (T10). All spec Testing-Scope items are present as failing-first tests.

**Documented deviations from the spec (each intentional, each preserving existing codebase behavior):**
1. `onSuccess` lives inside the mutation hooks (matches Experience/Projects), overriding spec Global Constraint #3.
2. Custom Sections BFF is passthrough; the client `*-api.ts` normalizes (spec's own BFF code shows passthrough; the pure normalizer is safe on the client). Profile BFF normalizes because its normalizer needs `process.env.BACKEND_URL` + node `path`.
3. Item mutations return `void`; the UI re-derives the active section from the invalidated `["custom-sections"]` list, so no dependency on the backend's item-response shape.
4. Section create/edit use dedicated pages (`/new`, `/[id]/edit`) — the spec's clarified decision (§section-editor note), not dialogs.

**Type consistency:** `CustomSectionFormValues` (from `customSectionSchema`) is assignable to `CustomSectionInput`; `updateSection(id, input: CustomSectionInput)` matches the full-schema BFF PATCH; `ProfileFormValues.username` is `string | undefined`, coerced to `""` before `updateProfile`. Query keys are stable: `["custom-sections"]`, `["profile"]`, `["session"]`, `["dashboard"]`.
