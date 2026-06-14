ALTER TABLE "email_verification_tokens"
ADD COLUMN IF NOT EXISTS "failed_attempts" INTEGER NOT NULL DEFAULT 0;

WITH ranked_unused_tokens AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "user_id"
      ORDER BY "created_at" DESC, "id" DESC
    ) AS row_number
  FROM "email_verification_tokens"
  WHERE "is_used" = false
)
UPDATE "email_verification_tokens" AS tokens
SET
  "is_used" = true,
  "used_at" = COALESCE(tokens."used_at", CURRENT_TIMESTAMP)
FROM ranked_unused_tokens
WHERE tokens."id" = ranked_unused_tokens."id"
  AND ranked_unused_tokens.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS
"email_verification_tokens_one_unused_per_user_idx"
ON "email_verification_tokens" ("user_id")
WHERE "is_used" = false;

CREATE INDEX IF NOT EXISTS "email_verification_tokens_user_id_created_at_idx"
ON "email_verification_tokens" ("user_id", "created_at");
