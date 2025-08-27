/*
  Warnings:

  - You are about to drop the column `officeEndHour` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `User` table. All the data in the column will be lost.
  - Made the column `slug` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "officeEndHour",
DROP COLUMN "timezone",
ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "userLimit" SET DEFAULT 0;
