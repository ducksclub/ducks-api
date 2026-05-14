/*
  Warnings:

  - Added the required column `title` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT,
    "imageHash" TEXT,
    "title" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "gameRules" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "reminderSent1h" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent10m" BOOLEAN NOT NULL DEFAULT false,
    "participantLimit" INTEGER NOT NULL,
    "pointsForParticipation" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("address", "city", "createdAt", "endsAt", "features", "gameRules", "gameType", "id", "imageHash", "imageUrl", "participantLimit", "pointsForParticipation", "reminderSent10m", "reminderSent1h", "startsAt", "status", "updatedAt") SELECT "address", "city", "createdAt", "endsAt", "features", "gameRules", "gameType", "id", "imageHash", "imageUrl", "participantLimit", "pointsForParticipation", "reminderSent10m", "reminderSent1h", "startsAt", "status", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_gameType_startsAt_idx" ON "Event"("gameType", "startsAt");
CREATE INDEX "Event_status_idx" ON "Event"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
