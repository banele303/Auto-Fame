-- Step 1: add new enum value PETROL (committed separately so it can be used later)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FuelType' AND e.enumlabel = 'PETROL') THEN
    ALTER TYPE "FuelType" ADD VALUE 'PETROL';
  END IF;
END$$;

-- Further transformation (updating rows and removing GASOLINE) occurs in subsequent migration.
