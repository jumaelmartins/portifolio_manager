# Custom Sections & Profile / Account Settings — Design Spec

## Goal

Implement the two remaining Fase 3 frontend features: (1) Custom Sections — a two-level CRUD module where users define sections with dynamic field schemas and manage items per section; (2) Profile / Account Settings — a single page where the authenticated user updates their display info, profile picture, and password.

## Architecture

Both features follow the established BFF + feature slice pattern used by Projects, Experience, Education, and Courses. The browser calls Next.js Route Handlers (`app/api/`), which forward to the NestJS backend using the `pm_session` HttpOnly cookie. Server state is managed with TanStack Query.

## Tech Stack

Next.js 16 App Router, TanStack Query v5, react-hook-form + zod, shadcn/ui, Lucide icons, TypeScript.

---

## Global Constraints

- All feature files go under `frontend/src/features/<module>/` following the slice pattern: `types.ts`, `schemas.ts`, `server/normalize-*.ts`, `api/*-api.ts`, `api/*-queries.ts`, `components/`
- BFF Route Handlers go under `frontend/src/app/api/`; dashboard pages under `frontend/src/app/(dashboard)/`
- TanStack Query v5 syntax: `useMutation({ mutationFn })` — no `onSuccess` inside hook definitions; callers chain `.mutateAsync`
- `"use client"` as the literal first line of every client component and query hook file
- Form components: `<form noValidate>`, `zodResolver`, `criteriaMode: "all"`, `shouldFocusError: true`; root errors in `<p role="alert">`
- BFF validation errors returned as `{ status: 400, message: "...", fieldErrors: z.flattenError(...).fieldErrors }`
- Image URLs from backend use `src_path`; rewrite with `rewriteUploadUrl` from `@/features/projects/server/normalize-project` before returning to the client
- Dashboard page files that use hooks must wrap inner content in `<Suspense>` with a `fallback`
- Navigation: enable Custom Sections and Profile items in `frontend/src/components/layout/navigation.ts` by removing `disabled: true` and adding their `href`
- Tests: Vitest + Testing Library; BFF route test files must start with `// @vitest-environment node`
- Commit message style: `feat(custom-sections):`, `feat(profile):`, `test(...):`

---

## Part 1 — Custom Sections

### Backend Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/custom-sections` | List user's sections (includes items) |
| POST | `/custom-sections` | Create section |
| PATCH | `/custom-sections/:id` | Update section |
| DELETE | `/custom-sections/:id` | Delete section |
| POST | `/custom-sections/:id/items` | Create item in section |
| PATCH | `/custom-sections/items/:itemId` | Update item |
| DELETE | `/custom-sections/items/:itemId` | Delete item |

The backend validates item data against the section's `field_schema` (required fields must be non-empty). The `type` field in the schema is a free-form string — the frontend constrains it to `"text" | "url" | "date"`.

### Data Model

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

// Backend shapes (as received from API)
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

### Schemas

```typescript
// frontend/src/features/custom-sections/schemas.ts

import { z } from "zod";
import type { FieldSchema } from "./types";

export const fieldSchemaItemSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z][a-z0-9_]*$/, "Key must start with a letter and contain only lowercase letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "url", "date"]),
  required: z.boolean().optional(),
});

export const customSectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  fieldSchema: z
    .array(fieldSchemaItemSchema)
    .min(1, "At least one field is required"),
});

export type CustomSectionFormValues = z.infer<typeof customSectionSchema>;

// Dynamically builds a zod schema for item data based on the section's field_schema.
// Required fields must be non-empty strings; url fields must be valid URLs when non-empty.
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
      // text
      validator = field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();
    }
    shape[field.key] = validator;
  }
  return z.object(shape);
}
```

### Normalizer

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
    items: s.items.map(normalizeItem),
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

export function toBackendSectionInput(
  input: CustomSectionInput,
): BackendCustomSectionInput {
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

### BFF Routes

**`frontend/src/app/api/custom-sections/route.ts`** — GET list + POST create section

```typescript
// @vitest-environment node (in test file)
import { z } from "zod";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { NextResponse } from "next/server";
import { customSectionSchema } from "@/features/custom-sections/schemas";
import { toBackendSectionInput } from "@/features/custom-sections/server/normalize-custom-sections";

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

**`frontend/src/app/api/custom-sections/[id]/route.ts`** — PATCH + DELETE section

ID validation: `const id = Number(params.id); if (!Number.isInteger(id) || id <= 0) return 400`

**`frontend/src/app/api/custom-sections/[id]/items/route.ts`** — POST create item

Accepts `{ data: Record<string, string> }`. No Zod validation of field values in the BFF (the backend validates against the schema). Validates that `data` is a non-null object.

**`frontend/src/app/api/custom-sections/items/[itemId]/route.ts`** — PATCH + DELETE item

### API Functions

```typescript
// frontend/src/features/custom-sections/api/custom-sections-api.ts

import type { CustomSection, CustomSectionInput, CustomItemInput } from "../types";
import { normalizeSection } from "../server/normalize-custom-sections";

export async function fetchSections(): Promise<CustomSection[]> { ... }
export async function createSection(input: CustomSectionInput): Promise<CustomSection> { ... }
export async function updateSection(id: number, input: Partial<CustomSectionInput>): Promise<CustomSection> { ... }
export async function deleteSection(id: number): Promise<void> { ... }
export async function createItem(sectionId: number, input: CustomItemInput): Promise<CustomSection> { ... }
export async function updateItem(itemId: number, input: CustomItemInput): Promise<void> { ... }
export async function deleteItem(itemId: number): Promise<void> { ... }
```

### Query Hooks

```typescript
// frontend/src/features/custom-sections/api/custom-sections-queries.ts
// "use client"

export const customSectionKeys = {
  all: ["custom-sections"] as const,
};

// Hooks: useSections, useCreateSection, useUpdateSection, useDeleteSection,
// useCreateItem, useUpdateItem, useDeleteItem
// All mutations invalidate ["custom-sections"]; create/delete also invalidate ["dashboard"]
```

### Components

**`section-form.tsx`** — Section create/edit form

Fields:
- Name (required, aria-label "Section name")
- Description (optional, aria-label "Description")
- Icon (optional, aria-label "Icon name", hint: "e.g. Star, Trophy, Award")
- Field schema builder:
  - Renders a row per field in `fieldSchema` array (managed with `useFieldArray` from react-hook-form)
  - Each row: Label input, Key input (auto-populated from slugified label, editable), Type select (text / URL / Date), Required checkbox, Remove button (disabled if it's the last field)
  - "Add field" button appends `{ key: "", label: "", type: "text", required: false }`
  - Auto-slug: when label changes, update key to `label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")`; stop auto-updating key once user manually edits it

Submit button: "Create Section" (create mode) / "Save changes" (edit mode)
Cancel: Link back to `/custom-sections`

**`section-editor.tsx`** — Thin wrapper used from `sections-view.tsx` for inline dialog (create) or from `/custom-sections/new` and `/custom-sections/[id]/edit` pages.

Actually, to keep the pattern consistent with other modules: section create/edit use **dedicated pages** (`/custom-sections/new` and `/custom-sections/[id]/edit`), not dialogs. The `section-form.tsx` is rendered inside those pages.

**`items-drawer.tsx`** — Drawer lateral for managing a section's items

- Opens when user clicks "Manage Items" on a section card
- Header: section name + "Add Item" button
- Body: list of items; each item shows a summary of its field values (e.g., "Title: Senior Dev • Company: Google")
- Each item has Edit (pencil icon, opens inline item-form) and Delete (trash icon, opens delete-item-dialog) actions
- If no items: empty state "No items yet. Add the first one."
- Item form appears inline in the drawer (not a nested dialog): clicking "Add Item" or the edit pencil replaces the item list with the item form; "Cancel" returns to the list

**`item-form.tsx`** — Dynamic item form

- Receives `fieldSchema: FieldSchema[]` and optional `defaultValues`
- Builds zod schema at render time with `buildItemSchema(fieldSchema)`
- For each field in schema:
  - `type: "text"` → `<Input type="text" aria-label={field.label} />`
  - `type: "url"` → `<Input type="url" aria-label={field.label} />`
  - `type: "date"` → `<Input type="date" aria-label={field.label} />`
  - Shows required indicator and field error below each input
- Submit: "Add Item" (create) / "Save" (edit)
- Root error in `<p role="alert">` on submission failure

**`sections-view.tsx`** — Main list component

- Loading: skeleton cards
- Error: error state with retry
- Empty: empty state with icon `Layout` (Lucide), heading "No custom sections yet", description, "Add your first section" link to `/custom-sections/new`
- Loaded: grid/list of `SectionCard` components + "Add Section" button
- Manages `activeSectionId` state — non-null when drawer is open
- `<ItemsDrawer>` rendered at page level, open when `activeSectionId !== null`

**`section-card.tsx`** — Card for a single section

- Shows: icon (text, displayed as `<span>`), name, description (truncated), item count badge
- "Manage Items" button → sets `activeSectionId`
- Edit link → `/custom-sections/{id}/edit`
- Delete button → opens `<DeleteSectionDialog>`

**`delete-section-dialog.tsx`** — Standard delete confirm dialog (same pattern as delete-experience-dialog)

**`delete-item-dialog.tsx`** — Standard delete confirm dialog for items

### Pages

**`frontend/src/app/(dashboard)/custom-sections/page.tsx`**

```typescript
"use client";
import { Suspense } from "react";
import { SectionsView } from "@/features/custom-sections/components/sections-view";

function SectionsPage() { return <SectionsView />; }

export default function CustomSectionsPage() {
  return <Suspense fallback={<div>Loading...</div>}><SectionsPage /></Suspense>;
}
```

**`frontend/src/app/(dashboard)/custom-sections/new/page.tsx`** — Create section page (similar to experience new page)

**`frontend/src/app/(dashboard)/custom-sections/[id]/edit/page.tsx`** — Edit section page (async server component, `await params`)

---

## Part 2 — Profile / Account Settings

### Backend Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/auth/me` | Get current user (with profile picture) |
| PUT | `/users/:id` | Update username, email, or profilePictureId |
| POST | `/auth/change-password` | Change password (requires current password) |
| POST | `/upload/users/:userId` | Upload image (existing; returns `{ image: { id, url } }`) |

### Data Model

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

// Backend shape from GET /auth/me (via UsersRepository.findById with Prisma includes)
// f_profile_picture is the join table row — it does NOT embed the image URL.
// The actual image data lives in user.images[]. The normalizer cross-references them.
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

### Schemas

```typescript
// frontend/src/features/profile/schemas.ts

import { z } from "zod";

export const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional().or(z.literal("")),
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

### Normalizer

```typescript
// frontend/src/features/profile/server/normalize-profile.ts

import { basename } from "path";
import { rewriteUploadUrl } from "@/features/projects/server/normalize-project";
import type { BackendProfileData, ProfileData } from "../types";

// backendUrl: the internal base URL of the NestJS backend (process.env.BACKEND_URL).
// Required to construct the image URL from src_path, mirroring what the backend's
// presentImage() helper does. Injected by the BFF route so this function stays testable.
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

### BFF Routes

**`frontend/src/app/api/profile/route.ts`**

```typescript
// Internal BFF schema — all fields optional; accepts any combination.
// The frontend's profileSchema (which requires email) is stricter and runs on the client.
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
  // 1. Get current user to obtain userId (same pattern as POST /api/uploads)
  const meRes = await backendFetch("/auth/me");
  if (!meRes.ok) return toBffResponse(meRes);
  const me = (await meRes.json()) as { id: number };

  // 2. Validate input
  const body = await request.json().catch(() => null);
  const parsed = profileUpdateBffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  // 3. Map to backend field names
  const backendBody: Record<string, unknown> = {};
  if (parsed.data.username !== undefined) backendBody.username = parsed.data.username;
  if (parsed.data.email !== undefined) backendBody.email = parsed.data.email;
  if (parsed.data.profilePictureId !== undefined) backendBody.f_profile_pictureId = parsed.data.profilePictureId;

  return toBffResponse(
    await backendFetch(`/users/${me.id}`, { method: "PUT", body: JSON.stringify(backendBody) }),
  );
}
```

**`frontend/src/app/api/profile/password/route.ts`**

```typescript
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  // Validate: currentPassword and newPassword required
  // Map: { currentPassword, newPassword } → { current_password, new_password }
  return toBffResponse(
    await backendFetch("/auth/change-password", { method: "POST", body: JSON.stringify({
      current_password: body.currentPassword,
      new_password: body.newPassword,
    }) }),
  );
}
```

**Profile picture upload:** reuse the existing `POST /api/uploads` BFF (no new route needed). The `useUploadProfilePicture` hook chains: upload image → extract `image.id` → call `updateProfile({ profilePictureId: image.id })`.

### Query Hooks

```typescript
// frontend/src/features/profile/api/profile-queries.ts
// "use client"

export const profileKeys = {
  me: ["profile"] as const,
};

// useProfile() — query key ["profile"], calls GET /api/profile, normalizes response
// useUpdateProfile() — mutation, invalidates ["profile"] + ["session"]
// useChangePassword() — mutation (no invalidation needed)
// useUploadProfilePicture() — mutation: POST /api/uploads → PUT /api/profile with profilePictureId
//                            invalidates ["profile"]
```

### Components

**`profile-picture-upload.tsx`**

- Renders: circular avatar (shows current photo or initials placeholder), "Change photo" button below
- Clicking button → `<input type="file" accept="image/jpeg,image/png,image/gif">` click (hidden input via ref)
- On file selected → calls `uploadProfilePicture(file)` mutation → shows loading state on avatar during upload
- On success → profile query invalidated → avatar updates

**`profile-form.tsx`**

- Fields: Email (required), Username (optional)
- defaultValues populated from `useProfile()` data
- Submit: "Save changes"
- Shows root error `<p role="alert">` on failure
- Shows success toast on completion (same `toast.success` pattern)

**`password-form.tsx`**

- Fields: Current password, New password, Confirm new password (all `type="password"`)
- Submit: "Update password"
- Resets form on success
- Root error on failure (e.g., wrong current password)
- Success: `toast.success("Password updated")`

**`profile-view.tsx`**

- Three card sections stacked vertically:
  1. **Profile photo** card — `<ProfilePictureUpload />`
  2. **Profile info** card — `<ProfileForm />`
  3. **Password** card — `<PasswordForm />`
- Loading state: skeleton cards while `useProfile()` is pending
- Error state: error message with retry

### Page

**`frontend/src/app/(dashboard)/profile/page.tsx`**

```typescript
"use client";
import { Suspense } from "react";
import { ProfileView } from "@/features/profile/components/profile-view";

function ProfilePage() { return <ProfileView />; }

export default function AccountSettingsPage() {
  return <Suspense fallback={<div>Loading...</div>}><ProfilePage /></Suspense>;
}
```

### Navigation

- Enable "Custom Sections" and "Profile" (or "Settings") sidebar items in `frontend/src/components/layout/navigation.ts`

---

## Testing Scope

### Custom Sections

**BFF route tests** (`// @vitest-environment node`):
- `GET /api/custom-sections` — passthrough to backend
- `POST /api/custom-sections` — rejects missing name (400), rejects empty fieldSchema (400), passes valid section to backend, passes through backend error
- `PATCH /api/custom-sections/[id]` — rejects invalid ID (400), passes valid update, passes through backend error
- `DELETE /api/custom-sections/[id]` — rejects invalid ID (400), forwards delete
- `POST /api/custom-sections/[id]/items` — rejects missing data (400), forwards item
- `PATCH + DELETE /api/custom-sections/items/[itemId]` — reject invalid itemId, forward

**Schema tests:**
- `customSectionSchema`: accepts valid section, rejects missing name, rejects invalid key pattern, rejects empty fieldSchema array
- `buildItemSchema`: required text field errors when empty, required url field errors on invalid URL, optional fields pass when empty

**Normalizer tests:**
- `normalizeSection`: maps `field_schema → fieldSchema`, maps `items`, handles empty items array
- `normalizeItem`: maps `section_id → sectionId`
- `toBackendSectionInput`: maps `fieldSchema → field_schema`, omits empty description/icon

**`SectionForm` component tests:**
- Blocks submit when name is empty
- "Add field" appends a new field row
- Auto-populates key from label ("My Award" → "my_award")
- Rejects invalid key pattern on submit
- Rejects empty fieldSchema (shows "At least one field is required")
- Shows root error on submit failure

**`ItemForm` component tests:**
- Renders inputs for each field in schema
- Required text field blocks submit when empty
- URL field shows error on invalid URL
- Shows root error on submit failure

### Profile

**BFF route tests:**
- `GET /api/profile` — passthrough
- `PUT /api/profile` — passes through backend error from GET /auth/me; forwards valid update with field mapping; rejects invalid email
- `POST /api/profile/password` — rejects missing currentPassword or newPassword; forwards with field name mapping; passes through backend error

**Schema tests:**
- `profileSchema`: valid with email only, valid with username, rejects invalid email, rejects username shorter than 3 chars
- `passwordSchema`: rejects mismatched passwords, rejects weak newPassword, rejects missing currentPassword

**Normalizer tests:**
- `normalizeProfile`: maps `f_profile_picture` with `rewriteUploadUrl`; handles null profile picture

**`ProfileForm` component tests:**
- Blocks submit when email is empty
- Blocks submit on invalid email format
- Shows root error on submit failure

**`PasswordForm` component tests:**
- Blocks submit when confirmPassword does not match newPassword
- Blocks submit when newPassword is too weak
- Shows root error on submit failure (e.g., wrong current password)
