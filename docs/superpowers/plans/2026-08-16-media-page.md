# Media Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin **Media** page — a gallery grid to list, upload, safely delete, describe, and inspect usage of the user's uploaded images.

**Architecture:** Extend the existing backend `images`/`uploads` modules (add usage to the list, a description `PATCH`, and an in-use guard on delete) and add a self-contained `features/media` frontend slice with a new `/media` route. No new Prisma migration — `f_images.description` already exists and usage is derived from existing relations.

**Tech Stack:** NestJS + Prisma (backend, Jest), Next.js 16 App Router + React Query + Vitest/Testing Library (frontend).

**Spec:** `docs/superpowers/specs/2026-08-16-media-page-design.md`

## Global Constraints

- **No Prisma migration.** Do not touch `schema.prisma` or `prisma/migrations/`.
- Backend tests: `npx jest <path>` from `backend/` (cwd is already `backend/` in this session; otherwise `cd backend`).
- Frontend tests: `npx vitest run <path>` from `frontend/`.
- Image description max length: **200** chars, validated on both layers.
- Delete-in-use returns HTTP **409** with a human message; the file is **not** unlinked.
- On delete of an unused image, the DB row is removed **before** the file is unlinked (fixes the orphaned-file bug).
- Ownership is enforced on every images endpoint (list is JWT-derived; patch/delete check `f_userId === sub`).
- Follow existing patterns: query-key objects, `Suspense` page + client content component, `backendFetch`/`toBffResponse`/`revalidatePortfolio` in BFF routes.

---

### Task 1: Backend — image list carries usage

**Files:**
- Modify: `backend/src/modules/images/repository/images.repository.ts`
- Modify: `backend/src/common/presenters/image.presenter.ts`
- Modify: `backend/src/modules/images/images.service.ts`
- Test: `backend/src/common/presenters/image.presenter.spec.ts` (exists), `backend/src/modules/images/images.service.spec.ts` (exists)

**Interfaces:**
- Produces:
  - `imageWithUsageInclude` (const) and `type ImageWithUsage = Prisma.f_imagesGetPayload<{ include: typeof imageWithUsageInclude }>` exported from `images.repository.ts`.
  - `ImagesRepository.findByUser(id: number): Promise<ImageWithUsage[]>` (return type widened).
  - `presentImageWithUsage(image: ImageWithUsage, publicBaseUrl: string)` → base fields plus `usage: { projects: { id: number; title: string }[]; isProfilePicture: boolean }`.

- [ ] **Step 1: Write the failing presenter test**

Add to `backend/src/common/presenters/image.presenter.spec.ts`:

```typescript
import { presentImageWithUsage } from './image.presenter';

describe('presentImageWithUsage', () => {
  it('adds usage derived from project and profile-picture relations', () => {
    const image = {
      id: 5,
      description: 'cover',
      src_path: 'uploads/1/cover.png',
      f_userId: 1,
      created_at: new Date('2026-06-01T00:00:00.000Z'),
      updated_at: new Date('2026-06-01T00:00:00.000Z'),
      f_projects: [{ id: 2, title: 'Portfolio' }],
      f_profile_picture: { id: 9 },
    };

    const result = presentImageWithUsage(image as never, 'http://localhost:3000');

    expect(result.usage).toEqual({
      projects: [{ id: 2, title: 'Portfolio' }],
      isProfilePicture: true,
    });
    expect(result.url).toBe('http://localhost:3000/uploads/1/cover.png');
  });

  it('reports an unused image', () => {
    const image = {
      id: 6,
      description: null,
      src_path: 'uploads/1/x.png',
      f_userId: 1,
      created_at: new Date(),
      updated_at: new Date(),
      f_projects: [],
      f_profile_picture: null,
    };

    const result = presentImageWithUsage(image as never, 'http://localhost:3000');

    expect(result.usage).toEqual({ projects: [], isProfilePicture: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/common/presenters/image.presenter.spec.ts`
Expected: FAIL — `presentImageWithUsage` is not exported.

- [ ] **Step 3: Implement the presenter**

Append to `backend/src/common/presenters/image.presenter.ts`:

```typescript
type ImageWithUsageInput = f_images & {
  f_projects: { id: number; title: string }[];
  f_profile_picture: { id: number } | null;
};

export function presentImageWithUsage(
  image: ImageWithUsageInput,
  publicBaseUrl: string,
) {
  return {
    ...presentImage(image, publicBaseUrl),
    usage: {
      projects: image.f_projects.map((project) => ({
        id: project.id,
        title: project.title,
      })),
      isProfilePicture: image.f_profile_picture !== null,
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/common/presenters/image.presenter.spec.ts`
Expected: PASS.

- [ ] **Step 5: Add the repository include + widen `findByUser`**

In `backend/src/modules/images/repository/images.repository.ts`, add the import and const, and change `findByUser`:

```typescript
import { Prisma, f_images } from '@prisma/client';

export const imageWithUsageInclude = {
  f_projects: { select: { id: true, title: true } },
  f_profile_picture: { select: { id: true } },
} satisfies Prisma.f_imagesInclude;

export type ImageWithUsage = Prisma.f_imagesGetPayload<{
  include: typeof imageWithUsageInclude;
}>;
```

```typescript
async findByUser(id: number): Promise<ImageWithUsage[]> {
  return await this.prismaService.f_images.findMany({
    where: { f_userId: id },
    include: imageWithUsageInclude,
  });
}
```

- [ ] **Step 6: Write the failing service test**

Add to `backend/src/modules/images/images.service.spec.ts` (inside the existing `describe`, matching its setup — mock repository returns images with relations):

```typescript
it('presents each listed image with its usage', async () => {
  imagesRepository.findByUser.mockResolvedValue([
    {
      id: 5,
      description: null,
      src_path: 'uploads/1/a.png',
      f_userId: 1,
      created_at: new Date(),
      updated_at: new Date(),
      f_projects: [{ id: 2, title: 'Portfolio' }],
      f_profile_picture: null,
    },
  ]);

  const result = await service.findByUser(1);

  expect(result[0].usage).toEqual({
    projects: [{ id: 2, title: 'Portfolio' }],
    isProfilePicture: false,
  });
});
```

> If `images.service.spec.ts` does not already expose `imagesRepository` as a jest-mocked object, mirror its existing mock setup (a `{ findByUser: jest.fn(), findById: jest.fn(), delete: jest.fn() }` passed to `new ImagesService(repo, config)`), adding `updateDescription` and `saveImage` mocks as needed.

- [ ] **Step 7: Run test to verify it fails**

Run: `npx jest src/modules/images/images.service.spec.ts`
Expected: FAIL — `findByUser` still uses `presentImage`, no `usage` key.

- [ ] **Step 8: Update the service to use the usage presenter**

In `backend/src/modules/images/images.service.ts`, import `presentImageWithUsage` and change `findByUser`:

```typescript
import {
  presentImage,
  presentImageWithUsage,
} from '../../common/presenters/image.presenter';
```

```typescript
async findByUser(id: number) {
  const images = await this.imagesRepository.findByUser(id);
  const baseUrl = this.configService.get<string>(
    'BACKEND_PUBLIC_URL',
    'http://localhost:3000',
  );
  return images.map((image) => presentImageWithUsage(image, baseUrl));
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx jest src/modules/images src/common/presenters`
Expected: PASS (all).

- [ ] **Step 10: Commit**

```bash
git add backend/src/modules/images backend/src/common/presenters
git commit -m "feat(images): include usage (projects + profile picture) in the image list"
```

---

### Task 2: Backend — in-use-guarded delete (fixes orphaned file)

**Files:**
- Modify: `backend/src/modules/images/repository/images.repository.ts`
- Modify: `backend/src/modules/images/images.service.ts`
- Test: `backend/src/modules/images/images.service.spec.ts`

**Interfaces:**
- Consumes: `imageWithUsageInclude`, `ImageWithUsage` (Task 1).
- Produces: `ImagesRepository.findWithUsage(id: number): Promise<ImageWithUsage | null>`. `ImagesService.delete` now throws `ConflictException` when the image is referenced.

- [ ] **Step 1: Write the failing tests**

Add to `backend/src/modules/images/images.service.spec.ts`:

```typescript
import { ConflictException } from '@nestjs/common';

describe('delete', () => {
  it('blocks deletion of an image used by a project', async () => {
    imagesRepository.findWithUsage.mockResolvedValue({
      id: 5,
      src_path: 'uploads/1/a.png',
      f_userId: 1,
      f_projects: [{ id: 2, title: 'Portfolio' }],
      f_profile_picture: null,
    });

    await expect(service.delete(5)).rejects.toBeInstanceOf(ConflictException);
    expect(imagesRepository.delete).not.toHaveBeenCalled();
  });

  it('blocks deletion of the profile picture', async () => {
    imagesRepository.findWithUsage.mockResolvedValue({
      id: 5,
      src_path: 'uploads/1/a.png',
      f_userId: 1,
      f_projects: [],
      f_profile_picture: { id: 9 },
    });

    await expect(service.delete(5)).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes the row before unlinking an unused image', async () => {
    const order: string[] = [];
    imagesRepository.findWithUsage.mockResolvedValue({
      id: 5,
      src_path: 'uploads/1/a.png',
      f_userId: 1,
      f_projects: [],
      f_profile_picture: null,
    });
    imagesRepository.delete.mockImplementation(async () => {
      order.push('db');
    });
    const unlink = jest
      .spyOn(await import('fs/promises'), 'unlink')
      .mockImplementation(async () => {
        order.push('unlink');
      });

    await service.delete(5);

    expect(order).toEqual(['db', 'unlink']);
    unlink.mockRestore();
  });
});
```

> Add `findWithUsage: jest.fn()` to the repository mock in this file's setup.

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/modules/images/images.service.spec.ts`
Expected: FAIL — `findWithUsage` undefined / delete does not throw / wrong order.

- [ ] **Step 3: Add the repository method**

In `images.repository.ts`:

```typescript
async findWithUsage(id: number): Promise<ImageWithUsage | null> {
  return await this.prismaService.f_images.findUnique({
    where: { id },
    include: imageWithUsageInclude,
  });
}
```

- [ ] **Step 4: Rewrite `ImagesService.delete`**

Replace the `delete` method in `images.service.ts` with:

```typescript
async delete(id: number) {
  const image = await this.imagesRepository.findWithUsage(id);
  if (!image) {
    throw new ForbiddenException('Image does not exist');
  }

  const projectCount = image.f_projects.length;
  const isProfilePicture = image.f_profile_picture !== null;
  if (projectCount > 0 || isProfilePicture) {
    const parts: string[] = [];
    if (projectCount > 0) parts.push(`${projectCount} project(s)`);
    if (isProfilePicture) parts.push('the profile picture');
    throw new ConflictException(`Image is in use by ${parts.join(' and ')}`);
  }

  await this.imagesRepository.delete(id);
  try {
    const fs = await import('fs/promises');
    await fs.unlink(image.src_path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('file already deleted:', message);
  }
  return { message: 'successfull deleted image!' };
}
```

Add `ConflictException` to the `@nestjs/common` import.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest src/modules/images/images.service.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/images
git commit -m "feat(images): guard delete against in-use images and delete row before file"
```

---

### Task 3: Backend — PATCH /images/:id description

**Files:**
- Create: `backend/src/modules/images/dto/update-image.dto.ts`
- Create: `backend/src/modules/images/dto/update-image.dto.spec.ts`
- Modify: `backend/src/modules/images/repository/images.repository.ts`
- Modify: `backend/src/modules/images/images.service.ts`
- Modify: `backend/src/modules/images/images.controller.ts`
- Test: `backend/src/modules/images/images.service.spec.ts`, `backend/src/modules/images/images.controller.spec.ts`

**Interfaces:**
- Produces:
  - `UpdateImageDto { description?: string | null }`.
  - `ImagesRepository.updateDescription(id: number, description: string | null): Promise<f_images>`.
  - `ImagesService.updateDescription(id: number, userId: number, description: string | null)` → presented image; `NotFoundException` if not owned.
  - `PATCH /images/:id` controller handler.

- [ ] **Step 1: Write the failing DTO test**

Create `backend/src/modules/images/dto/update-image.dto.spec.ts`:

```typescript
import { validate } from 'class-validator';
import { UpdateImageDto } from './update-image.dto';

const build = (data: Record<string, unknown>) =>
  validate(Object.assign(new UpdateImageDto(), data));

describe('UpdateImageDto', () => {
  it('accepts a description string', async () => {
    await expect(build({ description: 'My cover' })).resolves.toEqual([]);
  });

  it('accepts null to clear the description', async () => {
    await expect(build({ description: null })).resolves.toEqual([]);
  });

  it('accepts an omitted description', async () => {
    await expect(build({})).resolves.toEqual([]);
  });

  it('rejects a description over 200 chars', async () => {
    const errors = await build({ description: 'a'.repeat(201) });
    expect(errors.map((e) => e.property)).toContain('description');
  });

  it('rejects a non-string description', async () => {
    const errors = await build({ description: 42 });
    expect(errors.map((e) => e.property)).toContain('description');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/modules/images/dto/update-image.dto.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the DTO**

Create `backend/src/modules/images/dto/update-image.dto.ts`:

```typescript
import { IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateImageDto {
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(200)
  description?: string | null;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest src/modules/images/dto/update-image.dto.spec.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing service test**

Add to `images.service.spec.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';

describe('updateDescription', () => {
  it('updates the description of an owned image', async () => {
    imagesRepository.findById.mockResolvedValue({
      id: 5,
      f_userId: 1,
      src_path: 'uploads/1/a.png',
      description: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    imagesRepository.updateDescription.mockResolvedValue({
      id: 5,
      f_userId: 1,
      src_path: 'uploads/1/a.png',
      description: 'New',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const result = await service.updateDescription(5, 1, 'New');

    expect(imagesRepository.updateDescription).toHaveBeenCalledWith(5, 'New');
    expect(result.description).toBe('New');
  });

  it('rejects updating an image the user does not own', async () => {
    imagesRepository.findById.mockResolvedValue({
      id: 5,
      f_userId: 2,
      src_path: 'uploads/2/a.png',
      description: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await expect(service.updateDescription(5, 1, 'New')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(imagesRepository.updateDescription).not.toHaveBeenCalled();
  });
});
```

> Add `updateDescription: jest.fn()` to the repository mock setup.

- [ ] **Step 6: Run to verify it fails**

Run: `npx jest src/modules/images/images.service.spec.ts`
Expected: FAIL — `service.updateDescription` is not a function.

- [ ] **Step 7: Implement repository + service methods**

In `images.repository.ts`:

```typescript
async updateDescription(
  id: number,
  description: string | null,
): Promise<f_images> {
  return await this.prismaService.f_images.update({
    where: { id },
    data: { description },
  });
}
```

In `images.service.ts`:

```typescript
async updateDescription(
  id: number,
  userId: number,
  description: string | null,
) {
  const image = await this.imagesRepository.findById(id);
  if (!image || image.f_userId !== userId) {
    throw new NotFoundException('Image not found');
  }
  const updated = await this.imagesRepository.updateDescription(
    id,
    description ?? null,
  );
  return this.present(updated);
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx jest src/modules/images/images.service.spec.ts`
Expected: PASS.

- [ ] **Step 9: Add the controller handler + test**

In `images.controller.ts`, add `Body`, `Patch` to the imports, import `UpdateImageDto`, and add:

```typescript
@Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateImageDto,
  @Req() req: AuthenticatedRequest,
) {
  return this.imagesService.updateDescription(
    id,
    Number(req.user.sub),
    dto.description ?? null,
  );
}
```

Add to `images.controller.spec.ts` (mirror its existing service-mock setup):

```typescript
it('forwards a description update to the service with the caller id', async () => {
  service.updateDescription.mockResolvedValue({ id: 5, description: 'New' });

  await controller.update(5, { description: 'New' }, {
    user: { sub: 1 },
  } as never);

  expect(service.updateDescription).toHaveBeenCalledWith(5, 1, 'New');
});
```

> Add `updateDescription: jest.fn()` to the service mock in `images.controller.spec.ts`.

- [ ] **Step 10: Run to verify controller + module compile and pass**

Run: `npx jest src/modules/images`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add backend/src/modules/images
git commit -m "feat(images): PATCH /images/:id to edit description (owner-guarded)"
```

---

### Task 4: Frontend — image usage types + normalizer

**Files:**
- Modify: `frontend/src/features/projects/types.ts`
- Modify: `frontend/src/features/projects/server/normalize-project.ts`
- Create: `frontend/src/features/media/types.ts`
- Test: `frontend/src/features/projects/server/normalize-project.test.ts`

**Interfaces:**
- Produces:
  - `ImageUsage = { projects: { id: number; title: string }[]; isProfilePicture: boolean }` (in `projects/types.ts`).
  - `ImageOption.usage?: ImageUsage`; `BackendImage.usage?: {...}`.
  - `normalizeImage` always returns a populated `usage` (defaults to `{ projects: [], isProfilePicture: false }`).
  - `MediaImage = ImageOption & { usage: ImageUsage }` (in `media/types.ts`).

- [ ] **Step 1: Write the failing normalizer test**

Add to `frontend/src/features/projects/server/normalize-project.test.ts`:

```typescript
import { normalizeImage } from "./normalize-project";

describe("normalizeImage", () => {
  it("maps usage and rewrites the upload url", () => {
    const result = normalizeImage({
      id: 5,
      description: "cover",
      url: "http://localhost:3000/uploads/1/cover.png",
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-01T00:00:00.000Z",
      usage: { projects: [{ id: 2, title: "Portfolio" }], isProfilePicture: true },
    });

    expect(result.url).toBe("/api/uploads/file/1/cover.png");
    expect(result.usage).toEqual({
      projects: [{ id: 2, title: "Portfolio" }],
      isProfilePicture: true,
    });
  });

  it("defaults usage to empty when the backend omits it", () => {
    const result = normalizeImage({
      id: 6,
      description: null,
      url: "http://localhost:3000/uploads/1/x.png",
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-01T00:00:00.000Z",
    });

    expect(result.usage).toEqual({ projects: [], isProfilePicture: false });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/projects/server/normalize-project.test.ts`
Expected: FAIL — `usage` undefined / type error on `usage` in the input.

- [ ] **Step 3: Extend the types**

In `frontend/src/features/projects/types.ts` add:

```typescript
export type ImageUsage = {
  projects: { id: number; title: string }[];
  isProfilePicture: boolean;
};
```

Add `usage?: ImageUsage;` to `ImageOption`, and to `BackendImage` add:

```typescript
  usage?: {
    projects: { id: number; title: string }[];
    isProfilePicture: boolean;
  };
```

- [ ] **Step 4: Update `normalizeImage`**

In `normalize-project.ts`:

```typescript
export function normalizeImage(image: BackendImage): ImageOption {
  return {
    id: image.id,
    description: image.description,
    url: rewriteUploadUrl(image.url),
    createdAt: image.created_at,
    updatedAt: image.updated_at,
    usage: image.usage
      ? {
          projects: image.usage.projects,
          isProfilePicture: image.usage.isProfilePicture,
        }
      : { projects: [], isProfilePicture: false },
  };
}
```

- [ ] **Step 5: Create the media type**

Create `frontend/src/features/media/types.ts`:

```typescript
import type { ImageOption, ImageUsage } from "@/features/projects/types";

export type MediaImage = ImageOption & { usage: ImageUsage };
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx vitest run src/features/projects/server/normalize-project.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/projects/types.ts frontend/src/features/projects/server/normalize-project.ts frontend/src/features/projects/server/normalize-project.test.ts frontend/src/features/media/types.ts
git commit -m "feat(media): image usage types and normalizer mapping"
```

---

### Task 5: Frontend — media api, queries, and PATCH BFF route

**Files:**
- Create: `frontend/src/features/media/api/media-api.ts`
- Create: `frontend/src/features/media/api/media-queries.ts`
- Create: `frontend/src/app/api/images/[id]/route.ts`
- Create: `frontend/src/app/api/images/[id]/route.test.ts`

**Interfaces:**
- Consumes: `MediaImage` (Task 4); `requestJson`, `uploadImage`, `deleteImage`, `UploadImageResult` from `@/features/projects/api/project-api`.
- Produces:
  - `getMedia(): Promise<MediaImage[]>`, `updateImageDescription(id, description): Promise<ImageOption>`.
  - `mediaKeys`, `useMediaImages()`, `useUpdateImageDescription()`, `useUploadImage()`, `useDeleteImage()`.
  - `PATCH /api/images/:id`.

- [ ] **Step 1: Write the failing BFF route test**

Create `frontend/src/app/api/images/[id]/route.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch, revalidatePortfolio } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  revalidatePortfolio: vi.fn(),
}));

vi.mock("@/lib/api/backend", () => ({ backendFetch }));
vi.mock("@/lib/api/revalidate", () => ({ revalidatePortfolio }));

import { PATCH } from "./route";

const context = (id: string) => ({ params: Promise.resolve({ id }) });

describe("PATCH /api/images/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("forwards the description and normalizes the response", async () => {
    backendFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 5,
          description: "New",
          url: "http://localhost:3000/uploads/1/a.png",
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
        }),
        { status: 200 },
      ),
    );

    const response = await PATCH(
      new Request("http://x/api/images/5", {
        method: "PATCH",
        body: JSON.stringify({ description: "New" }),
      }),
      context("5"),
    );
    const body = await response.json();

    expect(backendFetch).toHaveBeenCalledWith("/images/5", {
      method: "PATCH",
      body: JSON.stringify({ description: "New" }),
    });
    expect(body.url).toBe("/api/uploads/file/1/a.png");
    expect(revalidatePortfolio).toHaveBeenCalled();
  });

  it("rejects an invalid id", async () => {
    const response = await PATCH(
      new Request("http://x/api/images/abc", { method: "PATCH" }),
      context("abc"),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects a description over 200 chars", async () => {
    const response = await PATCH(
      new Request("http://x/api/images/5", {
        method: "PATCH",
        body: JSON.stringify({ description: "a".repeat(201) }),
      }),
      context("5"),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run "src/app/api/images/[id]/route.test.ts"`
Expected: FAIL — `./route` has no `PATCH` export.

- [ ] **Step 3: Implement the BFF route**

Create `frontend/src/app/api/images/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeImage } from "@/features/projects/server/normalize-project";
import type { BackendImage } from "@/features/projects/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";

const descriptionSchema = z.object({
  description: z.string().max(200).nullable().optional(),
});

type ImageRouteContext = { params: Promise<{ id: string }> };

async function readId(context: ImageRouteContext) {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: ImageRouteContext) {
  const id = await readId(context);
  if (!id) {
    return NextResponse.json(
      { status: 400, message: "Invalid image ID" },
      { status: 400 },
    );
  }

  const parsed = descriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Invalid image data" },
      { status: 400 },
    );
  }

  const response = await backendFetch(`/images/${id}`, {
    method: "PATCH",
    body: JSON.stringify(parsed.data),
  });
  if (!response.ok) {
    return toBffResponse(response);
  }

  await revalidatePortfolio();
  return NextResponse.json(
    normalizeImage((await response.json()) as BackendImage),
    { status: response.status },
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run "src/app/api/images/[id]/route.test.ts"`
Expected: PASS.

- [ ] **Step 5: Implement the media api client**

Create `frontend/src/features/media/api/media-api.ts`:

```typescript
import {
  deleteImage,
  requestJson,
  uploadImage,
} from "@/features/projects/api/project-api";
import type { ImageOption } from "@/features/projects/types";
import type { MediaImage } from "../types";

export { deleteImage, uploadImage };

export function getMedia() {
  return requestJson<MediaImage[]>("/api/images");
}

export function updateImageDescription(
  id: number,
  description: string | null,
) {
  return requestJson<ImageOption>(`/api/images/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ description }),
  });
}
```

- [ ] **Step 6: Implement the media queries**

Create `frontend/src/features/media/api/media-queries.ts`:

```typescript
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteImage,
  getMedia,
  updateImageDescription,
  uploadImage,
} from "./media-api";

export const mediaKeys = {
  all: ["images"] as const,
};

export function useMediaImages() {
  return useQuery({ queryKey: mediaKeys.all, queryFn: getMedia });
}

export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useUpdateImageDescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      description,
    }: {
      id: number;
      description: string | null;
    }) => updateImageDescription(id, description),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}
```

- [ ] **Step 7: Verify the whole slice typechecks**

Run: `npx tsc --noEmit` (from `frontend/`)
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add "frontend/src/app/api/images/[id]" frontend/src/features/media/api
git commit -m "feat(media): media api client, queries, and PATCH /api/images/:id"
```

---

### Task 6: Frontend — MediaCard + MediaView components

**Files:**
- Create: `frontend/src/features/media/components/media-card.tsx`
- Create: `frontend/src/features/media/components/media-view.tsx`
- Test: `frontend/src/features/media/components/media-view.test.tsx`

**Interfaces:**
- Consumes: `MediaImage` (Task 4).
- Produces:
  - `MediaView` props: `{ images: MediaImage[]; isPending: boolean; error: unknown; onRetry: () => void; onUpload: (file: File) => Promise<unknown>; onDelete: (id: number) => Promise<unknown>; onUpdateDescription: (id: number, description: string) => Promise<unknown> }`.
  - `MediaCard` props: `{ image: MediaImage; onDelete: (id: number) => Promise<unknown>; onUpdateDescription: (id: number, description: string) => Promise<unknown> }`.

- [ ] **Step 1: Write the failing component tests**

Create `frontend/src/features/media/components/media-view.test.tsx`:

```typescript
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("sonner", () => ({ toast }));

import { renderWithProviders } from "@/test/render-with-providers";
import type { MediaImage } from "../types";
import { MediaView } from "./media-view";

const images: MediaImage[] = [
  {
    id: 1,
    description: "Portfolio cover",
    url: "/api/uploads/file/1/cover.png",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    usage: { projects: [{ id: 7, title: "Portfolio" }], isProfilePicture: false },
  },
  {
    id: 2,
    description: null,
    url: "/api/uploads/file/1/unused.png",
    createdAt: "2026-06-02T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    usage: { projects: [], isProfilePicture: false },
  },
];

const baseProps = {
  images,
  isPending: false,
  error: null,
  onRetry: vi.fn(),
  onUpload: vi.fn(),
  onDelete: vi.fn(async () => {}),
  onUpdateDescription: vi.fn(async () => {}),
};

describe("MediaView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders each image with a usage badge", () => {
    renderWithProviders(<MediaView {...baseProps} />);
    expect(screen.getByText("Portfolio cover")).toBeInTheDocument();
    expect(screen.getByText(/1 project/i)).toBeInTheDocument();
    expect(screen.getByText(/unused/i)).toBeInTheDocument();
  });

  it("filters to unused images", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MediaView {...baseProps} />);

    await user.click(screen.getByRole("checkbox", { name: /unused only/i }));

    expect(screen.queryByText("Portfolio cover")).not.toBeInTheDocument();
    expect(screen.getByText("unused.png")).toBeInTheDocument();
  });

  it("searches by description", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MediaView {...baseProps} />);

    await user.type(screen.getByRole("searchbox"), "cover");

    expect(screen.getByText("Portfolio cover")).toBeInTheDocument();
    expect(screen.queryByText("unused.png")).not.toBeInTheDocument();
  });

  it("submits a description edit", async () => {
    const user = userEvent.setup();
    const onUpdateDescription = vi.fn(async () => {});
    renderWithProviders(
      <MediaView {...baseProps} onUpdateDescription={onUpdateDescription} />,
    );

    await user.click(
      screen.getAllByRole("button", { name: /edit description/i })[0],
    );
    const input = screen.getByRole("textbox", { name: /description/i });
    await user.clear(input);
    await user.type(input, "Renamed");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onUpdateDescription).toHaveBeenCalledWith(1, "Renamed");
  });

  it("surfaces the in-use message when a delete is rejected", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn(async () => {
      throw { status: 409, message: "Image is in use by 1 project(s)" };
    });
    renderWithProviders(<MediaView {...baseProps} onDelete={onDelete} />);

    await user.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    // confirm inside the dialog
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(toast.error).toHaveBeenCalledWith("Image is in use by 1 project(s)");
  });
});
```

> Confirm the shared test helper path `@/test/render-with-providers` (used by `projects-view.test.tsx`). Match the confirm-dialog interaction to whatever primitive the codebase already uses for destructive confirms in `projects-view` (e.g. an alert dialog); adjust the button-name queries in the delete test to that primitive.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/media/components/media-view.test.tsx`
Expected: FAIL — components do not exist.

- [ ] **Step 3: Implement `MediaCard`**

Create `frontend/src/features/media/components/media-card.tsx` — a client component: thumbnail (`<img src={image.url}>`), the description (with an "Edit description" button that reveals a labelled textbox + Save/Cancel calling `onUpdateDescription(image.id, value)`), usage badges (`{n} project(s)` / `Profile` / `Unused`), and a Delete button that opens the same confirm primitive used in `projects-view`, calling `onDelete(image.id)` and, on a thrown error, `toast.error(error.message)`. Derive the filename badge from `image.url.split("/").pop()`.

> Keep the card presentational: all mutations come through the two callbacks. Use existing `@/components/ui/*` primitives (`Button`, `Input`/`Textarea`, `Card`, the confirm/alert dialog) to match the app.

- [ ] **Step 4: Implement `MediaView`**

Create `frontend/src/features/media/components/media-view.tsx` — a client component holding local UI state: a `searchbox` (filter by `description` contains, case-insensitive), an "Unused only" checkbox (keep images where `usage.projects.length === 0 && !usage.isProfilePicture`), an upload button (validate 5 MB + jpeg/png/gif then `onUpload(file)`), and a responsive grid of `MediaCard`. Render loading (`role="status"`), error (with `onRetry`), and empty states mirroring `projects-view`.

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run src/features/media/components/media-view.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/media/components
git commit -m "feat(media): gallery grid view with search, filter, inline edit, safe delete"
```

---

### Task 7: Frontend — /media page and nav enablement

**Files:**
- Create: `frontend/src/app/(dashboard)/media/page.tsx`
- Modify: `frontend/src/components/layout/navigation.ts:51`
- Test: `frontend/src/components/layout/navigation.test.ts` (create if absent) or the existing nav/admin-shell test

**Interfaces:**
- Consumes: `useMediaImages`, `useUploadImage`, `useDeleteImage`, `useUpdateImageDescription` (Task 5); `MediaView` (Task 6).

- [ ] **Step 1: Write the failing nav test**

Create `frontend/src/components/layout/navigation.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { navigationGroups } from "./navigation";

describe("navigationGroups", () => {
  it("exposes an enabled Media link", () => {
    const media = navigationGroups
      .flatMap((group) => group.items)
      .find((item) => item.label === "Media");

    expect(media?.href).toBe("/media");
    expect(media?.disabled).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/layout/navigation.test.ts`
Expected: FAIL — Media has `disabled: true` and no `href`.

- [ ] **Step 3: Enable the nav item**

In `navigation.ts:51` replace:

```typescript
      { label: "Media", icon: ImageIcon, disabled: true },
```

with:

```typescript
      { label: "Media", icon: ImageIcon, href: "/media" },
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/components/layout/navigation.test.ts`
Expected: PASS.

- [ ] **Step 5: Create the page**

Create `frontend/src/app/(dashboard)/media/page.tsx` (mirror `projects/page.tsx`'s `Suspense` + client-content shape):

```typescript
"use client";

import { Suspense } from "react";

import {
  useDeleteImage,
  useMediaImages,
  useUpdateImageDescription,
  useUploadImage,
} from "@/features/media/api/media-queries";
import { MediaView } from "@/features/media/components/media-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function MediaPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading media" className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[520px] w-full rounded-xl" />
        </div>
      }
    >
      <MediaPageContent />
    </Suspense>
  );
}

function MediaPageContent() {
  const images = useMediaImages();
  const upload = useUploadImage();
  const remove = useDeleteImage();
  const updateDescription = useUpdateImageDescription();

  return (
    <MediaView
      images={images.data ?? []}
      isPending={images.isPending}
      error={images.error}
      onRetry={() => {
        void images.refetch();
      }}
      onUpload={(file) => upload.mutateAsync(file)}
      onDelete={(id) => remove.mutateAsync(id)}
      onUpdateDescription={(id, description) =>
        updateDescription.mutateAsync({ id, description })
      }
    />
  );
}
```

- [ ] **Step 6: Verify build + full suites**

Run (from `frontend/`): `npx tsc --noEmit` then `npx vitest run src/features/media src/components/layout src/app/api/images`
Expected: 0 type errors; all media/nav/route tests PASS.

Run (from `backend/`): `npx jest src/modules/images src/common/presenters`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add "frontend/src/app/(dashboard)/media" frontend/src/components/layout/navigation.ts frontend/src/components/layout/navigation.test.ts
git commit -m "feat(media): /media dashboard page and enable the Media nav item"
```

---

## Final verification (after all tasks)

- [ ] Backend: `npx jest` (full) — green.
- [ ] Backend: `npm run lint` — 0 errors (stage only feature files; the repo has pre-existing EOL/prettier churn — never blanket-add).
- [ ] Frontend: `npx vitest run` (full) — green.
- [ ] Frontend: `npm run lint` and `npx tsc --noEmit` — clean.
- [ ] Manual smoke (when a dev DB is available): upload → appears; edit description → persists; delete unused → gone; delete a project cover → 409 toast naming the project.

## Notes for the executor

- **Staging discipline:** the working tree carries pre-existing prettier/CRLF churn on unrelated files. For every commit, `git add` only the exact paths listed in that task — never `git add -A`.
- **No migration:** if any step tempts you to change `schema.prisma`, stop — the feature is designed to need none.
- **`images.service.spec.ts` / `images.controller.spec.ts` setup:** read the current mock setup before Task 1 and extend the mock objects (`findWithUsage`, `updateDescription`) rather than rewriting the harness.
