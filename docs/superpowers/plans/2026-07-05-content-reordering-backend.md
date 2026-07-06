# Content Reordering (Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the six reorderable content types a persisted `order` column and a per-type `PATCH .../reorder` endpoint so a user's manual arrangement becomes the single source of truth for display order in both the dashboard lists and the public portfolio.

**Architecture:** Add `order Int @default(0)` to the four content tables that lack it (`f_projects`, `f_experience`, `f_education`, `f_courses`), backfilling existing rows by creation rank per owner. Each module gains a `reorder` service method that loads the caller's owned id set, asserts the submitted id list equals that set exactly (else `400`), and writes `order = index` inside a `$transaction`. List reads and the public query add `orderBy: { order: 'asc' }`.

**Tech Stack:** NestJS 11, Prisma 6 (PostgreSQL), class-validator, Jest (unit + supertest e2e).

## Global Constraints

- Never implement on `master` — branch first (suggested: `feat/content-reordering-backend`).
- Commit trailer EXACTLY: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- After any Prisma schema change, run `npm run prisma:dev:generate` (from `backend/`).
- Unit tests use inline `jest.fn()` mock objects + `new Service(mock as never)` and `jest.resetAllMocks()` in `beforeEach`. Do NOT use `Test.createTestingModule`, and do NOT create in-memory repositories. (This overrides the design spec's "provide an in-memory repository for unit tests" line, which does not match this codebase.)
- Backend module pattern here: concrete Prisma repository classes are injected directly (no interface tokens, no `useClass`). Services enforce ownership themselves.
- Reorder request contract: the body carries the COMPLETE ordered id set for that resource. Exact-set mismatch (missing / extra / duplicate / wrong length) → `400 Bad Request`.
- `order` is scoped per user; for custom-section items, per section.
- All backend commands run from the `backend/` directory.

---

## File Structure

**New files:**
- `backend/src/common/dto/reorder.dto.ts` — the shared `ReorderDto { ids: number[] }`.
- `backend/src/common/validators/assert-exact-id-set.ts` — the shared exact-set validator.
- `backend/src/common/validators/assert-exact-id-set.spec.ts` — its unit test.
- `backend/src/modules/experience/experience.service.spec.ts` — new (none exists today).
- `backend/src/modules/education/education.service.spec.ts` — new.
- `backend/src/modules/courses/courses.service.spec.ts` — new.
- `backend/src/modules/custom-sections/custom-sections.service.spec.ts` — new.
- `backend/test/helpers/auth.ts` — e2e login helper (none exists today).
- `backend/test/reorder.e2e-spec.ts` — authenticated reorder e2e.
- One new Prisma migration directory under `backend/prisma/migrations/`.

**Modified files:**
- `backend/prisma/schema.prisma` — add `order` to four models.
- `projects` / `experience` / `education` / `courses` repository + service + controller (reorder plumbing + list `orderBy`).
- `custom-sections` repository + service + controller (section + item reorder; item `orderBy` in includes).
- `backend/src/modules/public/public.service.ts` — add `orderBy` to four relations.
- `backend/src/modules/projects/projects.service.spec.ts` — extend with reorder tests.

---

## Task 1: Prisma migration — add `order` column + backfill

**Files:**
- Modify: `backend/prisma/schema.prisma` (models `f_projects`, `f_experience`, `f_education`, `f_courses`)
- Create: `backend/prisma/migrations/<timestamp>_add_content_order/migration.sql` (generated, then hand-edited)

**Interfaces:**
- Produces: an `order Int @default(0)` scalar on `f_projects`, `f_experience`, `f_education`, `f_courses`. Existing rows are backfilled `0..n-1` per owner in `created_at` order. Every later task relies on this column existing.

- [ ] **Step 1: Add `order` to the four models in `schema.prisma`**

Replace the `model f_projects { ... }` block with:

```prisma
model f_projects {
  id           Int              @id @default(autoincrement())
  title        String
  description  String
  repo_url     String?
  live_url     String?
  order        Int              @default(0)
  f_user       f_user           @relation(fields: [f_userId], references: [id])
  f_userId     Int
  category     d_category       @relation(fields: [d_categoryId], references: [id])
  d_categoryId Int
  f_images     f_images?        @relation(fields: [f_imagesId], references: [id])
  f_imagesId   Int?
  technologies d_technologies[]
  created_at   DateTime         @default(now())
  updated_at   DateTime         @updatedAt

  @@unique([f_userId, title])
}
```

Replace the `model f_experience { ... }` block with:

```prisma
model f_experience {
  id           Int      @id @default(autoincrement())
  tile         String
  company_name String
  description  String
  start_date   DateTime
  end_date     DateTime?
  current      Boolean  @default(false)
  order        Int      @default(0)
  f_user       f_user   @relation(fields: [f_userId], references: [id])
  f_userId     Int
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
}
```

Replace the `model f_education { ... }` block with:

```prisma
model f_education {
  id               Int       @id @default(autoincrement())
  title            String
  institution_name String
  description      String?
  start_date       DateTime
  end_date         DateTime?
  current          Boolean   @default(false)
  order            Int       @default(0)
  f_user           f_user    @relation(fields: [f_userId], references: [id])
  f_userId         Int
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt
}
```

Replace the `model f_courses { ... }` block with:

```prisma
model f_courses {
  id               Int       @id @default(autoincrement())
  title            String
  institution_name String
  description      String?
  start_date       DateTime
  end_date         DateTime?
  current          Boolean   @default(false)
  order            Int       @default(0)
  f_user           f_user    @relation(fields: [f_userId], references: [id])
  f_userId         Int
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt
}
```

> Note: `f_experience.tile` is the real (misspelled) column name in this schema — leave it exactly as `tile`. Do not "fix" it.

- [ ] **Step 2: Generate the migration WITHOUT applying it**

Run: `npm run prisma:dev:migrate -- --create-only --name add_content_order`

Expected: Prisma prints "The following migration(s) have been created" and writes `prisma/migrations/<timestamp>_add_content_order/migration.sql` containing four `ALTER TABLE ... ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;` statements. Nothing is applied to the database yet.

If the npm script does not forward the flags, run instead:
`npx dotenv -e .env.development -- npx prisma migrate dev --create-only --name add_content_order`

- [ ] **Step 3: Append the backfill SQL to the generated `migration.sql`**

Open the generated `prisma/migrations/<timestamp>_add_content_order/migration.sql` and append these four statements to the end of the file (leave the auto-generated `ADD COLUMN` lines untouched):

```sql
-- Backfill order = creation rank per owner (0-based), preserving current display order.
UPDATE "f_projects" AS t
SET "order" = sub.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "f_userId" ORDER BY "created_at" ASC, id ASC) AS rn
  FROM "f_projects"
) AS sub
WHERE t.id = sub.id;

UPDATE "f_experience" AS t
SET "order" = sub.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "f_userId" ORDER BY "created_at" ASC, id ASC) AS rn
  FROM "f_experience"
) AS sub
WHERE t.id = sub.id;

UPDATE "f_education" AS t
SET "order" = sub.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "f_userId" ORDER BY "created_at" ASC, id ASC) AS rn
  FROM "f_education"
) AS sub
WHERE t.id = sub.id;

UPDATE "f_courses" AS t
SET "order" = sub.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "f_userId" ORDER BY "created_at" ASC, id ASC) AS rn
  FROM "f_courses"
) AS sub
WHERE t.id = sub.id;
```

- [ ] **Step 4: Apply the migration and regenerate the client**

Run: `npm run prisma:dev:migrate`
Expected: Prisma applies the pending `add_content_order` migration ("Your database is now in sync with your schema").

Run: `npm run prisma:dev:generate`
Expected: "Generated Prisma Client" — the client now types `order` on all four models.

- [ ] **Step 5: Verify the schema compiles**

Run: `npm run build`
Expected: TypeScript compiles with no errors.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(content): add order column + backfill to reorderable content tables

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Shared reorder foundation — `ReorderDto` + `assertExactIdSet`

**Files:**
- Create: `backend/src/common/dto/reorder.dto.ts`
- Create: `backend/src/common/validators/assert-exact-id-set.ts`
- Test: `backend/src/common/validators/assert-exact-id-set.spec.ts`

**Interfaces:**
- Produces: `class ReorderDto { ids: number[] }` (validated: non-empty array of ints).
- Produces: `function assertExactIdSet(ownedIds: number[], submittedIds: number[]): void` — returns silently when `submittedIds` is a permutation of `ownedIds`; throws `BadRequestException('Reorder ids do not match the current set')` on any missing/extra/duplicate id or length mismatch.
- Consumed by every reorder service (Tasks 3–8).

- [ ] **Step 1: Write the failing test**

Create `backend/src/common/validators/assert-exact-id-set.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { assertExactIdSet } from './assert-exact-id-set';

describe('assertExactIdSet', () => {
  it('passes when the submitted ids are the same set in the same order', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2, 3])).not.toThrow();
  });

  it('passes when the submitted ids are the same set in a different order', () => {
    expect(() => assertExactIdSet([1, 2, 3], [3, 1, 2])).not.toThrow();
  });

  it('throws when an owned id is missing from the submission', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2])).toThrow(
      BadRequestException,
    );
  });

  it('throws when the submission contains an id the user does not own', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2, 999])).toThrow(
      BadRequestException,
    );
  });

  it('throws when the submission contains a duplicate id', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2, 2])).toThrow(
      BadRequestException,
    );
  });

  it('throws when the lengths differ', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2, 3, 4])).toThrow(
      BadRequestException,
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --testPathPattern=assert-exact-id-set`
Expected: FAIL — cannot find module `./assert-exact-id-set`.

- [ ] **Step 3: Implement the validator**

Create `backend/src/common/validators/assert-exact-id-set.ts`:

```ts
import { BadRequestException } from '@nestjs/common';

/**
 * Asserts that `submittedIds` is exactly a permutation of `ownedIds`:
 * same length, every id owned, no duplicates. Used by reorder endpoints,
 * where the client always submits the resource's complete ordered id set.
 */
export function assertExactIdSet(
  ownedIds: number[],
  submittedIds: number[],
): void {
  const mismatch = new BadRequestException(
    'Reorder ids do not match the current set',
  );

  if (submittedIds.length !== ownedIds.length) {
    throw mismatch;
  }

  const owned = new Set(ownedIds);
  const seen = new Set<number>();

  for (const id of submittedIds) {
    if (seen.has(id) || !owned.has(id)) {
      throw mismatch;
    }
    seen.add(id);
  }
}
```

- [ ] **Step 4: Create the shared DTO**

Create `backend/src/common/dto/reorder.dto.ts`:

```ts
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class ReorderDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids: number[];
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- --testPathPattern=assert-exact-id-set`
Expected: PASS (6 passing).

- [ ] **Step 6: Commit**

```bash
git add backend/src/common/dto/reorder.dto.ts backend/src/common/validators
git commit -m "feat(content): add shared ReorderDto and exact-id-set validator

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Projects reorder

**Files:**
- Modify: `backend/src/modules/projects/repository/projects.repository.ts`
- Modify: `backend/src/modules/projects/projects.service.ts`
- Modify: `backend/src/modules/projects/projects.controller.ts`
- Test: `backend/src/modules/projects/projects.service.spec.ts` (extend existing)

**Interfaces:**
- Consumes: `assertExactIdSet` (Task 2), `ReorderDto` (Task 2).
- Produces: `ProjectRepository.findIdsByUser(userId: number): Promise<number[]>`, `ProjectRepository.reorder(ids: number[]): Promise<void>`, `ProjectsService.reorder(userId: number, ids: number[])`, and `PATCH /projects/reorder`.

- [ ] **Step 1: Extend the service spec with failing reorder tests**

In `backend/src/modules/projects/projects.service.spec.ts`, add `findIdsByUser` and `reorder` to the `repository` mock object so it reads:

```ts
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByTitle: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findImageById: jest.fn(),
    findIdsByUser: jest.fn(),
    reorder: jest.fn(),
  };
```

Then add this `describe` block inside the top-level `describe('ProjectsService', ...)`, after the last existing test:

```ts
  describe('reorder', () => {
    it('persists the new order when the id set matches the owned projects', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);
      repository.findAll.mockResolvedValue([{ id: 3 }, { id: 1 }, { id: 2 }]);

      const result = await service.reorder(42, [3, 1, 2]);

      expect(repository.findIdsByUser).toHaveBeenCalledWith(42);
      expect(repository.reorder).toHaveBeenCalledWith([3, 1, 2]);
      expect(result).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
    });

    it('rejects an id set that does not match the owned projects', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);

      await expect(service.reorder(42, [1, 2, 999])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.reorder).not.toHaveBeenCalled();
    });
  });
```

(`BadRequestException` is already imported at the top of this spec.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- --testPathPattern=projects.service`
Expected: FAIL — `service.reorder is not a function`.

- [ ] **Step 3: Add repository methods and list ordering**

In `backend/src/modules/projects/repository/projects.repository.ts`, replace the `findAll` method with the ordered version and add the two new methods immediately after `findImageById`:

Replace:

```ts
  async findAll(userId: number) {
    return this.prismaService.f_projects.findMany({
      where: { f_userId: userId },
      include: projectInclude,
    });
  }
```

with:

```ts
  async findAll(userId: number) {
    return this.prismaService.f_projects.findMany({
      where: { f_userId: userId },
      include: projectInclude,
      orderBy: { order: 'asc' },
    });
  }
```

Add after the existing `findImageById` method (before the closing `}` of the class):

```ts
  async findIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prismaService.f_projects.findMany({
      where: { f_userId: userId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async reorder(ids: number[]): Promise<void> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.f_projects.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }
```

- [ ] **Step 4: Add the service method**

In `backend/src/modules/projects/projects.service.ts`, add the import near the other imports:

```ts
import { assertExactIdSet } from '../../common/validators/assert-exact-id-set';
```

Add this method to `ProjectsService`, immediately after the `findAll` method:

```ts
  async reorder(userId: number, ids: number[]) {
    const ownedIds = await this.projectRepository.findIdsByUser(userId);
    assertExactIdSet(ownedIds, ids);
    await this.projectRepository.reorder(ids);
    return this.findAll(userId);
  }
```

- [ ] **Step 5: Add the controller route (before `@Patch(':id')`)**

In `backend/src/modules/projects/projects.controller.ts`, add the import:

```ts
import { ReorderDto } from '../../common/dto/reorder.dto';
```

Insert this handler AFTER `findOne` and BEFORE the `@Patch(':id') update` handler (so the static `reorder` path is registered before the `:id` param route):

```ts
  @Patch('reorder')
  reorder(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.projectsService.reorder(Number(req.user.sub), dto.ids);
  }
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -- --testPathPattern=projects.service`
Expected: PASS (all existing tests plus the 2 new reorder tests).

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/projects
git commit -m "feat(projects): add reorder endpoint and order-by list read

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Experience reorder

**Files:**
- Modify: `backend/src/modules/experience/repository/experience.repository.ts`
- Modify: `backend/src/modules/experience/experience.service.ts`
- Modify: `backend/src/modules/experience/experience.controller.ts`
- Test: `backend/src/modules/experience/experience.service.spec.ts` (create)

**Interfaces:**
- Consumes: `assertExactIdSet`, `ReorderDto`.
- Produces: `ExperienceRepository.findIdsByUser(userId: number): Promise<number[]>`, `ExperienceRepository.reorder(ids: number[]): Promise<void>`, `ExperienceService.reorder(userId: number, ids: number[])`, and `PATCH /experience/reorder`.

- [ ] **Step 1: Write the failing spec**

Create `backend/src/modules/experience/experience.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { ExperienceService } from './experience.service';

describe('ExperienceService', () => {
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findIdsByUser: jest.fn(),
    reorder: jest.fn(),
  };

  let service: ExperienceService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ExperienceService(repository as never);
  });

  describe('reorder', () => {
    it('persists the new order when the id set matches the owned rows', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);
      repository.findAll.mockResolvedValue([{ id: 3 }, { id: 1 }, { id: 2 }]);

      const result = await service.reorder(42, [3, 1, 2]);

      expect(repository.findIdsByUser).toHaveBeenCalledWith(42);
      expect(repository.reorder).toHaveBeenCalledWith([3, 1, 2]);
      expect(result).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
    });

    it('rejects an id set that does not match the owned rows', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);

      await expect(service.reorder(42, [1, 2, 999])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.reorder).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `npm run test -- --testPathPattern=experience.service`
Expected: FAIL — `service.reorder is not a function`.

- [ ] **Step 3: Add repository methods and list ordering**

In `backend/src/modules/experience/repository/experience.repository.ts`, replace `findAll` with:

```ts
  async findAll(userId?: number): Promise<f_experience[]> {
    return await this.prismaService.f_experience.findMany({
      where: userId ? { f_userId: userId } : undefined,
      orderBy: { order: 'asc' },
    });
  }
```

Add after the `delete` method (before the class closing `}`):

```ts
  async findIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prismaService.f_experience.findMany({
      where: { f_userId: userId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async reorder(ids: number[]): Promise<void> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.f_experience.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }
```

- [ ] **Step 4: Add the service method**

In `backend/src/modules/experience/experience.service.ts`, add the import:

```ts
import { assertExactIdSet } from '../../common/validators/assert-exact-id-set';
```

Add this method to `ExperienceService`, after `findAll`:

```ts
  async reorder(userId: number, ids: number[]) {
    const ownedIds = await this.experienceRepository.findIdsByUser(userId);
    assertExactIdSet(ownedIds, ids);
    await this.experienceRepository.reorder(ids);
    return this.experienceRepository.findAll(userId);
  }
```

- [ ] **Step 5: Add the controller route (before `@Patch(':id')`)**

In `backend/src/modules/experience/experience.controller.ts`, add the import:

```ts
import { ReorderDto } from '../../common/dto/reorder.dto';
```

Insert AFTER `findOne` and BEFORE the `@Patch(':id') update` handler:

```ts
  @Patch('reorder')
  reorder(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.experienceService.reorder(Number(req.user.sub), dto.ids);
  }
```

- [ ] **Step 6: Run the spec to verify it passes**

Run: `npm run test -- --testPathPattern=experience.service`
Expected: PASS (2 passing).

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/experience
git commit -m "feat(experience): add reorder endpoint and order-by list read

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Education reorder

**Files:**
- Modify: `backend/src/modules/education/repository/education.repository.ts`
- Modify: `backend/src/modules/education/education.service.ts`
- Modify: `backend/src/modules/education/education.controller.ts`
- Test: `backend/src/modules/education/education.service.spec.ts` (create)

**Interfaces:**
- Consumes: `assertExactIdSet`, `ReorderDto`.
- Produces: `EducationRepository.findIdsByUser(userId: number): Promise<number[]>`, `EducationRepository.reorder(ids: number[]): Promise<void>`, `EducationService.reorder(userId: number, ids: number[])`, and `PATCH /education/reorder`.

- [ ] **Step 1: Write the failing spec**

Create `backend/src/modules/education/education.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { EducationService } from './education.service';

describe('EducationService', () => {
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findIdsByUser: jest.fn(),
    reorder: jest.fn(),
  };

  let service: EducationService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new EducationService(repository as never);
  });

  describe('reorder', () => {
    it('persists the new order when the id set matches the owned rows', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);
      repository.findAll.mockResolvedValue([{ id: 3 }, { id: 1 }, { id: 2 }]);

      const result = await service.reorder(42, [3, 1, 2]);

      expect(repository.findIdsByUser).toHaveBeenCalledWith(42);
      expect(repository.reorder).toHaveBeenCalledWith([3, 1, 2]);
      expect(result).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
    });

    it('rejects an id set that does not match the owned rows', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);

      await expect(service.reorder(42, [1, 2, 999])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.reorder).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `npm run test -- --testPathPattern=education.service`
Expected: FAIL — `service.reorder is not a function`.

- [ ] **Step 3: Add repository methods and list ordering**

In `backend/src/modules/education/repository/education.repository.ts`, replace `findAll` with:

```ts
  async findAll(userId?: number): Promise<f_education[]> {
    return await this.prismaService.f_education.findMany({
      where: userId ? { f_userId: userId } : undefined,
      orderBy: { order: 'asc' },
    });
  }
```

Add after the `delete` method:

```ts
  async findIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prismaService.f_education.findMany({
      where: { f_userId: userId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async reorder(ids: number[]): Promise<void> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.f_education.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }
```

- [ ] **Step 4: Add the service method**

In `backend/src/modules/education/education.service.ts`, add the import:

```ts
import { assertExactIdSet } from '../../common/validators/assert-exact-id-set';
```

Add to `EducationService`, after `findAll`:

```ts
  async reorder(userId: number, ids: number[]) {
    const ownedIds = await this.educationRepository.findIdsByUser(userId);
    assertExactIdSet(ownedIds, ids);
    await this.educationRepository.reorder(ids);
    return this.educationRepository.findAll(userId);
  }
```

- [ ] **Step 5: Add the controller route (before `@Patch(':id')`)**

In `backend/src/modules/education/education.controller.ts`, add the import:

```ts
import { ReorderDto } from '../../common/dto/reorder.dto';
```

Insert AFTER `findOne` and BEFORE the `@Patch(':id') update` handler:

```ts
  @Patch('reorder')
  reorder(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.educationService.reorder(Number(req.user.sub), dto.ids);
  }
```

- [ ] **Step 6: Run the spec to verify it passes**

Run: `npm run test -- --testPathPattern=education.service`
Expected: PASS (2 passing).

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/education
git commit -m "feat(education): add reorder endpoint and order-by list read

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Courses reorder

**Files:**
- Modify: `backend/src/modules/courses/repository/courses.repository.ts`
- Modify: `backend/src/modules/courses/courses.service.ts`
- Modify: `backend/src/modules/courses/courses.controller.ts`
- Test: `backend/src/modules/courses/courses.service.spec.ts` (create)

**Interfaces:**
- Consumes: `assertExactIdSet`, `ReorderDto`.
- Produces: `CoursesRepository.findIdsByUser(userId: number): Promise<number[]>`, `CoursesRepository.reorder(ids: number[]): Promise<void>`, `CoursesService.reorder(userId: number, ids: number[])`, and `PATCH /courses/reorder`.

- [ ] **Step 1: Write the failing spec**

Create `backend/src/modules/courses/courses.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findIdsByUser: jest.fn(),
    reorder: jest.fn(),
  };

  let service: CoursesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CoursesService(repository as never);
  });

  describe('reorder', () => {
    it('persists the new order when the id set matches the owned rows', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);
      repository.findAll.mockResolvedValue([{ id: 3 }, { id: 1 }, { id: 2 }]);

      const result = await service.reorder(42, [3, 1, 2]);

      expect(repository.findIdsByUser).toHaveBeenCalledWith(42);
      expect(repository.reorder).toHaveBeenCalledWith([3, 1, 2]);
      expect(result).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
    });

    it('rejects an id set that does not match the owned rows', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);

      await expect(service.reorder(42, [1, 2, 999])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.reorder).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `npm run test -- --testPathPattern=courses.service`
Expected: FAIL — `service.reorder is not a function`.

- [ ] **Step 3: Add repository methods and list ordering**

In `backend/src/modules/courses/repository/courses.repository.ts`, replace `findAll` with:

```ts
  async findAll(userId?: number): Promise<f_courses[]> {
    return await this.prismaService.f_courses.findMany({
      where: userId ? { f_userId: userId } : undefined,
      orderBy: { order: 'asc' },
    });
  }
```

Add after the `delete` method:

```ts
  async findIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prismaService.f_courses.findMany({
      where: { f_userId: userId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async reorder(ids: number[]): Promise<void> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.f_courses.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }
```

- [ ] **Step 4: Add the service method**

In `backend/src/modules/courses/courses.service.ts`, add the import:

```ts
import { assertExactIdSet } from '../../common/validators/assert-exact-id-set';
```

Add to `CoursesService`, after `findAll`:

```ts
  async reorder(userId: number, ids: number[]) {
    const ownedIds = await this.coursesRepository.findIdsByUser(userId);
    assertExactIdSet(ownedIds, ids);
    await this.coursesRepository.reorder(ids);
    return this.coursesRepository.findAll(userId);
  }
```

- [ ] **Step 5: Add the controller route (before `@Patch(':id')`)**

In `backend/src/modules/courses/courses.controller.ts`, add the import:

```ts
import { ReorderDto } from '../../common/dto/reorder.dto';
```

Insert AFTER `findOne` and BEFORE the `@Patch(':id') update` handler:

```ts
  @Patch('reorder')
  reorder(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.coursesService.reorder(Number(req.user.sub), dto.ids);
  }
```

- [ ] **Step 6: Run the spec to verify it passes**

Run: `npm run test -- --testPathPattern=courses.service`
Expected: PASS (2 passing).

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/courses
git commit -m "feat(courses): add reorder endpoint and order-by list read

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Custom sections reorder (sections)

**Files:**
- Modify: `backend/src/modules/custom-sections/repository/custom-sections.repository.ts`
- Modify: `backend/src/modules/custom-sections/custom-sections.service.ts`
- Modify: `backend/src/modules/custom-sections/custom-sections.controller.ts`
- Test: `backend/src/modules/custom-sections/custom-sections.service.spec.ts` (create)

**Interfaces:**
- Consumes: `assertExactIdSet`, `ReorderDto`.
- Produces: `CustomSectionsRepository.findSectionIdsByUser(userId: number): Promise<number[]>`, `CustomSectionsRepository.reorderSections(ids: number[]): Promise<void>`, `CustomSectionsService.reorderSections(userId: number, ids: number[])`, and `PATCH /custom-sections/reorder`.
- Also produces (used by Task 8): item `orderBy` inside `findSectionsByUser`'s include.

- [ ] **Step 1: Write the failing spec**

Create `backend/src/modules/custom-sections/custom-sections.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { CustomSectionsService } from './custom-sections.service';

describe('CustomSectionsService', () => {
  const repository = {
    createSection: jest.fn(),
    findSectionsByUser: jest.fn(),
    findSectionById: jest.fn(),
    updateSection: jest.fn(),
    deleteSection: jest.fn(),
    createItem: jest.fn(),
    findItemById: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    findSectionIdsByUser: jest.fn(),
    reorderSections: jest.fn(),
    findItemIdsBySection: jest.fn(),
    reorderItems: jest.fn(),
  };

  let service: CustomSectionsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CustomSectionsService(repository as never);
  });

  describe('reorderSections', () => {
    it('persists the new order when the id set matches the owned sections', async () => {
      repository.findSectionIdsByUser.mockResolvedValue([1, 2, 3]);
      repository.findSectionsByUser.mockResolvedValue([
        { id: 3 },
        { id: 1 },
        { id: 2 },
      ]);

      const result = await service.reorderSections(42, [3, 1, 2]);

      expect(repository.findSectionIdsByUser).toHaveBeenCalledWith(42);
      expect(repository.reorderSections).toHaveBeenCalledWith([3, 1, 2]);
      expect(result).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
    });

    it('rejects an id set that does not match the owned sections', async () => {
      repository.findSectionIdsByUser.mockResolvedValue([1, 2, 3]);

      await expect(
        service.reorderSections(42, [1, 2, 999]),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.reorderSections).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `npm run test -- --testPathPattern=custom-sections.service`
Expected: FAIL — `service.reorderSections is not a function`.

- [ ] **Step 3: Add repository methods and item ordering to `findSectionsByUser`**

In `backend/src/modules/custom-sections/repository/custom-sections.repository.ts`, replace `findSectionsByUser` with (adds item `orderBy` so the dashboard reflects item order):

```ts
  async findSectionsByUser(userId: number) {
    return this.prisma.custom_section.findMany({
      where: { user_id: userId },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
  }
```

Add these methods after `deleteSection` (before `createItem`):

```ts
  async findSectionIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prisma.custom_section.findMany({
      where: { user_id: userId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async reorderSections(ids: number[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.custom_section.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }
```

- [ ] **Step 4: Add the service method**

In `backend/src/modules/custom-sections/custom-sections.service.ts`, add the import:

```ts
import { assertExactIdSet } from '../../common/validators/assert-exact-id-set';
```

Add to `CustomSectionsService`, after `findUserSections`:

```ts
  async reorderSections(userId: number, ids: number[]) {
    const ownedIds = await this.repository.findSectionIdsByUser(userId);
    assertExactIdSet(ownedIds, ids);
    await this.repository.reorderSections(ids);
    return this.repository.findSectionsByUser(userId);
  }
```

- [ ] **Step 5: Add the controller route (before `@Patch(':id')`)**

In `backend/src/modules/custom-sections/custom-sections.controller.ts`, add the import:

```ts
import { ReorderDto } from '../../common/dto/reorder.dto';
```

Insert AFTER `findUserSections` (`@Get()`) and BEFORE `updateSection` (`@Patch(':id')`):

```ts
  @Patch('reorder')
  reorderSections(
    @Body() dto: ReorderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.reorderSections(Number(req.user.sub), dto.ids);
  }
```

- [ ] **Step 6: Run the spec to verify it passes**

Run: `npm run test -- --testPathPattern=custom-sections.service`
Expected: PASS (2 passing).

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/custom-sections
git commit -m "feat(custom-sections): add section reorder endpoint and ordered item reads

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Custom section items reorder

**Files:**
- Modify: `backend/src/modules/custom-sections/repository/custom-sections.repository.ts`
- Modify: `backend/src/modules/custom-sections/custom-sections.service.ts`
- Modify: `backend/src/modules/custom-sections/custom-sections.controller.ts`
- Test: `backend/src/modules/custom-sections/custom-sections.service.spec.ts` (extend)

**Interfaces:**
- Consumes: `assertExactIdSet`, `ReorderDto`, and the existing `findSectionById` (already throws `NotFoundException` for a missing section).
- Produces: `CustomSectionsRepository.findItemIdsBySection(sectionId: number): Promise<number[]>`, `CustomSectionsRepository.reorderItems(ids: number[]): Promise<void>`, `CustomSectionsService.reorderItems(sectionId: number, ids: number[], userId: number, role: number)`, and `PATCH /custom-sections/:sectionId/items/reorder`.

- [ ] **Step 1: Extend the spec with failing item-reorder tests**

At the top of `backend/src/modules/custom-sections/custom-sections.service.spec.ts`, update the imports line to also bring in `ForbiddenException` and `UserRoles`:

```ts
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CustomSectionsService } from './custom-sections.service';
import { UserRoles } from '../../utils/types';
```

Add this `describe` block after the `reorderSections` describe (still inside `describe('CustomSectionsService', ...)`):

```ts
  describe('reorderItems', () => {
    it('rejects when the section belongs to another user', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 99,
        items: [],
      });

      await expect(
        service.reorderItems(5, [1, 2], 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.reorderItems).not.toHaveBeenCalled();
    });

    it('rejects an id set that does not match the section items', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 42,
        items: [],
      });
      repository.findItemIdsBySection.mockResolvedValue([1, 2, 3]);

      await expect(
        service.reorderItems(5, [1, 2, 999], 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.reorderItems).not.toHaveBeenCalled();
    });

    it('persists the new item order for the owning user', async () => {
      const reordered = {
        id: 5,
        user_id: 42,
        items: [{ id: 3 }, { id: 1 }, { id: 2 }],
      };
      repository.findSectionById
        .mockResolvedValueOnce({ id: 5, user_id: 42, items: [] })
        .mockResolvedValueOnce(reordered);
      repository.findItemIdsBySection.mockResolvedValue([1, 2, 3]);

      const result = await service.reorderItems(
        5,
        [3, 1, 2],
        42,
        UserRoles.REGULAR,
      );

      expect(repository.reorderItems).toHaveBeenCalledWith([3, 1, 2]);
      expect(result).toEqual(reordered);
    });
  });
```

- [ ] **Step 2: Run the spec to verify the new tests fail**

Run: `npm run test -- --testPathPattern=custom-sections.service`
Expected: FAIL — `service.reorderItems is not a function`.

- [ ] **Step 3: Add repository methods and item ordering to `findSectionById`**

In `backend/src/modules/custom-sections/repository/custom-sections.repository.ts`, replace `findSectionById` with (adds item `orderBy` so the reorder response reflects the new order):

```ts
  async findSectionById(id: number) {
    return this.prisma.custom_section.findUnique({
      where: { id },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }
```

Add these methods after `deleteItem` (before the class closing `}`):

```ts
  async findItemIdsBySection(sectionId: number): Promise<number[]> {
    const rows = await this.prisma.custom_section_item.findMany({
      where: { section_id: sectionId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async reorderItems(ids: number[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.custom_section_item.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }
```

- [ ] **Step 4: Add the service method**

In `backend/src/modules/custom-sections/custom-sections.service.ts`, add to `CustomSectionsService`, after `reorderSections` (the `assertExactIdSet`, `UserRoles`, and `ForbiddenException` imports already exist from Task 7 and the original file):

```ts
  async reorderItems(
    sectionId: number,
    ids: number[],
    userId: number,
    role: number,
  ) {
    const section = await this.findSectionById(sectionId);
    if (section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }
    const ownedIds = await this.repository.findItemIdsBySection(sectionId);
    assertExactIdSet(ownedIds, ids);
    await this.repository.reorderItems(ids);
    return this.findSectionById(sectionId);
  }
```

- [ ] **Step 5: Add the controller route (before `@Patch('items/:itemId')`)**

In `backend/src/modules/custom-sections/custom-sections.controller.ts`, insert AFTER `createItem` (`@Post(':id/items')`) and BEFORE `updateItem` (`@Patch('items/:itemId')`):

```ts
  @Patch(':sectionId/items/reorder')
  reorderItems(
    @Param('sectionId') sectionId: string,
    @Body() dto: ReorderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.reorderItems(
      +sectionId,
      dto.ids,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }
```

(The `ReorderDto` import was added in Task 7.)

- [ ] **Step 6: Run the spec to verify it passes**

Run: `npm run test -- --testPathPattern=custom-sections.service`
Expected: PASS (5 passing: 2 section + 3 item).

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/custom-sections
git commit -m "feat(custom-sections): add item reorder endpoint

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Public portfolio ordered reads

**Files:**
- Modify: `backend/src/modules/public/public.service.ts`

**Interfaces:**
- Consumes: the `order` column on all four content models (Task 1).
- Produces: the public portfolio query now returns projects, education, courses, and experience ordered by `order` (custom sections + items already were).

> This is a query-only change (no new types, no unit-testable branch). It is verified here by `npm run build` and behaviorally by the frontend Playwright suite ("public portfolio reflects the order"), which is the spec's assigned owner for public-ordering behavior.

- [ ] **Step 1: Add `orderBy` to the four unordered relations**

In `backend/src/modules/public/public.service.ts`, inside the `getPortfolio` select, add `orderBy: { order: 'asc' },` as the first property of each of the four relation objects.

Change `f_projects` from `f_projects: {\n          select: {` to:

```ts
        f_projects: {
          orderBy: { order: 'asc' },
          select: {
```

Change `f_education` from `f_education: {\n          select: {` to:

```ts
        f_education: {
          orderBy: { order: 'asc' },
          select: {
```

Change `f_courses` from `f_courses: {\n          select: {` to:

```ts
        f_courses: {
          orderBy: { order: 'asc' },
          select: {
```

Change `f_experience` from `f_experience: {\n          select: {` to:

```ts
        f_experience: {
          orderBy: { order: 'asc' },
          select: {
```

Leave the existing `custom_sections` block (which already has `orderBy: { order: 'asc' }` at both section and item level) unchanged.

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: compiles clean (the `order` field is valid on all four `orderBy` inputs).

- [ ] **Step 3: Verify no unit regressions**

Run: `npm run test`
Expected: full unit suite passes.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/public/public.service.ts
git commit -m "feat(public): order portfolio content by manual order

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Authenticated reorder e2e

**Files:**
- Create: `backend/test/helpers/auth.ts`
- Create: `backend/test/reorder.e2e-spec.ts`

**Interfaces:**
- Consumes: `PATCH /education/reorder` (Task 5), `PATCH /projects/reorder` (Task 3), `POST /auth/login`, and the e2e seed (`e2e@portfolio.test` / `E2eStrongP@ss1`, which seeds 12 education rows for that user).
- Produces: `loginE2eUser(app): Promise<string>` — the first reusable authenticated e2e helper in this codebase.

> **Scope note (deliberate):** The design spec asked for backend e2e on "projects and custom-section items." This plan instead runs the happy-path + 400 e2e against **education**, because the e2e seed already creates 12 education rows for the e2e user (deterministic, no setup), whereas creating projects in-test requires resolving a seeded `d_categoryId` at runtime. The exact-set + transaction logic is identical across modules (shared helper), and is unit-covered for every module (Tasks 3–8). The projects/custom-item authenticated happy path is covered end-to-end by the frontend Playwright suite. 401 is asserted here for both `/education/reorder` and `/projects/reorder`.

- [ ] **Step 1: Write the login helper**

Create `backend/test/helpers/auth.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function loginE2eUser(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'e2e@portfolio.test', password: 'E2eStrongP@ss1' })
    .expect(200);

  return response.body.access_token as string;
}
```

- [ ] **Step 2: Write the failing e2e spec**

Create `backend/test/reorder.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';
import { loginE2eUser } from './helpers/auth';

describe('Content reorder (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp =
      moduleFixture.createNestApplication<NestExpressApplication>();
    configureApplication(nestApp);
    app = nestApp;
    await app.init();

    token = await loginE2eUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('persists a new education order for the authenticated user', async () => {
    const before = await request(app.getHttpServer())
      .get('/education')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const ids: number[] = before.body.map((row: { id: number }) => row.id);
    expect(ids.length).toBeGreaterThan(1);

    const target = [...ids].reverse();

    await request(app.getHttpServer())
      .patch('/education/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: target })
      .expect(200);

    const after = await request(app.getHttpServer())
      .get('/education')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const orderedIds: number[] = after.body.map(
      (row: { id: number }) => row.id,
    );
    expect(orderedIds).toEqual(target);
  });

  it('rejects a reorder whose id set does not match the owned rows', async () => {
    const listing = await request(app.getHttpServer())
      .get('/education')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const ids: number[] = listing.body.map((row: { id: number }) => row.id);

    await request(app.getHttpServer())
      .patch('/education/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [...ids, 999999] })
      .expect(400);
  });

  it('rejects unauthenticated reorder requests', async () => {
    await request(app.getHttpServer())
      .patch('/education/reorder')
      .send({ ids: [1, 2, 3] })
      .expect(401);

    await request(app.getHttpServer())
      .patch('/projects/reorder')
      .send({ ids: [1, 2, 3] })
      .expect(401);
  });
});
```

- [ ] **Step 3: Bring up the e2e database, migrate, and seed**

Ensure the e2e PostgreSQL is running (Docker Compose on port 55432 — see `docker-compose.e2e.yml`), then:

Run: `npm run prisma:e2e:migrate`
Expected: applies all migrations including `add_content_order` to the e2e database.

Run: `npm run prisma:e2e:seed`
Expected: seeds the e2e user and 12 education rows.

- [ ] **Step 4: Run the e2e suite to verify it passes**

Run: `npm run test:e2e`
Expected: PASS — the existing `app.e2e-spec.ts` plus the 3 new reorder cases all green.

> If the happy-path assertion is flaky because seeded rows share `order = 0`, that is expected only on the FIRST read; the test asserts order only AFTER a reorder (which assigns distinct `order` values), so the post-reorder sequence is deterministic. No tiebreaker is required.

- [ ] **Step 5: Commit**

```bash
git add backend/test/helpers/auth.ts backend/test/reorder.e2e-spec.ts
git commit -m "test(content): add authenticated reorder e2e and login helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Data model + migration (`order` on 4 tables + ROW_NUMBER backfill) → Task 1. ✅
- Reorder endpoints for projects/experience/education/courses/custom-sections/items with exact-set validation + `$transaction` → Tasks 3–8, exact-set logic centralized in Task 2. ✅
- Guards `JwtAuthGuard → ActiveUserGuard` (class-level, unchanged) + ownership in service → each reorder loads the caller's owned id set; items additionally re-check `section.user_id`/role. ✅
- Ordered reads — dashboard lists (`orderBy` in each module's `findAll`, Tasks 3–7) + public (Task 9). ✅
- Testing — backend unit (exact-set, ownership, transaction call) Tasks 2–8; backend e2e (happy/400/401) Task 10. Frontend Playwright owns public-ordering behavior (spec). ✅
- Spec's "in-memory repository for unit tests" constraint → corrected in Global Constraints to the real `jest.fn()` convention. ✅

**Deliberate spec deviations (flag at handoff):**
1. Backend e2e happy-path uses **education** (pre-seeded) rather than projects/custom-items. Rationale + coverage documented in Task 10.
2. Public-ordering behavior is verified by build + frontend Playwright, not a backend behavioral test (Task 9), since the public route is unauthenticated and the change is query-only.

**Type consistency:** `findIdsByUser`/`reorder` names are uniform across projects/experience/education/courses; custom-sections uses `findSectionIdsByUser`/`reorderSections` and `findItemIdsBySection`/`reorderItems`. `assertExactIdSet(ownedIds, submittedIds)` and `ReorderDto.ids` are referenced identically everywhere. Service `reorder(userId, ids)` signature is uniform except `reorderItems(sectionId, ids, userId, role)` (needs section + role for ownership) and `reorderSections(userId, ids)`.

**Placeholder scan:** none — every code step contains complete code and exact commands.
