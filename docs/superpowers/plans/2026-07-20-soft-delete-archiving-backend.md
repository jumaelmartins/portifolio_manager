# Soft-Delete / Archiving — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two independent soft states (archived, trash) to all six content entities on the NestJS/Prisma backend, exposed through `?state` reads and per-state transition endpoints, with the public site showing only active items.

**Architecture:** Two nullable timestamp columns (`archived_at`, `deleted_at`) per table; state is derived (`deleted_at` dominates → trash, else `archived_at` → archived, else active). A shared `content-state` helper maps a state to a Prisma `where` fragment. Existing `DELETE` becomes soft (to trash); new `PATCH :id/{archive,unarchive,restore}` and `DELETE :id/purge` cover the rest. Auditing is unchanged — the existing Prisma middleware logs soft-deletes as UPDATE and purges as DELETE for free.

**Tech Stack:** NestJS 11, Prisma 6 (PostgreSQL), Jest + Supertest.

## Global Constraints

- Never implement on `master` — work on branch `feat/soft-delete-archiving` (already created).
- Commit trailer exactly: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Do not push to origin unless explicitly asked.
- After any Prisma schema change, run `npm run prisma:dev:generate`.
- Backend module pattern: service depends on a repository. **Only `custom-sections` and the four content modules have Prisma repositories; none of the six has an in-memory repo — unit tests inject a plain mock repository object (`new Service(mock as never)`).**
- Static/suffixed routes are declared before bare `:id` routes.
- **Prisma partial-index drift (from Task 1):** `f_projects` keeps a partial unique index (`WHERE deleted_at IS NULL`) that the schema cannot declare. When generating any *future* migration with `prisma migrate dev`, delete any auto-generated `DROP INDEX "f_projects_f_userId_title_key"` line before applying — the index must survive.
- All backend commands run from `backend/`.
- State derivation everywhere: `deleted_at != null` → TRASH (dominates); else `archived_at != null` → ARCHIVED; else ACTIVE.

---

### Task 1: Schema — soft-delete columns + partial unique index

**Files:**
- Modify: `backend/prisma/schema.prisma` (models `f_experience`, `f_education`, `f_courses`, `f_projects`, `custom_section`, `custom_section_item`)
- Create: `backend/prisma/migrations/<timestamp>_add_soft_delete_columns/migration.sql` (generated, then hand-edited)

**Interfaces:**
- Produces: two nullable columns `archived_at DateTime?` and `deleted_at DateTime?` on all six content tables; a partial unique index on `f_projects("f_userId","title") WHERE deleted_at IS NULL`; a regenerated Prisma client exposing the new fields.

- [ ] **Step 1: Add the two columns to each of the six models**

In `schema.prisma`, add these two lines to `f_experience`, `f_education`, `f_courses`, `f_projects`, `custom_section`, and `custom_section_item` (place them just before each model's `created_at` line):

```prisma
  archived_at  DateTime?
  deleted_at   DateTime?
```

- [ ] **Step 2: Remove the full unique constraint from `f_projects`**

In the `f_projects` model, delete this line:

```prisma
  @@unique([f_userId, title])
```

- [ ] **Step 3: Generate the migration SQL only (do not apply yet)**

Run: `npm run prisma:dev:migrate -- --name add_soft_delete_columns --create-only`
Expected: a new folder `prisma/migrations/<timestamp>_add_soft_delete_columns/migration.sql` is created. It contains six `ALTER TABLE ... ADD COLUMN "archived_at" ..., ADD COLUMN "deleted_at" ...` statements (tables `f_experience`, `f_education`, `f_courses`, `f_projects`, `custom_sections`, `custom_section_items`) and a `DROP INDEX "public"."f_projects_f_userId_title_key";`.

- [ ] **Step 4: Hand-edit the migration to recreate the index as partial**

Open the generated `migration.sql` and append at the end (keep the generated `DROP INDEX` line above it):

```sql
-- Partial unique index: only live (non-trashed) projects must have a unique (user, title).
-- Prisma 6 cannot express this declaratively; it is maintained by raw SQL.
CREATE UNIQUE INDEX "f_projects_f_userId_title_key"
ON "public"."f_projects"("f_userId", "title")
WHERE "deleted_at" IS NULL;
```

- [ ] **Step 5: Apply the migration without a drift re-diff**

Run: `npx dotenv -e .env.development -- prisma migrate deploy`
Expected: `Applying migration <timestamp>_add_soft_delete_columns` then `All migrations have been successfully applied.` (`deploy` runs pending migrations without the post-apply drift check that would otherwise flag the partial index.)

- [ ] **Step 6: Regenerate the Prisma client**

Run: `npm run prisma:dev:generate`
Expected: `Generated Prisma Client`. The generated types for the six models now include `archived_at: Date | null` and `deleted_at: Date | null`.

- [ ] **Step 7: Verify the project still compiles**

Run: `npm run build`
Expected: build succeeds (existing code is unaffected; new fields are optional).

- [ ] **Step 8: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(backend): add soft-delete columns and partial project-title index"
```

---

### Task 2: `content-state` helper

**Files:**
- Create: `backend/src/common/content-state.ts`
- Test: `backend/src/common/content-state.spec.ts`

**Interfaces:**
- Produces:
  - `type ContentState = 'active' | 'archived' | 'trash'`
  - `parseContentState(raw?: string): ContentState` — defaults to `'active'`, throws `BadRequestException` on an unknown value.
  - `contentStateWhere(state: ContentState)` — returns a `where` fragment: active `{ archived_at: null, deleted_at: null }`, archived `{ archived_at: { not: null }, deleted_at: null }`, trash `{ deleted_at: { not: null } }`.

- [ ] **Step 1: Write the failing test**

Create `backend/src/common/content-state.spec.ts`:

```typescript
import { BadRequestException } from '@nestjs/common';
import {
  parseContentState,
  contentStateWhere,
} from './content-state';

describe('content-state', () => {
  describe('parseContentState', () => {
    it('defaults to active when missing or empty', () => {
      expect(parseContentState(undefined)).toBe('active');
      expect(parseContentState('')).toBe('active');
    });

    it('accepts the three known states', () => {
      expect(parseContentState('active')).toBe('active');
      expect(parseContentState('archived')).toBe('archived');
      expect(parseContentState('trash')).toBe('trash');
    });

    it('rejects an unknown state', () => {
      expect(() => parseContentState('deleted')).toThrow(BadRequestException);
    });
  });

  describe('contentStateWhere', () => {
    it('active means both timestamps null', () => {
      expect(contentStateWhere('active')).toEqual({
        archived_at: null,
        deleted_at: null,
      });
    });

    it('archived means archived set and not trashed', () => {
      expect(contentStateWhere('archived')).toEqual({
        archived_at: { not: null },
        deleted_at: null,
      });
    });

    it('trash means deleted set (dominates)', () => {
      expect(contentStateWhere('trash')).toEqual({
        deleted_at: { not: null },
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --testPathPattern=content-state`
Expected: FAIL — `Cannot find module './content-state'`.

- [ ] **Step 3: Write the implementation**

Create `backend/src/common/content-state.ts`:

```typescript
import { BadRequestException } from '@nestjs/common';

export type ContentState = 'active' | 'archived' | 'trash';

type StateWhere = {
  archived_at?: null | { not: null };
  deleted_at?: null | { not: null };
};

/**
 * Parses the `?state` query value. Defaults to 'active' (identical to the
 * pre-soft-delete behaviour); throws on any unknown value.
 */
export function parseContentState(raw?: string): ContentState {
  if (!raw) return 'active';
  if (raw === 'active' || raw === 'archived' || raw === 'trash') {
    return raw;
  }
  throw new BadRequestException(`Invalid state '${raw}'`);
}

/**
 * Prisma `where` fragment selecting rows in the given state. Column names are
 * shared by all six content tables, so the fragment is model-agnostic.
 */
export function contentStateWhere(state: ContentState): StateWhere {
  switch (state) {
    case 'archived':
      return { archived_at: { not: null }, deleted_at: null };
    case 'trash':
      return { deleted_at: { not: null } };
    case 'active':
    default:
      return { archived_at: null, deleted_at: null };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --testPathPattern=content-state`
Expected: PASS (3 + 3 assertions).

- [ ] **Step 5: Commit**

```bash
git add backend/src/common/content-state.ts backend/src/common/content-state.spec.ts
git commit -m "feat(backend): add content-state helper for soft-delete reads"
```

---

### Task 3: Projects — state reads + transitions

**Files:**
- Modify: `backend/src/modules/projects/repository/projects.repository.ts`
- Modify: `backend/src/modules/projects/projects.service.ts`
- Modify: `backend/src/modules/projects/projects.controller.ts`
- Test: `backend/src/modules/projects/repository/projects.repository.spec.ts` (update + add)
- Test: `backend/src/modules/projects/projects.service.spec.ts` (add)

**Interfaces:**
- Consumes: `ContentState`, `contentStateWhere`, `parseContentState` from `../../common/content-state` (repo/service paths adjust the `../`).
- Produces on `ProjectRepository`: `findAll(userId, state?)`, `archive(id, userId)`, `unarchive(id, userId)`, `softDelete(id, userId)`, `restore(id, userId)` (all return the project incl. `projectInclude`); `delete(id, userId)` unchanged (hard, used by purge). `findByTitle` and `findIdsByUser` now exclude trashed/archived rows.
- Produces on `ProjectsService`: `findAll(userId, state?)`, `archive/unarchive/restore/purge(id, userId)`; `delete(id, userId)` is now soft.
- Produces routes: `GET /projects?state=`, `PATCH /projects/:id/archive|unarchive|restore`, `DELETE /projects/:id/purge`; `DELETE /projects/:id` is now soft.

- [ ] **Step 1: Update the two existing repository assertions to expect state filters**

In `projects.repository.spec.ts`, the test `'scopes list and lookups to the authenticated user'` currently expects bare `where` clauses. Replace its three `expect(...)` blocks with:

```typescript
    expect(projects.findMany).toHaveBeenCalledWith({
      where: { f_userId: 42, archived_at: null, deleted_at: null },
      include,
      orderBy: { order: 'asc' },
    });
    expect(projects.findFirst).toHaveBeenNthCalledWith(1, {
      where: { id: 7, f_userId: 42 },
      include,
    });
    expect(projects.findFirst).toHaveBeenNthCalledWith(2, {
      where: { title: 'Portfolio', f_userId: 42, deleted_at: null },
      include,
    });
```

- [ ] **Step 2: Add repository tests for the new state reads and transitions**

Append inside the `describe('ProjectRepository', ...)` block (before its closing `});`):

```typescript
  it('filters the archived list', async () => {
    await repository.findAll(42, 'archived');

    expect(projects.findMany).toHaveBeenCalledWith({
      where: { f_userId: 42, archived_at: { not: null }, deleted_at: null },
      include,
      orderBy: { order: 'asc' },
    });
  });

  it('reorder id source excludes archived and trashed rows', async () => {
    projects.findMany.mockResolvedValue([{ id: 3 }, { id: 1 }]);

    await repository.findIdsByUser(42);

    expect(projects.findMany).toHaveBeenCalledWith({
      where: { f_userId: 42, archived_at: null, deleted_at: null },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
  });

  it('archives, trashes and restores by stamping timestamps', async () => {
    await repository.archive(7, 42);
    await repository.softDelete(7, 42);
    await repository.restore(7, 42);
    await repository.unarchive(7, 42);

    expect(projects.update).toHaveBeenNthCalledWith(1, {
      where: { id: 7, f_userId: 42 },
      data: { archived_at: expect.any(Date) },
      include,
    });
    expect(projects.update).toHaveBeenNthCalledWith(2, {
      where: { id: 7, f_userId: 42 },
      data: { deleted_at: expect.any(Date) },
      include,
    });
    expect(projects.update).toHaveBeenNthCalledWith(3, {
      where: { id: 7, f_userId: 42 },
      data: { deleted_at: null },
      include,
    });
    expect(projects.update).toHaveBeenNthCalledWith(4, {
      where: { id: 7, f_userId: 42 },
      data: { archived_at: null },
      include,
    });
  });
```

- [ ] **Step 3: Run the repository tests to verify they fail**

Run: `npm run test -- --testPathPattern=projects.repository`
Expected: FAIL — `repository.archive is not a function` and the two updated assertions mismatch.

- [ ] **Step 4: Update the repository implementation**

In `projects.repository.ts`, add the import and edit the four methods, then add the four transitions. Replace `findAll`, `findByTitle`, `findIdsByUser` and add the transitions (leave `delete(id, userId)` as-is):

```typescript
import { ContentState, contentStateWhere } from '../../../common/content-state';
```

```typescript
  async findAll(userId: number, state: ContentState = 'active') {
    return this.prismaService.f_projects.findMany({
      where: { f_userId: userId, ...contentStateWhere(state) },
      include: projectInclude,
      orderBy: { order: 'asc' },
    });
  }
```

```typescript
  async findByTitle(title: string, userId: number) {
    return this.prismaService.f_projects.findFirst({
      where: { title, f_userId: userId, deleted_at: null },
      include: projectInclude,
    });
  }
```

```typescript
  async findIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prismaService.f_projects.findMany({
      where: { f_userId: userId, archived_at: null, deleted_at: null },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async archive(id: number, userId: number) {
    return this.prismaService.f_projects.update({
      where: { id, f_userId: userId },
      data: { archived_at: new Date() },
      include: projectInclude,
    });
  }

  async unarchive(id: number, userId: number) {
    return this.prismaService.f_projects.update({
      where: { id, f_userId: userId },
      data: { archived_at: null },
      include: projectInclude,
    });
  }

  async softDelete(id: number, userId: number) {
    return this.prismaService.f_projects.update({
      where: { id, f_userId: userId },
      data: { deleted_at: new Date() },
      include: projectInclude,
    });
  }

  async restore(id: number, userId: number) {
    return this.prismaService.f_projects.update({
      where: { id, f_userId: userId },
      data: { deleted_at: null },
      include: projectInclude,
    });
  }
```

- [ ] **Step 5: Run the repository tests to verify they pass**

Run: `npm run test -- --testPathPattern=projects.repository`
Expected: PASS.

- [ ] **Step 6: Add service tests for transitions (write the failing tests)**

Append inside `describe('ProjectsService', ...)` in `projects.service.spec.ts` (before its closing `});`):

```typescript
  describe('soft-delete transitions', () => {
    it('archives a project the user owns', async () => {
      repository.findById.mockResolvedValue({ id: 7, f_userId: 42 });
      repository.archive.mockResolvedValue({ id: 7 });

      await service.archive(7, 42);

      expect(repository.findById).toHaveBeenCalledWith(7, 42);
      expect(repository.archive).toHaveBeenCalledWith(7, 42);
    });

    it('delete now trashes (soft) instead of hard-deleting', async () => {
      repository.findById.mockResolvedValue({ id: 7, f_userId: 42 });
      repository.softDelete.mockResolvedValue({ id: 7 });

      await service.delete(7, 42);

      expect(repository.softDelete).toHaveBeenCalledWith(7, 42);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('rejects restore when a live project reuses the title', async () => {
      repository.findById.mockResolvedValue({ id: 7, f_userId: 42, title: 'Dup' });
      repository.findByTitle.mockResolvedValue({ id: 9, f_userId: 42, title: 'Dup' });

      await expect(service.restore(7, 42)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.restore).not.toHaveBeenCalled();
    });

    it('restores when no live project holds the title', async () => {
      repository.findById.mockResolvedValue({ id: 7, f_userId: 42, title: 'Free' });
      repository.findByTitle.mockResolvedValue(null);
      repository.restore.mockResolvedValue({ id: 7 });

      await service.restore(7, 42);

      expect(repository.restore).toHaveBeenCalledWith(7, 42);
    });

    it('purges only a project already in trash', async () => {
      repository.findById.mockResolvedValue({ id: 7, f_userId: 42, deleted_at: null });

      await expect(service.purge(7, 42)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('purges a trashed project with a hard delete', async () => {
      repository.findById.mockResolvedValue({
        id: 7,
        f_userId: 42,
        deleted_at: new Date(),
      });
      repository.delete.mockResolvedValue({ id: 7 });

      await service.purge(7, 42);

      expect(repository.delete).toHaveBeenCalledWith(7, 42);
    });
  });
```

Also add `archive`, `unarchive`, `softDelete`, `restore` to the `repository` mock object at the top of the file (it already has `delete`, `findById`, `findByTitle`):

```typescript
    archive: jest.fn(),
    unarchive: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
```

- [ ] **Step 7: Run the service tests to verify they fail**

Run: `npm run test -- --testPathPattern=projects.service`
Expected: FAIL — `service.archive is not a function`.

- [ ] **Step 8: Update the service implementation**

In `projects.service.ts`, add the import, change `findAll` and `delete`, and add the new methods. Add near the other imports:

```typescript
import { parseContentState } from '../../common/content-state';
```

Replace `findAll`:

```typescript
  async findAll(userId: number, state?: string) {
    const projects = await this.projectRepository.findAll(
      userId,
      parseContentState(state),
    );
    return projects.map((project) => this.presentProject(project));
  }
```

Replace the existing `delete` method and add the transitions immediately after it:

```typescript
  async delete(id: number, userId: number) {
    await this.requireOwned(id, userId);
    return this.presentProject(
      await this.projectRepository.softDelete(id, userId),
    );
  }

  async archive(id: number, userId: number) {
    await this.requireOwned(id, userId);
    return this.presentProject(await this.projectRepository.archive(id, userId));
  }

  async unarchive(id: number, userId: number) {
    await this.requireOwned(id, userId);
    return this.presentProject(
      await this.projectRepository.unarchive(id, userId),
    );
  }

  async restore(id: number, userId: number) {
    const project = await this.requireOwned(id, userId);
    const clash = await this.projectRepository.findByTitle(project.title, userId);
    if (clash && clash.id !== id) {
      throw new ConflictException('Project Already Exists');
    }
    return this.presentProject(await this.projectRepository.restore(id, userId));
  }

  async purge(id: number, userId: number) {
    const project = await this.requireOwned(id, userId);
    if (!project.deleted_at) {
      throw new NotFoundException('Project Not Found');
    }
    return this.projectRepository.delete(id, userId);
  }

  private async requireOwned(id: number, userId: number) {
    const project = await this.projectRepository.findById(id, userId);
    if (!project) {
      throw new NotFoundException('Project Not Found');
    }
    return project;
  }
```

(`ConflictException` and `NotFoundException` are already imported in this file.)

- [ ] **Step 9: Run the service tests to verify they pass**

Run: `npm run test -- --testPathPattern=projects.service`
Expected: PASS.

- [ ] **Step 10: Wire the controller**

In `projects.controller.ts`, add `Query` to the `@nestjs/common` import, read `state` in `findAll`, and add the four action routes. Replace `findAll` and insert the action routes right after the `reorder` handler (before `update`):

```typescript
  @Get()
  findAll(
    @Query('state') state: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.findAll(Number(req.user.sub), state);
  }
```

```typescript
  @Patch(':id/archive')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.archive(id, Number(req.user.sub));
  }

  @Patch(':id/unarchive')
  unarchive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.unarchive(id, Number(req.user.sub));
  }

  @Patch(':id/restore')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.restore(id, Number(req.user.sub));
  }

  @Delete(':id/purge')
  purge(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.purge(id, Number(req.user.sub));
  }
```

- [ ] **Step 11: Verify build and full module tests pass**

Run: `npm run build && npm run test -- --testPathPattern=projects`
Expected: build succeeds; all projects tests PASS.

- [ ] **Step 12: Commit**

```bash
git add backend/src/modules/projects
git commit -m "feat(backend): soft-delete, archive and purge for projects"
```

---

### Task 4: Experience, Education, Courses — state reads + transitions

These three modules are structurally identical (each has a Prisma repository with `findAll(userId?)`, `findById(id)`, `delete(id)`, `findIdsByUser`; a service with `findAll(userId, role)`, `remove(id, userId, role)`; a controller with `@Delete(':id') remove`). Implement **experience** in full (Steps 1–7), then apply the **exact same** edits to **education** and **courses** (Step 8) using this substitution:

| | experience | education | courses |
|---|---|---|---|
| Prisma delegate | `f_experience` | `f_education` | `f_courses` |
| Repository file | `modules/experience/repository/experience.repository.ts` | `modules/education/repository/education.repository.ts` | `modules/courses/repository/courses.repository.ts` |
| Service file | `modules/experience/experience.service.ts` | `modules/education/education.service.ts` | `modules/courses/courses.service.ts` |
| Controller file | `modules/experience/experience.controller.ts` | `modules/education/education.controller.ts` | `modules/courses/courses.controller.ts` |
| Service spec | `experience.service.spec.ts` | `education.service.spec.ts` | `courses.service.spec.ts` |
| Not-found msg | `Experience Not Found` | `Education Not Found` | `Course Not Found` |

**Interfaces:**
- Consumes: `ContentState`, `contentStateWhere`, `parseContentState` from `../../common/content-state` / `../../../common/content-state`.
- Produces per repository: `findAll(userId?, state?)`, `archive(id)`, `unarchive(id)`, `softDelete(id)`, `restore(id)`; `delete(id)` unchanged (hard).
- Produces per service: `findAll(userId, role, state?)`, `archive/unarchive/restore/purge(id, userId, role)`; `remove(id, userId, role)` is now soft.
- Produces routes per controller: `GET /{e}?state=`, `PATCH /{e}/:id/archive|unarchive|restore`, `DELETE /{e}/:id/purge`; `DELETE /{e}/:id` is now soft.

- [ ] **Step 1: Add experience repository transitions + state read**

In `experience.repository.ts`, add the import, edit `findAll` and `findIdsByUser`, and add the four transitions (leave `delete(id)` as-is):

```typescript
import { ContentState, contentStateWhere } from '../../../common/content-state';
```

```typescript
  async findAll(
    userId?: number,
    state: ContentState = 'active',
  ): Promise<f_experience[]> {
    return await this.prismaService.f_experience.findMany({
      where: { ...(userId ? { f_userId: userId } : {}), ...contentStateWhere(state) },
      orderBy: { order: 'asc' },
    });
  }
```

```typescript
  async findIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prismaService.f_experience.findMany({
      where: { f_userId: userId, archived_at: null, deleted_at: null },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async archive(id: number) {
    return this.prismaService.f_experience.update({
      where: { id },
      data: { archived_at: new Date() },
    });
  }

  async unarchive(id: number) {
    return this.prismaService.f_experience.update({
      where: { id },
      data: { archived_at: null },
    });
  }

  async softDelete(id: number) {
    return this.prismaService.f_experience.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restore(id: number) {
    return this.prismaService.f_experience.update({
      where: { id },
      data: { deleted_at: null },
    });
  }
```

- [ ] **Step 2: Add the failing service tests**

In `experience.service.spec.ts`, add the new repo methods to the mock object (it already lists `create`, `findAll`, `findById`, `update`, `delete`, `findIdsByUser`, `reorder`):

```typescript
    archive: jest.fn(),
    unarchive: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
```

Add the import at the top:

```typescript
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRoles } from '../../utils/types';
```

Append inside `describe('ExperienceService', ...)`:

```typescript
  describe('soft-delete transitions', () => {
    const OWNER = 42;
    const owned = { id: 7, f_userId: OWNER, deleted_at: null };

    it('archives a row the user owns', async () => {
      repository.findById.mockResolvedValue(owned);

      await service.archive(7, OWNER, UserRoles.REGULAR);

      expect(repository.archive).toHaveBeenCalledWith(7);
    });

    it('remove now trashes (soft) instead of hard-deleting', async () => {
      repository.findById.mockResolvedValue(owned);

      await service.remove(7, OWNER, UserRoles.REGULAR);

      expect(repository.softDelete).toHaveBeenCalledWith(7);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('forbids a transition on another user row', async () => {
      repository.findById.mockResolvedValue({ id: 7, f_userId: 99, deleted_at: null });

      await expect(
        service.archive(7, OWNER, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('purges only a trashed row', async () => {
      repository.findById.mockResolvedValue({ ...owned, deleted_at: null });

      await expect(
        service.purge(7, OWNER, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('purges a trashed row with a hard delete', async () => {
      repository.findById.mockResolvedValue({ ...owned, deleted_at: new Date() });

      await service.purge(7, OWNER, UserRoles.REGULAR);

      expect(repository.delete).toHaveBeenCalledWith(7);
    });

    it('reads the requested state', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll(OWNER, UserRoles.REGULAR, 'trash');

      expect(repository.findAll).toHaveBeenCalledWith(OWNER, 'trash');
    });
  });
```

- [ ] **Step 3: Run the service tests to verify they fail**

Run: `npm run test -- --testPathPattern=experience.service`
Expected: FAIL — `service.archive is not a function`.

- [ ] **Step 4: Update the experience service**

In `experience.service.ts`, add the import, change `findAll` and `remove`, and add the transitions + ownership helper:

```typescript
import { parseContentState } from '../../common/content-state';
```

Replace `findAll`:

```typescript
  async findAll(userId: number, role: number, state?: string) {
    const filterUserId = role === UserRoles.SYSADMIN ? undefined : userId;
    return await this.experienceRepository.findAll(
      filterUserId,
      parseContentState(state),
    );
  }
```

Replace `remove` and add the rest after it:

```typescript
  async remove(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.experienceRepository.softDelete(id);
  }

  async archive(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.experienceRepository.archive(id);
  }

  async unarchive(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.experienceRepository.unarchive(id);
  }

  async restore(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.experienceRepository.restore(id);
  }

  async purge(id: number, userId: number, role: number) {
    const row = await this.requireOwned(id, userId, role);
    if (!row.deleted_at) {
      throw new NotFoundException('Experience Not Found');
    }
    return this.experienceRepository.delete(id);
  }

  private async requireOwned(id: number, userId: number, role: number) {
    const row = await this.experienceRepository.findById(id);
    if (!row) throw new NotFoundException('Experience Not Found');
    if (row.f_userId !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException(
        'You do not have permission to modify this resource',
      );
    }
    return row;
  }
```

- [ ] **Step 5: Run the service tests to verify they pass**

Run: `npm run test -- --testPathPattern=experience.service`
Expected: PASS.

- [ ] **Step 6: Wire the experience controller**

In `experience.controller.ts`, add `Query` to the `@nestjs/common` import, read `state` in `findAll`, and add the four action routes after `reorder`:

```typescript
  @Get()
  findAll(
    @Query('state') state: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.experienceService.findAll(
      Number(req.user.sub),
      Number(req.user.role),
      state,
    );
  }
```

```typescript
  @Patch(':id/archive')
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.experienceService.archive(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.experienceService.unarchive(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.experienceService.restore(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id/purge')
  purge(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.experienceService.purge(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }
```

- [ ] **Step 7: Verify experience build + tests**

Run: `npm run build && npm run test -- --testPathPattern=experience`
Expected: PASS.

- [ ] **Step 8: Apply Steps 1–7 to education and courses**

Repeat every edit from Steps 1–7 for **education** and **courses** using the substitution table above. Concretely, for each of the two modules:
- Repository: same import (`../../../common/content-state`), same `findAll(userId?, state?)`, same `findIdsByUser` active filter, same four transitions — with the delegate swapped (`f_education` / `f_courses`).
- Service: same `parseContentState` import, same `findAll(userId, role, state?)`, same `remove` (soft) + `archive/unarchive/restore/purge/requireOwned` — with the not-found message from the table (`Education Not Found` / `Course Not Found`). Note: `courses` uses the field name `coursesRepository`; `education` uses `educationRepository`.
- Controller: same `Query` import, same `findAll` state read, same four action routes — calling `educationService` / `coursesService`.
- Service spec: same mock additions (`archive/unarchive/softDelete/restore`), same imports, same `describe('soft-delete transitions', ...)` block — with the service variable and not-found message adjusted.

Run after each module: `npm run test -- --testPathPattern=education` then `npm run test -- --testPathPattern=courses`. Expected: PASS.

- [ ] **Step 9: Verify build + all three modules**

Run: `npm run build && npm run test -- --testPathPattern="experience|education|courses"`
Expected: build succeeds; all PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/src/modules/experience backend/src/modules/education backend/src/modules/courses
git commit -m "feat(backend): soft-delete, archive and purge for experience/education/courses"
```

---

### Task 5: Custom sections & items — state reads + transitions

**Files:**
- Modify: `backend/src/modules/custom-sections/repository/custom-sections.repository.ts`
- Modify: `backend/src/modules/custom-sections/custom-sections.service.ts`
- Modify: `backend/src/modules/custom-sections/custom-sections.controller.ts`
- Test: `backend/src/modules/custom-sections/custom-sections.service.spec.ts` (add)

**Interfaces:**
- Consumes: `ContentState`, `contentStateWhere`, `parseContentState` from `../../common/content-state` / `../../../common/content-state`.
- Produces on the repository: `findSectionsByUser(userId, state?)` (embedded items filtered to active), `findItemsBySection(sectionId, state?)`, section transitions `archiveSection/unarchiveSection/softDeleteSection/restoreSection(id)`, item transitions `archiveItem/unarchiveItem/softDeleteItem/restoreItem(id)`; `deleteSection(id)` / `deleteItem(id)` unchanged (hard); `findSectionIdsByUser` and `findItemIdsBySection` now exclude archived/trashed.
- Produces on the service: `findUserSections(userId, state?)`, `findSectionItems(sectionId, userId, role, state?)`, `archiveSection/unarchiveSection/restoreSection/purgeSection(id, userId, role)`, `archiveItem/unarchiveItem/restoreItem/purgeItem(itemId, userId, role)`; `deleteSection` / `deleteItem` now soft.
- Produces routes: `GET /custom-sections?state=`, `GET /custom-sections/:sectionId/items?state=`, `PATCH /custom-sections/:id/archive|unarchive|restore`, `DELETE /custom-sections/:id/purge`, `PATCH /custom-sections/items/:itemId/archive|unarchive|restore`, `DELETE /custom-sections/items/:itemId/purge`; `DELETE /custom-sections/:id` and `DELETE /custom-sections/items/:itemId` are now soft.

- [ ] **Step 1: Add the failing service tests**

In `custom-sections.service.spec.ts`, extend the `repository` mock object with the new methods:

```typescript
    findItemsBySection: jest.fn(),
    archiveSection: jest.fn(),
    unarchiveSection: jest.fn(),
    softDeleteSection: jest.fn(),
    restoreSection: jest.fn(),
    archiveItem: jest.fn(),
    unarchiveItem: jest.fn(),
    softDeleteItem: jest.fn(),
    restoreItem: jest.fn(),
```

Append inside `describe('CustomSectionsService', ...)`:

```typescript
  describe('section transitions', () => {
    it('archives a section the user owns', async () => {
      repository.findSectionById.mockResolvedValue({ id: 5, user_id: 42, items: [] });

      await service.archiveSection(5, 42, UserRoles.REGULAR);

      expect(repository.archiveSection).toHaveBeenCalledWith(5);
    });

    it('deleteSection now trashes (soft)', async () => {
      repository.findSectionById.mockResolvedValue({ id: 5, user_id: 42, items: [] });

      await service.deleteSection(5, 42, UserRoles.REGULAR);

      expect(repository.softDeleteSection).toHaveBeenCalledWith(5);
      expect(repository.deleteSection).not.toHaveBeenCalled();
    });

    it('forbids a transition on another user section', async () => {
      repository.findSectionById.mockResolvedValue({ id: 5, user_id: 99, items: [] });

      await expect(
        service.archiveSection(5, 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('purges only a trashed section', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 42,
        items: [],
        deleted_at: null,
      });

      await expect(
        service.purgeSection(5, 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.deleteSection).not.toHaveBeenCalled();
    });
  });

  describe('item transitions', () => {
    const ownedItem = { id: 8, deleted_at: null, section: { user_id: 42 } };

    it('archives an item the user owns', async () => {
      repository.findItemById.mockResolvedValue(ownedItem);

      await service.archiveItem(8, 42, UserRoles.REGULAR);

      expect(repository.archiveItem).toHaveBeenCalledWith(8);
    });

    it('deleteItem now trashes (soft)', async () => {
      repository.findItemById.mockResolvedValue(ownedItem);

      await service.deleteItem(8, 42, UserRoles.REGULAR);

      expect(repository.softDeleteItem).toHaveBeenCalledWith(8);
      expect(repository.deleteItem).not.toHaveBeenCalled();
    });

    it('purges only a trashed item', async () => {
      repository.findItemById.mockResolvedValue(ownedItem);

      await expect(
        service.purgeItem(8, 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.deleteItem).not.toHaveBeenCalled();
    });

    it('lists items in a given state for the owner', async () => {
      repository.findSectionById.mockResolvedValue({ id: 5, user_id: 42, items: [] });
      repository.findItemsBySection.mockResolvedValue([{ id: 8 }]);

      const result = await service.findSectionItems(5, 42, UserRoles.REGULAR, 'trash');

      expect(repository.findItemsBySection).toHaveBeenCalledWith(5, 'trash');
      expect(result).toEqual([{ id: 8 }]);
    });
  });
```

`NotFoundException` is already imported in this spec's SUT; add it to the spec's import from `@nestjs/common` (currently `BadRequestException, ForbiddenException`):

```typescript
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
```

- [ ] **Step 2: Run the service tests to verify they fail**

Run: `npm run test -- --testPathPattern=custom-sections.service`
Expected: FAIL — `service.archiveSection is not a function`.

- [ ] **Step 3: Update the repository**

In `custom-sections.repository.ts`, add the import; edit `findSectionsByUser`, `findSectionIdsByUser`, `findItemIdsBySection`; add `findItemsBySection` and the eight transitions (leave `deleteSection` / `deleteItem` hard):

```typescript
import { ContentState, contentStateWhere } from '../../../common/content-state';
```

```typescript
  async findSectionsByUser(userId: number, state: ContentState = 'active') {
    return this.prisma.custom_section.findMany({
      where: { user_id: userId, ...contentStateWhere(state) },
      include: {
        items: {
          where: { archived_at: null, deleted_at: null },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }
```

```typescript
  async findSectionIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prisma.custom_section.findMany({
      where: { user_id: userId, archived_at: null, deleted_at: null },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }
```

```typescript
  async findItemsBySection(sectionId: number, state: ContentState = 'active') {
    return this.prisma.custom_section_item.findMany({
      where: { section_id: sectionId, ...contentStateWhere(state) },
      orderBy: { order: 'asc' },
    });
  }

  async findItemIdsBySection(sectionId: number): Promise<number[]> {
    const rows = await this.prisma.custom_section_item.findMany({
      where: { section_id: sectionId, archived_at: null, deleted_at: null },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async archiveSection(id: number) {
    return this.prisma.custom_section.update({
      where: { id },
      data: { archived_at: new Date() },
    });
  }

  async unarchiveSection(id: number) {
    return this.prisma.custom_section.update({
      where: { id },
      data: { archived_at: null },
    });
  }

  async softDeleteSection(id: number) {
    return this.prisma.custom_section.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restoreSection(id: number) {
    return this.prisma.custom_section.update({
      where: { id },
      data: { deleted_at: null },
    });
  }

  async archiveItem(id: number) {
    return this.prisma.custom_section_item.update({
      where: { id },
      data: { archived_at: new Date() },
    });
  }

  async unarchiveItem(id: number) {
    return this.prisma.custom_section_item.update({
      where: { id },
      data: { archived_at: null },
    });
  }

  async softDeleteItem(id: number) {
    return this.prisma.custom_section_item.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restoreItem(id: number) {
    return this.prisma.custom_section_item.update({
      where: { id },
      data: { deleted_at: null },
    });
  }
```

Replace `findItemIdsBySection` in place (it already exists — apply the active filter above; do not create a duplicate).

- [ ] **Step 4: Update the service**

In `custom-sections.service.ts`, add the import, change `findUserSections`, `deleteSection`, `deleteItem`, and add the new methods + two ownership helpers:

```typescript
import { parseContentState } from '../../common/content-state';
```

Replace `findUserSections`:

```typescript
  async findUserSections(userId: number, state?: string) {
    return this.repository.findSectionsByUser(userId, parseContentState(state));
  }

  async findSectionItems(
    sectionId: number,
    userId: number,
    role: number,
    state?: string,
  ) {
    await this.requireSection(sectionId, userId, role);
    return this.repository.findItemsBySection(sectionId, parseContentState(state));
  }
```

Replace `deleteSection` and add section transitions after it:

```typescript
  async deleteSection(id: number, userId: number, role: number) {
    await this.requireSection(id, userId, role);
    return this.repository.softDeleteSection(id);
  }

  async archiveSection(id: number, userId: number, role: number) {
    await this.requireSection(id, userId, role);
    return this.repository.archiveSection(id);
  }

  async unarchiveSection(id: number, userId: number, role: number) {
    await this.requireSection(id, userId, role);
    return this.repository.unarchiveSection(id);
  }

  async restoreSection(id: number, userId: number, role: number) {
    await this.requireSection(id, userId, role);
    return this.repository.restoreSection(id);
  }

  async purgeSection(id: number, userId: number, role: number) {
    const section = await this.requireSection(id, userId, role);
    if (!section.deleted_at) throw new NotFoundException('Section not found');
    return this.repository.deleteSection(id);
  }

  private async requireSection(id: number, userId: number, role: number) {
    const section = await this.findSectionById(id);
    if (section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }
    return section;
  }
```

Replace `deleteItem` and add item transitions after it:

```typescript
  async deleteItem(itemId: number, userId: number, role: number) {
    await this.requireItem(itemId, userId, role);
    return this.repository.softDeleteItem(itemId);
  }

  async archiveItem(itemId: number, userId: number, role: number) {
    await this.requireItem(itemId, userId, role);
    return this.repository.archiveItem(itemId);
  }

  async unarchiveItem(itemId: number, userId: number, role: number) {
    await this.requireItem(itemId, userId, role);
    return this.repository.unarchiveItem(itemId);
  }

  async restoreItem(itemId: number, userId: number, role: number) {
    await this.requireItem(itemId, userId, role);
    return this.repository.restoreItem(itemId);
  }

  async purgeItem(itemId: number, userId: number, role: number) {
    const item = await this.requireItem(itemId, userId, role);
    if (!item.deleted_at) throw new NotFoundException('Item not found');
    return this.repository.deleteItem(itemId);
  }

  private async requireItem(itemId: number, userId: number, role: number) {
    const item = await this.repository.findItemById(itemId);
    if (!item) throw new NotFoundException('Item not found');
    if (item.section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }
    return item;
  }
```

(`NotFoundException`, `ForbiddenException`, `UserRoles` are already imported.)

- [ ] **Step 5: Run the service tests to verify they pass**

Run: `npm run test -- --testPathPattern=custom-sections.service`
Expected: PASS.

- [ ] **Step 6: Rewrite the controller with the new routes (ordering-safe)**

Replace the whole body of `custom-sections.controller.ts` with the following (adds `Get`/`Query` usage, the state reads, and all transition routes; action/`items` routes precede the bare `:id`/`items/:itemId` mutation routes):

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CustomSectionsService } from './custom-sections.service';
import { CreateCustomSectionDto } from './dto/create-section.dto';
import { CreateCustomItemDto } from './dto/create-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReorderDto } from '../../common/dto/reorder.dto';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import type { AuthenticatedRequest } from '../../utils/types';

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('custom-sections')
export class CustomSectionsController {
  constructor(private readonly service: CustomSectionsService) {}

  @Post()
  createSection(
    @Body() dto: CreateCustomSectionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createSection(Number(req.user.sub), dto);
  }

  @Get()
  findUserSections(
    @Query('state') state: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findUserSections(Number(req.user.sub), state);
  }

  @Patch('reorder')
  reorderSections(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.service.reorderSections(Number(req.user.sub), dto.ids);
  }

  // --- item routes (literal-prefixed / deeper paths first) ---

  @Get(':sectionId/items')
  findSectionItems(
    @Param('sectionId') sectionId: string,
    @Query('state') state: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findSectionItems(
      +sectionId,
      Number(req.user.sub),
      Number(req.user.role),
      state,
    );
  }

  @Post(':id/items')
  createItem(
    @Param('id') id: string,
    @Body() dto: CreateCustomItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createItem(
      +id,
      dto,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

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

  @Patch('items/:itemId/archive')
  archiveItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.archiveItem(
      +itemId,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch('items/:itemId/unarchive')
  unarchiveItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.unarchiveItem(
      +itemId,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch('items/:itemId/restore')
  restoreItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.restoreItem(
      +itemId,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete('items/:itemId/purge')
  purgeItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.purgeItem(
      +itemId,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: Partial<CreateCustomItemDto>,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateItem(
      +itemId,
      dto,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete('items/:itemId')
  deleteItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deleteItem(
      +itemId,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  // --- section action routes (before bare :id) ---

  @Patch(':id/archive')
  archiveSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.archiveSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/unarchive')
  unarchiveSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.unarchiveSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/restore')
  restoreSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.restoreSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id/purge')
  purgeSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.purgeSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id')
  updateSection(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCustomSectionDto>,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateSection(
      +id,
      dto,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id')
  deleteSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.deleteSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }
}
```

- [ ] **Step 7: Verify build + module tests**

Run: `npm run build && npm run test -- --testPathPattern=custom-sections`
Expected: build succeeds; all PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/custom-sections
git commit -m "feat(backend): soft-delete, archive and purge for custom sections and items"
```

---

### Task 6: Public — exclude archived and trashed content

**Files:**
- Modify: `backend/src/modules/public/public.service.ts`
- Test: `backend/src/modules/public/public.service.spec.ts` (create)

**Interfaces:**
- Produces: `getPortfolio(userId)` returns only active content — each content relation (`f_projects`, `f_education`, `f_courses`, `f_experience`, `custom_sections`, and the nested `items`) filters `{ archived_at: null, deleted_at: null }`.

- [ ] **Step 1: Write the failing test**

Create `backend/src/modules/public/public.service.spec.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';

describe('PublicService', () => {
  const findUnique = jest.fn();
  const prisma = { f_user: { findUnique } };
  let service: PublicService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PublicService(prisma as never);
  });

  it('filters every content relation to active items only', async () => {
    findUnique.mockResolvedValue({ id: 1 });

    await service.getPortfolio(1);

    const arg = findUnique.mock.calls[0][0];
    const active = { archived_at: null, deleted_at: null };

    expect(arg.select.f_projects.where).toEqual(active);
    expect(arg.select.f_education.where).toEqual(active);
    expect(arg.select.f_courses.where).toEqual(active);
    expect(arg.select.f_experience.where).toEqual(active);
    expect(arg.select.custom_sections.where).toEqual(active);
    expect(arg.select.custom_sections.select.items.where).toEqual(active);
  });

  it('throws when the user does not exist', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.getPortfolio(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --testPathPattern=public.service`
Expected: FAIL — `arg.select.f_projects.where` is `undefined`.

- [ ] **Step 3: Add the `where` filters**

In `public.service.ts`, add `where: { archived_at: null, deleted_at: null },` to each content relation inside the big `select`. Add it as the first property of each relation block:

- `f_projects: { where: { archived_at: null, deleted_at: null }, orderBy: { order: 'asc' }, select: { ... } }`
- `f_education: { where: { archived_at: null, deleted_at: null }, orderBy: ..., select: ... }`
- `f_courses: { where: { archived_at: null, deleted_at: null }, orderBy: ..., select: ... }`
- `f_experience: { where: { archived_at: null, deleted_at: null }, orderBy: ..., select: ... }`
- `custom_sections: { where: { archived_at: null, deleted_at: null }, select: { ..., items: { where: { archived_at: null, deleted_at: null }, select: { ... }, orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } }`

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- --testPathPattern=public.service`
Expected: PASS.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/public
git commit -m "feat(backend): exclude archived and trashed content from public portfolio"
```

---

### Task 7: Backend e2e — soft-delete lifecycle + public exclusion

**Files:**
- Create: `backend/test/soft-delete.e2e-spec.ts`

**Interfaces:**
- Consumes: `loginE2eUser` from `./helpers/auth`; the seeded e2e user `e2e@portfolio.test`; the public route `GET /public/users/:userId`.
- Produces: an e2e spec that drives one entity (experience) through create → archive → unarchive → trash → restore → purge, asserting list-state membership and public exclusion at each step.

> **Environment note:** e2e requires the e2e PostgreSQL (port 55432) up and migrated + seeded. Because this project defers e2e runs, Steps 4–5 (running it) are gated on that environment being available; still write and commit the spec. The spec is self-contained (it creates its own experience row) apart from the seeded login user.

- [ ] **Step 1: Write the e2e spec**

Create `backend/test/soft-delete.e2e-spec.ts`:

```typescript
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';
import { loginE2eUser } from './helpers/auth';

function userIdFromToken(token: string): number {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
  );
  return Number(payload.sub);
}

const listIds = (body: Array<{ id: number }>) => body.map((r) => r.id);

describe('Soft-delete lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let userId: number;
  let id: number;
  const title = `SoftDelete E2E ${Date.now()}`;

  const list = (state?: string) =>
    request(app.getHttpServer())
      .get(`/experience${state ? `?state=${state}` : ''}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

  const publicTitles = async () => {
    const res = await request(app.getHttpServer())
      .get(`/public/users/${userId}`)
      .expect(200);
    return (res.body.f_experience as Array<{ tile: string }>).map((e) => e.tile);
  };

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
    userId = userIdFromToken(token);

    const created = await request(app.getHttpServer())
      .post('/experience')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tile: title,
        company_name: 'Acme',
        description: 'created by e2e',
        start_date: '2020-01-01',
      })
      .expect(201);
    id = created.body.id;
  });

  afterAll(async () => {
    // best-effort cleanup if the test aborted before purge
    await request(app.getHttpServer())
      .delete(`/experience/${id}/purge`)
      .set('Authorization', `Bearer ${token}`);
    await app.close();
  });

  it('new row is active and public', async () => {
    expect(listIds((await list()).body)).toContain(id);
    expect(await publicTitles()).toContain(title);
  });

  it('archive hides from active list and public, shows under archived', async () => {
    await request(app.getHttpServer())
      .patch(`/experience/${id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list()).body)).not.toContain(id);
    expect(listIds((await list('archived')).body)).toContain(id);
    expect(await publicTitles()).not.toContain(title);
  });

  it('unarchive returns it to active and public', async () => {
    await request(app.getHttpServer())
      .patch(`/experience/${id}/unarchive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list()).body)).toContain(id);
    expect(await publicTitles()).toContain(title);
  });

  it('delete trashes it (soft), hidden from active + public', async () => {
    await request(app.getHttpServer())
      .delete(`/experience/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list()).body)).not.toContain(id);
    expect(listIds((await list('trash')).body)).toContain(id);
    expect(await publicTitles()).not.toContain(title);
  });

  it('restore returns it from trash to active', async () => {
    await request(app.getHttpServer())
      .patch(`/experience/${id}/restore`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list()).body)).toContain(id);
    expect(listIds((await list('trash')).body)).not.toContain(id);
  });

  it('purge requires the row to be in trash', async () => {
    await request(app.getHttpServer())
      .delete(`/experience/${id}/purge`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('purge permanently removes a trashed row', async () => {
    await request(app.getHttpServer())
      .delete(`/experience/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/experience/${id}/purge`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list('trash')).body)).not.toContain(id);
    expect(listIds((await list()).body)).not.toContain(id);
  });
});
```

- [ ] **Step 2: Type-check the spec compiles**

Run: `npm run build`
Expected: build succeeds (the spec is under `test/`, covered by the TS config).

- [ ] **Step 3: Commit**

```bash
git add backend/test/soft-delete.e2e-spec.ts
git commit -m "test(backend): e2e soft-delete lifecycle and public exclusion"
```

- [ ] **Step 4: (Gated) Bring up the e2e database and run the suite**

If the e2e environment is available:

```bash
docker compose -f ../docker-compose.e2e.yml up -d
npm run prisma:e2e:migrate
npm run prisma:e2e:seed
npm run test:e2e
```

Expected: the reorder and soft-delete e2e suites PASS. If the e2e DB/port is unavailable, record the suite as deferred (consistent with the project's existing deferred e2e).

- [ ] **Step 5: Final verification of the whole backend**

Run: `npm run build && npm run lint && npm run test`
Expected: build succeeds, lint clean, all unit tests PASS.

---

## Self-Review

**Spec coverage:**
- Data model (columns, migration, no backfill) → Task 1. ✓
- Partial unique index for `f_projects` → Task 1 (Steps 4–5) + Global Constraints drift note. ✓
- Read semantics `?state` + `findIdsByUser`/`findByTitle`/public filters + list responses include timestamps → Tasks 3–6 (timestamps ride along automatically because the content list reads use no `select`; public uses explicit `select` and only adds `where`). ✓
- State-transition API (archive/unarchive/soft-delete/restore/purge) for all six entities + items, purge guard, route ordering → Tasks 3–5. ✓
- Auditing free via middleware → no task needed (transitions are `update`, purge is `delete`); called out in the plan header. ✓
- Edge cases: restore title collision (Task 3 Step 6/8), purge-outside-trash 404 (Tasks 3–5), reorder excludes archived/trashed (Tasks 3–5 `findIdsByUser`), archived+trashed dominance (covered by `contentStateWhere` + `deleted_at` guard). ✓
- Testing: unit per module (Tasks 2–6) + e2e lifecycle & public exclusion (Task 7). ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. The only substitution is Task 4 Step 8, which gives an explicit identifier map and concrete method list (not a vague "similar to").

**Type consistency:** Repository transition names (`archive`/`unarchive`/`softDelete`/`restore`) and service method names are used identically across producing and consuming steps. Custom-sections uses the `*Section`/`*Item` suffixes consistently. `parseContentState`/`contentStateWhere`/`ContentState` signatures match Task 2 across all consumers.

## Execution Handoff

Frontend is a **separate plan** (built after this backend plan merges), per the spec's decomposition.
