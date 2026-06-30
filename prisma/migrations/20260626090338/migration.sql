/*
  Warnings:

  - You are about to drop the column `pointsForParticipation` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - Added the required column `nickname` to the `User` table without a default value. This is not possible if the table is not empty.

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
    "initialDepositAmount" INTEGER NOT NULL DEFAULT 0,
    "isTemplate" BOOLEAN DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("address", "city", "createdAt", "endsAt", "features", "gameRules", "gameType", "id", "imageHash", "imageUrl", "initialDepositAmount", "isTemplate", "participantLimit", "reminderSent15m", "reminderSent24h", "reminderSent2h", "reminderSentNow", "seatsPerTable", "startsAt", "status", "title", "updatedAt") SELECT "address", "city", "createdAt", "endsAt", "features", "gameRules", "gameType", "id", "imageHash", "imageUrl", "initialDepositAmount", "isTemplate", "participantLimit", "reminderSent15m", "reminderSent24h", "reminderSent2h", "reminderSentNow", "seatsPerTable", "startsAt", "status", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_gameType_startsAt_idx" ON "Event"("gameType", "startsAt");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "avatarHash" TEXT,
    "promoLinkId" TEXT,
    "sourceCode" TEXT,
    "sourceType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_promoLinkId_fkey" FOREIGN KEY ("promoLinkId") REFERENCES "PromoLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarHash", "avatarUrl", "createdAt", "email", "id", "passwordHash", "phone", "promoLinkId", "role", "sourceCode", "sourceType", "telegramId", "updatedAt") SELECT "avatarHash", "avatarUrl", "createdAt", "email", "id", "passwordHash", "phone", "promoLinkId", "role", "sourceCode", "sourceType", "telegramId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_promoLinkId_idx" ON "User"("promoLinkId");
CREATE INDEX "User_sourceCode_idx" ON "User"("sourceCode");
CREATE INDEX "User_sourceType_idx" ON "User"("sourceType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
