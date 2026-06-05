-- CreateTable
CREATE TABLE "UserWarmup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scenarioKey" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextSendAt" DATETIME,
    "completedAt" DATETIME,
    "stoppedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserWarmup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserWarmup_status_nextSendAt_idx" ON "UserWarmup"("status", "nextSendAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserWarmup_userId_scenarioKey_key" ON "UserWarmup"("userId", "scenarioKey");
