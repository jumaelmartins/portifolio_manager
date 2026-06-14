/*
  Warnings:

  - You are about to drop the column `tile` on the `f_education` table. All the data in the column will be lost.
  - Added the required column `title` to the `f_education` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_f_education" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "f_userId" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "f_education_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_f_education" ("created_at", "description", "end_date", "f_userId", "id", "institution_name", "start_date", "updated_at") SELECT "created_at", "description", "end_date", "f_userId", "id", "institution_name", "start_date", "updated_at" FROM "f_education";
DROP TABLE "f_education";
ALTER TABLE "new_f_education" RENAME TO "f_education";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
