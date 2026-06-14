/*
  Warnings:

  - You are about to drop the column `tile` on the `f_projects` table. All the data in the column will be lost.
  - Added the required column `title` to the `f_projects` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_f_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repo_url" TEXT,
    "live_url" TEXT,
    "f_userId" INTEGER NOT NULL,
    "d_categoryId" INTEGER NOT NULL,
    "f_imagesId" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "f_projects_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_projects_d_categoryId_fkey" FOREIGN KEY ("d_categoryId") REFERENCES "d_category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_projects_f_imagesId_fkey" FOREIGN KEY ("f_imagesId") REFERENCES "f_images" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_f_projects" ("created_at", "d_categoryId", "description", "f_imagesId", "f_userId", "id", "live_url", "repo_url", "updated_at") SELECT "created_at", "d_categoryId", "description", "f_imagesId", "f_userId", "id", "live_url", "repo_url", "updated_at" FROM "f_projects";
DROP TABLE "f_projects";
ALTER TABLE "new_f_projects" RENAME TO "f_projects";
CREATE UNIQUE INDEX "f_projects_title_key" ON "f_projects"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
