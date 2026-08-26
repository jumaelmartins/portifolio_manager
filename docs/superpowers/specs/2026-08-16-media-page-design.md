# Media Page — Design

> **Date:** 2026-08-16
> **Phase:** Fase 5 — Polimento e Extras (nova feature: gestão de mídia)
> **Status:** Design approved — pending implementation plan

## Goal

Give the authenticated user a dedicated **Media** page in the admin panel to
manage every image they have uploaded — a gallery grid where they can upload,
delete (safely), rename/describe, see where each image is used, and
search/filter — instead of only reaching images inside the project cover
picker.

## Scope

In scope:

1. **Gallery grid page** at `/media` (enable the pre-stubbed, disabled nav item).
2. **List** all of the user's images with thumbnail, description and usage.
3. **Upload** new images (reuse existing flow).
4. **Delete** with **in-use protection** (block + report where used; fix the
   orphaned-file bug).
5. **Edit description** (rename/describe) — inline on the grid.
6. **Usage display** — which projects use the image as cover + whether it is the
   profile picture.
7. **Search/filter** — client-side by description; filter to unused images.

**Out of scope (YAGNI):**

- **No Prisma migration.** `f_images.description` already exists; usage is
  derived from existing relations. No new columns.
- **No soft-delete / trash for images** (unlike content entities). Delete stays
  hard, but is now guarded against in-use.
- **No cascade delete** of images when a project is deleted (unchanged).
- **No bulk multi-select** actions (single-image actions only).
- **No server-side pagination.** Client-side list like the other dashboard
  pages; revisit only if image counts grow large.
- **No cropping / editing pixels**, no folders/tags, no drag-reorder.

## Context (current state)

Verified against the codebase (2026-08-16):

- **Upload:** `POST /upload/users/:userId` (`uploads.controller.ts`), guards
  `JwtAuthGuard, ActiveUserGuard` + ownership (`sub === userId` or SYSADMIN).
  Multer stores at `uploads/<userId>/<file>`, 5 MB limit, jpg/jpeg/png/gif only.
  Persists an `f_images` row (`src_path`, `f_userId`); `description` is **never
  set on upload** (always `null`).
- **List:** `GET /images` (`images.controller.ts`) → `findByUser(sub)` — the
  current user's own images. `GET /images/:id` → `findOwned` (404 if not owned).
- **Delete:** `DELETE /upload/:imageId` (`uploads.controller.ts`), ownership
  guarded, calls `ImagesService.delete` → `fs.unlink(src_path)` **then**
  `repository.delete(id)`. **Bugs:** (a) no in-use check → deleting a cover /
  profile image hits a raw Prisma `P2003` FK Restrict; (b) unlink happens
  **before** the DB delete, so on FK failure the file is already gone (orphaned
  DB row with missing file).
- **Presenter:** `common/presenters/image.presenter.ts` `presentImage(image,
  baseUrl)` → `{ id, description, url, created_at, updated_at }`, URL built as
  `<baseUrl>/uploads/<f_userId>/<basename>`.
- **Relations** (`schema.prisma`): `f_images.f_projects f_projects[]` (one image
  can be cover for many projects), `f_images.f_profile_picture
  f_profile_picture?`. Both relations declare no `onDelete` → default Restrict.
  `f_projects.f_imagesId Int?` nullable cover.
- **Frontend BFF:** `GET /api/images` (list → `normalizeImage`), `POST
  /api/uploads` (upload), `DELETE /api/uploads/:id` (delete), `GET
  /api/uploads/file/*` (serve proxy). No `PATCH` route for images.
- **`normalizeImage`** (`features/projects/server/normalize-project.ts`) →
  `ImageOption { id, description, url, createdAt, updatedAt }`;
  `rewriteUploadUrl` rewrites backend `/uploads/...` to the `/api/uploads/file/...`
  proxy.
- **`MediaPicker`** (`features/projects/components/media-picker.tsx`) is a
  presentational grid (select cover, upload, per-tile delete) fed a preloaded
  `images` list; used only inside the project form via `project-editor.tsx`
  (`useImages/useUploadImage/useDeleteImage`).
- **Profile picture:** upload-only card (`features/profile/...`), links via `PUT
  /users/:id { f_profile_pictureId }`.
- **Nav:** `components/layout/navigation.ts:51` already has a **disabled**
  `{ label: "Media", icon: ImageIcon, disabled: true }` in the "Content" group.
  Dashboard pages live at `app/(dashboard)/<name>/page.tsx`.

## Decisions

| Decision | Choice |
|---|---|
| Approach | Extend existing `images` / `uploads` modules; new `features/media` frontend slice. No new backend module. |
| List endpoint | **Reuse & extend `GET /images`** to include `usage`. MediaPicker ignores the extra field. |
| Usage shape | `usage: { projects: [{ id, title }], isProfilePicture: boolean }`. In-use = `projects.length > 0 || isProfilePicture`. |
| In-use for delete | Count **all** referencing projects (incl. archived/soft-deleted) + profile picture, since the FK exists regardless of soft-delete state. |
| Delete-in-use | Backend pre-checks; if in use → `409 ConflictException` with a message naming the usage; file preserved. |
| Delete ordering fix | DB `delete()` **first**, then `fs.unlink` (best-effort). Removes the orphaned-file window. |
| Description edit | New **`PATCH /images/:id { description }`**, ownership-guarded; new `UpdateImageDto`. Upload still leaves description `null` (set later on the Media page). |
| Migration | **None.** |
| Layout | Gallery grid; hover actions (edit description inline, delete); usage badges. |
| Search/filter | Client-side (description contains; "unused only" toggle). |

## Architecture & Data Flow

```
/media page (server component)
  └─ MediaView (client)
       ├─ useMediaImages()  ──►  GET /api/images  ──►  GET /images (+usage)
       ├─ useUploadImage()  ──►  POST /api/uploads ──►  POST /upload/users/:id
       ├─ useUpdateImageDescription() ─► PATCH /api/images/:id ─► PATCH /images/:id
       └─ useDeleteImage()  ──►  DELETE /api/uploads/:id ──► DELETE /upload/:id
                                   (409 if in use → toast lists usage)
```

## Backend changes

**No migration.**

1. **`images.repository.ts`** — `findByUser` includes usage relations:
   `f_projects: { select: { id: true, title: true } }` and
   `f_profile_picture: { select: { id: true } }`. Add `findOwned`-style loading
   of the same relations for the delete check (or a dedicated
   `findWithUsage(id)`).
2. **Presenter** — add `presentImageWithUsage(image, baseUrl)` (or extend
   `presentImage`) returning the base fields plus
   `usage: { projects: [{ id, title }], isProfilePicture }`. `GET /images` uses
   it. (Single-image `GET /images/:id` may keep the base presenter.)
3. **`UpdateImageDto`** — `{ description?: string | null }`
   (`@ValidateIf` for `undefined`, `@IsString`, `@MaxLength(200)`;
   allow `null`/empty string to clear).
4. **`PATCH /images/:id`** on `images.controller.ts` — guards
   `JwtAuthGuard, ActiveUserGuard`; `findOwned(id, sub)` (404/403);
   `repository.updateDescription(id, description)`; returns the presented image.
5. **`ImagesService.delete` hardening** — load the image with usage; if
   `projects.length > 0 || isProfilePicture` → `ConflictException` naming usage
   (e.g. `"Image is in use by 2 project(s) and the profile picture"`). Else
   `repository.delete(id)` **then** `fs.unlink` (best-effort, warn on failure).
   Ownership check stays in the controller.

## Frontend changes

1. **`features/media/`** slice:
   - `types.ts` — `MediaImage = ImageOption & { usage: { projects: {id,title}[]; isProfilePicture: boolean } }`.
   - `server/normalize-media.ts` — map backend image (+usage) → `MediaImage`
     (reuse `rewriteUploadUrl`).
   - `api/media-api.ts` — `getMedia()` (`/api/images`),
     `updateDescription(id, description)` (`PATCH /api/images/:id`),
     `deleteImage(id)` (`/api/uploads/:id`), `uploadImage(file)` (`/api/uploads`).
   - `hooks` (React Query) — `useMediaImages`, `useUpdateImageDescription`,
     `useDeleteImage`, `useUploadImage`; invalidate media query + toast on
     success / 409.
2. **BFF**:
   - Extend `GET /api/images` normalizer to carry `usage`.
   - New `app/api/images/[id]/route.ts` — `PATCH` (description), ownership via
     forwarded JWT; `revalidatePortfolio()` on success.
   - Delete reuses `DELETE /api/uploads/:id`; surface the backend 409 message.
3. **Page & components** (`app/(dashboard)/media/page.tsx` + `features/media/components/`):
   - `MediaView` — grid of `MediaCard`s, upload button, search box, "unused only"
     filter; loading/error/empty states matching the projects page.
   - `MediaCard` — thumbnail, description (inline edit on hover/click), usage
     badges ("2 projects", "Profile"), delete (confirm; on 409 toast the usage).
4. **Nav** — `navigation.ts:51`: set `href: "/media"`, drop `disabled`.

## Error handling

- **Delete in use** → 409 blocked, file preserved, UI toast lists usage.
- **Ownership** → 404/403 (unchanged pattern) on list/patch/delete.
- **Upload** → keep 5 MB + jpg/jpeg/png/gif validation (client + server).
- **Description** → max length validation; empty/null clears it.

## Testing plan (TDD)

**Backend:**
- `images.repository` `findByUser` includes usage relations.
- presenter emits `usage` shape.
- `UpdateImageDto` validation (accepts string/empty/null, rejects over-length).
- `PATCH /images/:id` — updates description; 404/403 on non-owned.
- `ImagesService.delete` — throws `Conflict` when referenced by a project or the
  profile picture; deletes row then unlinks when unused; **DB delete precedes
  unlink**.

**Frontend:**
- `normalize-media` maps usage + rewrites url.
- BFF `PATCH /api/images/:id` forwards + normalizes.
- `MediaView` / `MediaCard` — renders grid, inline description edit submits,
  delete-in-use surfaces the 409 message, search filters, "unused only" filters,
  usage badges render.
- nav renders Media enabled linking `/media`.

**E2E:** deferred (project convention).

## Open questions

- None blocking. Description capped at **200 chars** (validated both layers).
