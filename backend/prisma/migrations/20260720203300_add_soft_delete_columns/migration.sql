-- DropIndex
DROP INDEX "public"."f_projects_f_userId_title_key";

-- AlterTable
ALTER TABLE "public"."custom_section_items" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."custom_sections" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."f_courses" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."f_education" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."f_experience" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."f_projects" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- Partial unique index: only live (non-trashed) projects must have a unique (user, title).
-- Prisma 6 cannot express this declaratively; it is maintained by raw SQL.
CREATE UNIQUE INDEX "f_projects_f_userId_title_key"
ON "public"."f_projects"("f_userId", "title")
WHERE "deleted_at" IS NULL;
