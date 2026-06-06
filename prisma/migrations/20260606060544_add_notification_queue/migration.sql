-- CreateTable
CREATE TABLE "NotificationQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "telegramId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "text" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "failedAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "NotificationQueue_status_scheduledAt_idx" ON "NotificationQueue"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NotificationQueue_telegramId_status_idx" ON "NotificationQueue"("telegramId", "status");
