# Public Portfolio Site (Fase 4) — Design

**Status:** Approved (design), pending spec review.
**Date:** 2026-07-01
**Depends on:** existing backend `PublicModule` (`GET /public/users/:userId`), existing frontend BFF + feature-slice conventions (Projects/Experience/Education/Courses/Custom-Sections/Profile).

## Goal

Build the public-facing portfolio site in the Next.js 16 frontend that renders a
user's portfolio (hero, projects, experience, education, courses, custom
sections) from the read-only backend Public endpoint, with basic SEO and mobile
responsiveness. **Frontend-only**: no backend changes.

## Architecture

A new unauthenticated route `app/(public)/portfolio/[userId]/page.tsx` (numeric
`userId`) renders as a React Server Component. It fetches the whole portfolio in
one call from the backend Public endpoint, normalizes the payload into clean
view types, and renders section components that reuse the existing admin design
system (tokens, fonts, `@base-ui` primitives) in a public layout with no admin
shell. Rendering is ISR: the fetch is tagged `portfolio:{userId}` with a
time-based `revalidate` safety net, and admin edits trigger on-demand
revalidation from the BFF write handlers.

## Tech Stack

Next.js 16 App Router (Server Components, `generateMetadata`, `revalidateTag`,
`notFound`), `jose` (`decodeJwt`, already a dependency), Vitest + Testing
Library, Playwright. No new dependencies.

## Global Constraints

- **Frontend-only.** No backend, schema, or migration changes. The only edits to
  existing files are adding `revalidatePortfolio()` calls inside existing BFF
  write route handlers.
- **Next.js 16.** Dynamic route `params` is a `Promise` — always `await params`.
  Consult `node_modules/next/dist/docs/` before writing App Router code
  (per `frontend/AGENTS.md`).
- **Public route stays public.** Do not add `/portfolio` to `src/proxy.ts`
  matcher or `protectedPrefixes`. The current middleware matcher
  (`/dashboard/:path*`, `/projects/:path*`, `/login`, `/register`,
  `/verify-email`) already excludes it.
- **Reuse the admin design system.** Same design tokens, fonts, and UI
  primitives (`Avatar`, `Badge`, card styling). No new visual identity.
- **Test files use `.test.ts(x)`.** Vitest `include` collects only `*.test.*`;
  a `.spec.*` file collects zero tests.
- Feature-slice order: `types.ts` → `server/normalize-*.ts` → `server/get-*.ts`
  → `components/`.

## Backend Contract (existing, read-only — do not change)

`GET /public/users/:userId` (no auth). Returns 404 (`User Not Found`) when the
user does not exist. On success the exact payload shape (from
`backend/src/modules/public/public.service.ts`) is:

```jsonc
{
  "id": 1,
  "username": "jumael",          // string | null
  "role":   { "id": 1, "role": "OWNER" },
  "status": { "id": 1, "status": "ACTIVE" },
  "f_profile_picture": {         // object | null
    "id": 3,
    "f_images": { "id": 9, "src_path": "uploads/1/file-123.png" }
  },
  "f_projects": [{
    "id": 5, "title": "…", "description": "…",
    "repo_url": "…|null", "live_url": "…|null",
    "category": { "id": 2, "category": "Web" },
    "technologies": [{ "id": 7, "tech": "React" }],
    "f_images": { "id": 9, "src_path": "uploads/1/file-123.png" }, // object | null
    "created_at": "ISO", "updated_at": "ISO"
  }],
  "f_education":  [{ "id","title","institution_name","description","start_date","end_date","created_at","updated_at" }],
  "f_courses":    [{ "id","title","institution_name","description","start_date","end_date","created_at","updated_at" }],
  "f_experience": [{ "id","tile","company_name","description","start_date","end_date","created_at","updated_at" }],
  "custom_sections": [{
    "id","name","description|null","icon|null",
    "field_schema": [{ "key","label","type":"text|url|date","required?" }],
    "order|null",
    "items": [{ "id","data": { "<key>":"<value>" }, "order|null" }]   // ordered by order asc
  }],
  "created_at": "ISO", "updated_at": "ISO"
}
```

**Payload quirks the normalizer MUST handle:**
- `f_experience[].tile` is a typo for `title` — map it to `title`.
- Images here are **raw `src_path`** (relative, e.g. `uploads/1/file.png`), NOT a
  presented absolute `url`. `rewriteUploadUrl` (Projects slice) expects a full
  URL and will NOT work on `src_path`. Use a dedicated transform (below).
- `f_projects[].f_images` and `f_profile_picture` are single objects or `null`.
- `custom_sections[].items[].data` is `Record<string,string>` keyed by
  `field_schema[].key`.
- Only `username`, `role`, and avatar are available for the hero — there is no
  bio/headline/email field.

## Image URLs

The frontend already serves upload files publicly and same-origin via
`app/api/uploads/file/[...path]/route.ts` (which proxies to the backend
`/uploads/...` static assets with `authenticated=false`; the backend exposes
`/uploads/` unauthenticated via `useStaticAssets`).

Transform (in the public normalizer):

```ts
// "uploads/1/file.png"  ->  "/api/uploads/file/1/file.png"
function publicUploadUrl(srcPath: string): string {
  return `/api/uploads/file/${srcPath.replace(/^\/?uploads\//, "")}`;
}
```

For `openGraph.images` (social scrapers need an absolute URL) prefix
`process.env.NEXT_PUBLIC_APP_URL`:
`` `${process.env.NEXT_PUBLIC_APP_URL}${publicUploadUrl(srcPath)}` ``.

## File Structure

```
frontend/src/
  app/(public)/
    layout.tsx                          # minimal public chrome + footer (no admin shell)
    portfolio/[userId]/
      page.tsx                          # Server Component: getPublicPortfolio + render + generateMetadata
      not-found.tsx                     # "Portfolio not found"
      error.tsx                         # client error boundary (network/backend failure)
  features/public-portfolio/
    types.ts                            # PublicPortfolio + Backend* raw types + FieldSchema (reused)
    server/
      get-portfolio.ts                  # getPublicPortfolio(userId): tagged fetch -> normalize | null
      normalize-portfolio.ts            # pure mapper (unit-tested); publicUploadUrl; formatDateRange
    components/
      portfolio-hero.tsx                # avatar + username + role
      portfolio-nav.tsx                 # sticky anchor nav (only for non-empty sections)
      section-shell.tsx                 # shared heading/anchor id/spacing wrapper
      projects-section.tsx              # cards: title, desc, tech badges, repo/live links, cover
      experience-section.tsx            # entries: title, company, date range, desc
      education-section.tsx             # entries: title, institution, date range, desc
      courses-section.tsx               # entries: title, institution, date range, desc
      custom-sections.tsx               # dynamic renderer driven by field_schema (text/url/date)
  lib/api/revalidate.ts                 # revalidatePortfolio()
```

## View Types (`features/public-portfolio/types.ts`)

```ts
export type PublicPortfolio = {
  id: number;
  username: string | null;
  role: string;                 // from role.role
  avatarUrl: string | null;     // publicUploadUrl or null
  projects: PublicProject[];
  experience: PublicExperience[];
  education: PublicEducation[];
  courses: PublicCourse[];
  customSections: PublicCustomSection[];
};

export type PublicProject = {
  id: number; title: string; description: string;
  repositoryUrl: string | null; liveUrl: string | null;
  category: string | null; technologies: string[];
  coverUrl: string | null;
};
export type PublicExperience = {
  id: number; title: string; company: string; description: string;
  startDate: string; endDate: string | null;   // raw ISO; formatted at render
};
export type PublicEducation = { id: number; title: string; institution: string; description: string; startDate: string; endDate: string | null };
export type PublicCourse     = { id: number; title: string; institution: string; description: string; startDate: string; endDate: string | null };
export type PublicCustomSection = {
  id: number; name: string; description: string | null; icon: string | null;
  fields: FieldSchema[];                        // FieldSchema { key,label,type,required? }
  items: { id: number; data: Record<string, string> }[];
};
```

`Backend*` raw types mirror the payload above (incl. `tile`, `src_path`,
`field_schema`, `institution_name`, `company_name`).

## Data Flow

```
GET /portfolio/1
  page.tsx: const { userId } = await params
    getPublicPortfolio(userId):
      const res = await fetch(`${process.env.BACKEND_URL ?? "http://localhost:3000"}/public/users/${userId}`,
        { next: { tags: [`portfolio:${userId}`], revalidate: 3600 } })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(...)            // -> error.tsx
      return normalizePortfolio(await res.json())
    if (!portfolio) notFound()                     // -> not-found.tsx
    render Hero + Nav + non-empty sections
```

- Use plain `fetch` (not `backendFetch`, which forces `cache: "no-store"` and
  cannot carry Next fetch tags). No auth header needed — the endpoint is public.
- `generateMetadata({ params })` calls the same `getPublicPortfolio` (Next
  dedups identical tagged fetches within a request).

## Section Rendering

- **Hero:** `Avatar` (avatarUrl, fallback to initials from username) + `username`
  (fallback "Portfolio") + `role`.
- **Nav:** sticky anchor bar linking to sections that have content; hidden if no
  section has content.
- **Projects:** responsive card grid — cover image (if any), title, description,
  category + technology `Badge`s, repo/live links (only when the URL is present),
  sorted by `created_at` desc.
- **Experience/Education/Courses:** vertical list/timeline — title, company or
  institution, formatted date range (`endDate === null` → "Present"), description.
- **Custom sections:** for each section render `name` + optional `description`,
  then each item as a definition list — iterate `fields`, read `data[field.key]`,
  render by `type`: `text` → text, `url` → link (`<a target="_blank" rel="noopener noreferrer">`),
  `date` → formatted date. Skip missing/empty values. Sections and items are
  already ordered by the backend.
- **Empty handling:** a section with an empty array is not rendered. If every
  section is empty, only the hero shows.

Date formatting: add a small `formatDateRange(start, end)` in the slice (unless
an existing shared helper is found during planning). It must not crash on
invalid/empty dates.

## On-Demand Revalidation (`lib/api/revalidate.ts`)

```ts
import "server-only";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

export async function revalidatePortfolio(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;
  const sub = decodeJwt(token).sub;
  if (!sub) return;
  revalidateTag(`portfolio:${sub}`);
}
```

Call it in each **mutating** BFF route handler after a successful backend write
(`response.ok`), before returning `toBffResponse`. Affected handlers:

- `app/api/projects/**` — create, update, delete
- `app/api/experience/**`, `app/api/education/**`, `app/api/courses/**` — create, update, delete
- `app/api/custom-sections/**` — section create/update/delete, item create/update/delete
- `app/api/profile/route.ts` (PUT) and the profile picture upload path (`app/api/uploads` when used for the avatar, plus the subsequent profile update)

Password change does not affect the public portfolio and is excluded. Uploading
an image only affects the portfolio once it is linked (cover/avatar) via a
project/profile update, so revalidating on those update handlers is sufficient;
revalidating on the upload handler too is harmless and acceptable.

`revalidate: 3600` on the fetch is the fallback if a trigger is ever missed.

## SEO (`generateMetadata`)

- `title`: `` `${username ?? "Portfolio"} — Portfolio` ``
- `description`: role plus a short summary (e.g. `` `${role} · ${projects.length} projects` ``)
- `openGraph`: `{ type: "profile", url: ${NEXT_PUBLIC_APP_URL}/portfolio/${userId}, title, description, images: avatarUrl ? [absolute avatar URL] : [] }`
- `twitter`: `{ card: "summary_large_image", title, description }`
- Indexing allowed (no `noindex`).
- On 404 the page calls `notFound()`; metadata for the missing case can be
  minimal (the not-found UI governs).

## Error Handling

- Backend 404 → `getPublicPortfolio` returns `null` → `notFound()` → `not-found.tsx`.
- Network error / non-404 non-ok → thrown → `error.tsx` client boundary with a
  retry.
- Normalizer tolerates `null`/missing optional fields (avatar, cover, urls,
  description, dates) without throwing.

## Testing

**Unit (Vitest, `.test.ts(x)`):**
- `normalize-portfolio.test.ts`: `tile`→`title`; `src_path`→`/api/uploads/file/...`;
  null avatar/cover; technologies/category mapping; custom section fields+items;
  empty arrays; `formatDateRange` incl. `endDate` null → "Present".
- Component tests per section: renders provided fixture content, links appear
  only when URLs present, empty section omitted, custom renderer handles
  text/url/date and skips empty values.
- `revalidate.test.ts`: mock `next/cache`, `next/headers` cookies, and
  `decodeJwt`; asserts `revalidateTag("portfolio:<sub>")` is called with a token
  and is a no-op without one.

**E2E (Playwright, smoke):**
- Visit `/portfolio/:id` for a seeded user → hero + at least one section visible.
- Missing user → 404.
- Mobile viewport renders without overflow.
Deeper content E2E flows remain Fase 5.

## Out of Scope (future)

- Username slug URLs (`/portfolio/[username]`) — needs a backend lookup endpoint.
- Bio/headline hero content — needs a backend field + migration.
- Backend-driven webhook revalidation.
- Per-section deep E2E coverage (Fase 5).
- Theming/visual redesign distinct from the admin design system.
