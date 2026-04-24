DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'Department'
  ) THEN
    CREATE TYPE "Department" AS ENUM ('ENGINEERING', 'EXPERIENCE');
  END IF;
END $$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "position" TEXT,
ADD COLUMN IF NOT EXISTS "department" "Department";
