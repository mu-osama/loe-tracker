ALTER TABLE "Allocation"
ADD COLUMN IF NOT EXISTS "assignedById" TEXT;

WITH ranked_allocations AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "projectId"
      ORDER BY
        CASE WHEN "isActive" THEN 0 ELSE 1 END,
        "createdAt" DESC,
        id DESC
    ) AS row_num
  FROM "Allocation"
)
DELETE FROM "Allocation" allocation
USING ranked_allocations ranked
WHERE allocation.id = ranked.id
  AND ranked.row_num > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Allocation_assignedById_fkey'
  ) THEN
    ALTER TABLE "Allocation"
    ADD CONSTRAINT "Allocation_assignedById_fkey"
    FOREIGN KEY ("assignedById") REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Allocation_userId_projectId_key'
  ) THEN
    ALTER TABLE "Allocation"
    ADD CONSTRAINT "Allocation_userId_projectId_key"
    UNIQUE ("userId", "projectId");
  END IF;
END $$;
