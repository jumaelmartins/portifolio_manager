/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `email_verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `isUsed` on the `email_verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `email_verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `email_verification_tokens` table. All the data in the column will be lost.
  - Added the required column `expires_at` to the `email_verification_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `email_verification_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_email_verification_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_email_verification_tokens" ("code", "created_at", "id", "token") SELECT "code", "created_at", "id", "token" FROM "email_verification_tokens";
DROP TABLE "email_verification_tokens";
ALTER TABLE "new_email_verification_tokens" RENAME TO "email_verification_tokens";
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
