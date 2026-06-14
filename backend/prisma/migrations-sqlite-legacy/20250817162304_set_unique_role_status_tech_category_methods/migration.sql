/*
  Warnings:

  - A unique constraint covering the columns `[method]` on the table `d_auth_method` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[category]` on the table `d_category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[role]` on the table `d_roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[status]` on the table `d_status` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tech]` on the table `d_technologies` will be added. If there are existing duplicate values, this will fail.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL DEFAULT 2,
    "status_id" INTEGER NOT NULL DEFAULT 1,
    "auth_method_id" INTEGER NOT NULL DEFAULT 1,
    "f_profile_pictureId" INTEGER,
    "last_login" DATETIME,
    "online" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "verified_email" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" DATETIME,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "d_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "d_status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_auth_method_id_fkey" FOREIGN KEY ("auth_method_id") REFERENCES "d_auth_method" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_users" ("auth_method_id", "created_at", "email", "email_verified_at", "f_profile_pictureId", "id", "last_login", "online", "password_hash", "role_id", "status_id", "updated_at", "username", "verified_email") SELECT "auth_method_id", "created_at", "email", "email_verified_at", "f_profile_pictureId", "id", "last_login", "online", "password_hash", "role_id", "status_id", "updated_at", "username", "verified_email" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "d_auth_method_method_key" ON "d_auth_method"("method");

-- CreateIndex
CREATE UNIQUE INDEX "d_category_category_key" ON "d_category"("category");

-- CreateIndex
CREATE UNIQUE INDEX "d_roles_role_key" ON "d_roles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "d_status_status_key" ON "d_status"("status");

-- CreateIndex
CREATE UNIQUE INDEX "d_technologies_tech_key" ON "d_technologies"("tech");
