/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubId` on the `User` table. All the data in the column will be lost.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_stripeCustomerId_key";

-- DropIndex
DROP INDEX "User_stripeSubId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubId",
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
