CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "createdCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "NotificationQueue" ADD COLUMN "broadcastId" TEXT;

CREATE INDEX "Broadcast_createdAt_idx" ON "Broadcast"("createdAt");
CREATE INDEX "NotificationQueue_broadcastId_status_idx" ON "NotificationQueue"("broadcastId", "status");
