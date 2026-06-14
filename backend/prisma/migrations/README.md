# PostgreSQL migration baseline

The active migration history starts with
`20260613234500_postgresql_baseline`. Earlier migrations were generated for
SQLite and are preserved in `../migrations-sqlite-legacy`.

Fresh PostgreSQL databases can run `prisma migrate deploy` normally.

For an existing PostgreSQL database created before this baseline:

1. Back up the database.
2. Confirm its schema matches the current Prisma schema.
3. Mark only the baseline as applied:
   `prisma migrate resolve --applied 20260613234500_postgresql_baseline`.
4. Run `prisma migrate deploy` to apply subsequent hardening migrations.
