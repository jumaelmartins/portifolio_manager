DROP INDEX IF EXISTS "public"."f_projects_title_key";

CREATE UNIQUE INDEX IF NOT EXISTS "f_projects_f_userId_title_key"
ON "public"."f_projects"("f_userId", "title");
