# Design: Experience, Education & Courses Frontend

**Date:** 2026-06-29  
**Status:** Approved  
**Scope:** Frontend-only — all three backend CRUD APIs are already implemented.

---

## Overview

Add admin pages for Experience, Education, and Courses to the Next.js dashboard. The three modules share identical UX structure and differ only in field names and whether description is required. Each follows the same pattern established by the Projects module: separate create/edit pages, a BFF route handler layer, and a feature slice.

---

## Architecture

Each module produces:

```
features/{module}/
  types.ts                         # Backend* raw types + normalized frontend types
  schemas.ts                       # Zod form schema
  server/normalize-{module}.ts     # Backend → frontend normalization + toBackendInput
  api/{module}-api.ts              # Typed fetch functions (CRUD)
  api/{module}-queries.ts          # TanStack Query hooks
  components/
    {module}-form.tsx              # Controlled form (create + edit modes)
    {module}-editor.tsx            # Orchestrates queries + form + router
    {module}-view.tsx              # List page view
    {module}-table.tsx             # Table component
    delete-{module}-dialog.tsx     # Delete confirmation dialog

app/api/{module}/
  route.ts                         # BFF: GET (list) + POST (create)
  [id]/route.ts                    # BFF: GET (single) + PATCH (update) + DELETE

app/(dashboard)/{module}/
  page.tsx                         # List page ("use client", Suspense wrapper)
  new/page.tsx                     # Create page (delegates to Editor)
  [id]/edit/page.tsx               # Edit page (delegates to Editor, awaits params)
```

---

## Field Mapping

| Frontend field | Experience backend field | Education backend field | Courses backend field |
|---|---|---|---|
| `id` | `id` | `id` | `id` |
| `title` | `tile` (backend typo) | `title` | `title` |
| `companyName` / `institutionName` | `company_name` | `institution_name` | `institution_name` |
| `description` | `description` (required) | `description` (optional) | `description` (optional) |
| `startDate` | `start_date` | `start_date` | `start_date` |
| `endDate` | `end_date` (optional) | `end_date` (optional) | `end_date` (optional) |
| `current` | `current` (boolean) | `current` (boolean) | `current` (boolean) |
| `createdAt` / `updatedAt` | `created_at` / `updated_at` | same | same |

---

## Zod Schema

Shared shape for all three modules (field names vary per module):

```ts
z.object({
  title:           z.string().trim().min(1, "Required").max(120),
  companyName:     z.string().trim().min(1, "Required").max(120),  // or institutionName
  description:     z.string().trim().min(1, "Required").max(5000), // optional for education/courses: .optional()
  startDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Required"),
  endDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  current:         z.boolean(),
}).refine(
  (data) => data.current || Boolean(data.endDate),
  { message: "End date required when not current", path: ["endDate"] }
)
```

---

## Form Design

Single-column Card layout (no sidebar panel needed — no images or multi-selects).

Fields in order:
1. **Title** — text input (role/position for Experience; degree/course name for others)
2. **Company / Institution** — text input
3. **Description** — textarea; required in Experience, optional in Education/Courses
4. **Start Date** — `<input type="date">`
5. **"Currently working / studying here"** — checkbox
6. **End Date** — `<input type="date">`; disabled and cleared when `current === true`

Actions Card (below the form):
- Primary button: "Create Experience" / "Save Changes"
- Secondary link: "Cancel" → back to list

---

## List View

Table with columns:
| Column | Content |
|---|---|
| Title / Entity | title + company/institution name |
| Period | "Jan 2022 – Mar 2024" or "Jan 2022 – Present" |
| Updated | relative or formatted date |
| Actions | Edit (link) + Delete (button → dialog) |

- No search or filter controls (typical entry count < 20)
- Empty state with CTA to create first entry
- `toast.success` on create/edit success (via `?created=1` / `?updated=1` query params, same as Projects)
- Items sorted by `start_date` descending (most recent first) — sorting done on the frontend from the API array

---

## BFF Route Handlers

Mirrors the Projects BFF pattern exactly:

- `GET /api/{module}` — proxy to backend, normalize array
- `POST /api/{module}` — validate with Zod, proxy to backend, normalize response
- `GET /api/{module}/[id]` — proxy, normalize single item
- `PATCH /api/{module}/[id]` — validate, proxy, normalize
- `DELETE /api/{module}/[id]` — proxy, return `{ id }`

All routes forward the `pm_session` JWT cookie via `backendFetch` (inherited automatically).

---

## Sidebar Navigation

In `frontend/src/components/layout/navigation.ts`, enable the three disabled entries:

```ts
{ label: "Experience", icon: Briefcase, href: "/experience" },   // was disabled: true
{ label: "Education",  icon: GraduationCap, href: "/education" }, // was disabled: true
{ label: "Courses",    icon: BookOpen, href: "/courses" },        // was disabled: true
```

---

## TanStack Query Cache Invalidation

On every successful create/update/delete mutation, invalidate:
1. The module's own list key (e.g. `["experience"]`)
2. The item detail key (e.g. `["experience", id]`) on update/delete
3. `["dashboard"]` — so the dashboard overview stats stay accurate

This matches the Projects mutation pattern.

---

## Error Handling

- List/editor data fetch errors → `<ErrorState>` with retry
- Form submit errors → `form.setError("root", ...)` displayed inline
- Delete errors → `toast.error` inside the dialog (same as DeleteProjectDialog)
- Invalid ID in edit route → `<ErrorState>` with "Invalid ID" message

---

## Testing

Unit tests for schemas (valid + invalid cases, `current`/`endDate` refinement) and normalize functions, following the same test file naming as Projects (`schemas.test.ts`, `normalize-{module}.test.ts`). No new E2E tests in scope.

---

## Out of Scope

- Drag-and-drop reordering of items
- Server-side sorting (frontend sort is sufficient at this scale)
- Custom Sections, Profile Settings (separate future specs)
