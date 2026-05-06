/*
  Warnings:

  - You are about to drop the column `description` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Event` table. All the data in the column will be lost.
  - Added the required column `address` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarHash" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT,
    "imageHash" TEXT,
    "address" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "location" TEXT,
    "participantLimit" INTEGER NOT NULL,
    "pointsForParticipation" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("createdAt", "endsAt", "gameType", "id", "location", "participantLimit", "pointsForParticipation", "startsAt", "status", "updatedAt") SELECT "createdAt", "endsAt", "gameType", "id", "location", "participantLimit", "pointsForParticipation", "startsAt", "status", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_gameType_startsAt_idx" ON "Event"("gameType", "startsAt");
CREATE INDEX "Event_status_idx" ON "Event"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
