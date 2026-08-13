-- Manual patch to add missing FinancingApplicationDocument table and extraData column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'FinancingApplicationDocument'
    ) THEN
        CREATE TABLE "public"."FinancingApplicationDocument" (
            id SERIAL PRIMARY KEY,
            "financingApplicationId" INTEGER NOT NULL REFERENCES "public"."FinancingApplication"(id) ON DELETE CASCADE,
            "docType" TEXT NOT NULL,
            "originalName" TEXT NOT NULL,
            "storedName" TEXT NOT NULL,
            mime TEXT NOT NULL,
            size INTEGER NOT NULL DEFAULT 0,
            url TEXT NOT NULL,
            "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX "FinancingApplicationDocument_finApp_idx" ON "public"."FinancingApplicationDocument"("financingApplicationId");
        CREATE INDEX "FinancingApplicationDocument_docType_idx" ON "public"."FinancingApplicationDocument"("docType");
    END IF;
END $$;

ALTER TABLE "public"."FinancingApplicationDetail" ADD COLUMN IF NOT EXISTS "extraData" JSONB;
