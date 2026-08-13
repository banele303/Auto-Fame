-- Step 2: update existing rows and remove legacy GASOLINE label from FuelType

-- Update existing rows using legacy value
UPDATE "Car" SET "fuelType"='PETROL' WHERE "fuelType"='GASOLINE';

-- Recreate enum without GASOLINE (cannot drop value directly)
DO $$
BEGIN
  -- Only proceed if GASOLINE still appears in enum definition
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname='FuelType' AND e.enumlabel='GASOLINE') THEN
    CREATE TYPE "FuelType_new" AS ENUM ('PETROL','DIESEL','HYBRID','ELECTRIC','PLUG_IN_HYBRID','HYDROGEN');
    ALTER TABLE "Car" ALTER COLUMN "fuelType" TYPE "FuelType_new" USING ("fuelType"::text::"FuelType_new");
    DROP TYPE "FuelType";
    ALTER TYPE "FuelType_new" RENAME TO "FuelType";
  END IF;
END$$;

-- Validation (optional)
-- SELECT DISTINCT "fuelType" FROM "Car";
