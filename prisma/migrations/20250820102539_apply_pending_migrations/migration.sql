/*
  Warnings:

  - You are about to drop the column `coordinates` on the `Dealership` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dealership" DROP COLUMN "coordinates",
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
