/*
  Warnings:

  - You are about to drop the `_d_technologiesTof_user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `f_user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `institution_name` on the `f_projects` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `d_auth_method` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `d_category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `d_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `d_status` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `d_technologies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `f_courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `f_education` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `f_experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `f_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `f_profile_picture` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `f_projects` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_d_technologiesTof_user_B_index";

-- DropIndex
DROP INDEX "_d_technologiesTof_user_AB_unique";

-- DropIndex
DROP INDEX "f_user_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_d_technologiesTof_user";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "f_user";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL DEFAULT 2,
    "status_id" INTEGER NOT NULL DEFAULT 1,
    "auth_method_id" INTEGER NOT NULL,
    "f_profile_pictureId" INTEGER NOT NULL,
    "last_login" DATETIME,
    "online" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "d_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "d_status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_auth_method_id_fkey" FOREIGN KEY ("auth_method_id") REFERENCES "d_auth_method" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_d_auth_method" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "method" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_d_auth_method" ("id", "method") SELECT "id", "method" FROM "d_auth_method";
DROP TABLE "d_auth_method";
ALTER TABLE "new_d_auth_method" RENAME TO "d_auth_method";
CREATE TABLE "new_d_category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_d_category" ("category", "id") SELECT "category", "id" FROM "d_category";
DROP TABLE "d_category";
ALTER TABLE "new_d_category" RENAME TO "d_category";
CREATE TABLE "new_d_roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_d_roles" ("id", "role") SELECT "id", "role" FROM "d_roles";
DROP TABLE "d_roles";
ALTER TABLE "new_d_roles" RENAME TO "d_roles";
CREATE TABLE "new_d_status" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_d_status" ("id", "status") SELECT "id", "status" FROM "d_status";
DROP TABLE "d_status";
ALTER TABLE "new_d_status" RENAME TO "d_status";
CREATE TABLE "new_d_technologies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tech" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_d_technologies" ("id", "tech") SELECT "id", "tech" FROM "d_technologies";
DROP TABLE "d_technologies";
ALTER TABLE "new_d_technologies" RENAME TO "d_technologies";
CREATE TABLE "new_f_courses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tile" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "f_userId" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "f_courses_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_f_courses" ("description", "end_date", "f_userId", "id", "institution_name", "start_date", "tile") SELECT "description", "end_date", "f_userId", "id", "institution_name", "start_date", "tile" FROM "f_courses";
DROP TABLE "f_courses";
ALTER TABLE "new_f_courses" RENAME TO "f_courses";
CREATE TABLE "new_f_education" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tile" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "f_userId" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "f_education_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_f_education" ("description", "end_date", "f_userId", "id", "institution_name", "start_date", "tile") SELECT "description", "end_date", "f_userId", "id", "institution_name", "start_date", "tile" FROM "f_education";
DROP TABLE "f_education";
ALTER TABLE "new_f_education" RENAME TO "f_education";
CREATE TABLE "new_f_experience" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tile" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "f_userId" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "f_experience_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_f_experience" ("company_name", "description", "end_date", "f_userId", "id", "start_date", "tile") SELECT "company_name", "description", "end_date", "f_userId", "id", "start_date", "tile" FROM "f_experience";
DROP TABLE "f_experience";
ALTER TABLE "new_f_experience" RENAME TO "f_experience";
CREATE TABLE "new_f_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT,
    "src_path" TEXT NOT NULL,
    "f_userId" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "f_images_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_f_images" ("description", "f_userId", "id", "src_path") SELECT "description", "f_userId", "id", "src_path" FROM "f_images";
DROP TABLE "f_images";
ALTER TABLE "new_f_images" RENAME TO "f_images";
CREATE TABLE "new_f_profile_picture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "f_userId" INTEGER NOT NULL,
    "f_imagesId" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "f_profile_picture_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_profile_picture_f_imagesId_fkey" FOREIGN KEY ("f_imagesId") REFERENCES "f_images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_f_profile_picture" ("f_imagesId", "f_userId", "id") SELECT "f_imagesId", "f_userId", "id" FROM "f_profile_picture";
DROP TABLE "f_profile_picture";
ALTER TABLE "new_f_profile_picture" RENAME TO "f_profile_picture";
CREATE UNIQUE INDEX "f_profile_picture_f_userId_key" ON "f_profile_picture"("f_userId");
CREATE UNIQUE INDEX "f_profile_picture_f_imagesId_key" ON "f_profile_picture"("f_imagesId");
CREATE TABLE "new_f_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tile" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repo_url" TEXT,
    "live_url" TEXT,
    "f_userId" INTEGER NOT NULL,
    "d_categoryId" INTEGER NOT NULL,
    "f_imagesId" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "f_projects_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_projects_d_categoryId_fkey" FOREIGN KEY ("d_categoryId") REFERENCES "d_category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_projects_f_imagesId_fkey" FOREIGN KEY ("f_imagesId") REFERENCES "f_images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_f_projects" ("d_categoryId", "description", "f_imagesId", "f_userId", "id", "live_url", "repo_url", "tile") SELECT "d_categoryId", "description", "f_imagesId", "f_userId", "id", "live_url", "repo_url", "tile" FROM "f_projects";
DROP TABLE "f_projects";
ALTER TABLE "new_f_projects" RENAME TO "f_projects";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
