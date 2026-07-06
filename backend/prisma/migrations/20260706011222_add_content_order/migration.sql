-- AlterTable
ALTER TABLE "public"."f_courses" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."f_education" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."f_experience" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."f_projects" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

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
