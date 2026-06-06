/*
  Warnings:

  - You are about to drop the column `telegramId` on the `NotificationQueue` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `NotificationQueue` table. All the data in the column will be lost.
  - Added the required column `message` to the `NotificationQueue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telegramUserId` to the `NotificationQueue` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "telegramUserId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "failedAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NotificationQueue" ("attempts", "createdAt", "error", "failedAt", "id", "scheduledAt", "sentAt", "status", "type", "updatedAt", "userId") SELECT "attempts", "createdAt", "error", "failedAt", "id", "scheduledAt", "sentAt", "status", "type", "updatedAt", "userId" FROM "NotificationQueue";
DROP TABLE "NotificationQueue";
ALTER TABLE "new_NotificationQueue" RENAME TO "NotificationQueue";
CREATE INDEX "NotificationQueue_status_scheduledAt_idx" ON "NotificationQueue"("status", "scheduledAt");
CREATE INDEX "NotificationQueue_telegramUserId_status_idx" ON "NotificationQueue"("telegramUserId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
