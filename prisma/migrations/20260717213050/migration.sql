-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "broadcastId" TEXT,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NotificationQueue_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NotificationQueue" ("attempts", "broadcastId", "createdAt", "error", "failedAt", "id", "message", "scheduledAt", "sentAt", "status", "telegramUserId", "type", "updatedAt", "userId") SELECT "attempts", "broadcastId", "createdAt", "error", "failedAt", "id", "message", "scheduledAt", "sentAt", "status", "telegramUserId", "type", "updatedAt", "userId" FROM "NotificationQueue";
DROP TABLE "NotificationQueue";
ALTER TABLE "new_NotificationQueue" RENAME TO "NotificationQueue";
CREATE INDEX "NotificationQueue_status_scheduledAt_idx" ON "NotificationQueue"("status", "scheduledAt");
CREATE INDEX "NotificationQueue_telegramUserId_status_idx" ON "NotificationQueue"("telegramUserId", "status");
CREATE INDEX "NotificationQueue_broadcastId_status_idx" ON "NotificationQueue"("broadcastId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
