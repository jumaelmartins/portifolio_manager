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
    "auth_method_id" INTEGER NOT NULL,
    "f_profile_pictureId" INTEGER,
    "last_login" DATETIME,
    "online" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "d_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "d_status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_auth_method_id_fkey" FOREIGN KEY ("auth_method_id") REFERENCES "d_auth_method" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_users" ("auth_method_id", "created_at", "email", "f_profile_pictureId", "id", "last_login", "online", "password_hash", "role_id", "status_id", "updated_at", "username") SELECT "auth_method_id", "created_at", "email", "f_profile_pictureId", "id", "last_login", "online", "password_hash", "role_id", "status_id", "updated_at", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
