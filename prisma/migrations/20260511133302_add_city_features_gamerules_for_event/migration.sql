/*
  Warnings:

  - You are about to drop the column `location` on the `Event` table. All the data in the column will be lost.
  - Added the required column `city` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `features` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameRules` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT,
    "imageHash" TEXT,
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
INSERT INTO "new_Event" ("address", "createdAt", "endsAt", "gameType", "id", "imageHash", "imageUrl", "participantLimit", "pointsForParticipation", "reminderSent10m", "reminderSent1h", "startsAt", "status", "updatedAt") SELECT "address", "createdAt", "endsAt", "gameType", "id", "imageHash", "imageUrl", "participantLimit", "pointsForParticipation", "reminderSent10m", "reminderSent1h", "startsAt", "status", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_gameType_startsAt_idx" ON "Event"("gameType", "startsAt");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "avatarUrl" TEXT,
    "avatarHash" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "telegram_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarHash", "avatarUrl", "createdAt", "email", "id", "name", "passwordHash", "role", "telegram_id", "updatedAt") SELECT "avatarHash", "avatarUrl", "createdAt", "email", "id", "name", "passwordHash", "role", "telegram_id", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_telegram_id_key" ON "User"("telegram_id");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
