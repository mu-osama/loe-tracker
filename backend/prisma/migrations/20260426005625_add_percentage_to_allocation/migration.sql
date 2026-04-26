/*
  Warnings:

  - You are about to drop the column `endDate` on the `Allocation` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Allocation` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Allocation" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "percentage" DECIMAL(5,2) NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "region";
