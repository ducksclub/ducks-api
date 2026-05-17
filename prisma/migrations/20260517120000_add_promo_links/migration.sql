-- CreateTable
CREATE TABLE "PromoLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clicksCount" INTEGER NOT NULL DEFAULT 0,
    "registrationsCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PromoStartSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramUserId" TEXT NOT NULL,
    "promoCode" TEXT NOT NULL,
    "promoLinkId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromoStartSession_promoLinkId_fkey" FOREIGN KEY ("promoLinkId") REFERENCES "PromoLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "avatarUrl" TEXT,
    "avatarHash" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "telegramId" TEXT,
    "promoLinkId" TEXT,
    "sourceCode" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_promoLinkId_fkey" FOREIGN KEY ("promoLinkId") REFERENCES "PromoLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarHash", "avatarUrl", "createdAt", "email", "id", "name", "passwordHash", "phone", "role", "telegramId", "updatedAt", "username") SELECT "avatarHash", "avatarUrl", "createdAt", "email", "id", "name", "passwordHash", "phone", "role", "telegramId", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PromoLink_code_key" ON "PromoLink"("code");
CREATE INDEX "PromoLink_isActive_idx" ON "PromoLink"("isActive");
CREATE INDEX "PromoLink_createdAt_idx" ON "PromoLink"("createdAt");
CREATE UNIQUE INDEX "PromoStartSession_telegramUserId_key" ON "PromoStartSession"("telegramUserId");
CREATE INDEX "PromoStartSession_promoCode_idx" ON "PromoStartSession"("promoCode");
CREATE INDEX "PromoStartSession_promoLinkId_idx" ON "PromoStartSession"("promoLinkId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_promoLinkId_idx" ON "User"("promoLinkId");
CREATE INDEX "User_sourceCode_idx" ON "User"("sourceCode");
