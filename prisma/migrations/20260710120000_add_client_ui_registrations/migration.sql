CREATE TABLE "ClientUiRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientUiRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ClientUiRegistration_userId_type_key" ON "ClientUiRegistration"("userId", "type");
CREATE INDEX "ClientUiRegistration_type_createdAt_idx" ON "ClientUiRegistration"("type", "createdAt");
CREATE INDEX "ClientUiRegistration_userId_idx" ON "ClientUiRegistration"("userId");
