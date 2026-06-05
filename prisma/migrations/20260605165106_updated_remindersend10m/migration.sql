/*
  Warnings:

  - You are about to drop the column `reminderSent10m` on the `Event` table. All the data in the column will be lost.

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
    "reminderSentNow" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent24h" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent2h" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent15m" BOOLEAN NOT NULL DEFAULT false,
    "participantLimit" INTEGER NOT NULL,
    "seatsPerTable" INTEGER NOT NULL DEFAULT 9,
    "pointsForParticipation" INTEGER NOT NULL DEFAULT 10,
    "isTemplate" BOOLEAN DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("address", "city", "createdAt", "endsAt", "features", "gameRules", "gameType", "id", "imageHash", "imageUrl", "isTemplate", "participantLimit", "pointsForParticipation", "reminderSent24h", "reminderSent2h", "reminderSentNow", "seatsPerTable", "startsAt", "status", "title", "updatedAt") SELECT "address", "city", "createdAt", "endsAt", "features", "gameRules", "gameType", "id", "imageHash", "imageUrl", "isTemplate", "participantLimit", "pointsForParticipation", "reminderSent24h", "reminderSent2h", "reminderSentNow", "seatsPerTable", "startsAt", "status", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_gameType_startsAt_idx" ON "Event"("gameType", "startsAt");
CREATE INDEX "Event_status_idx" ON "Event"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
