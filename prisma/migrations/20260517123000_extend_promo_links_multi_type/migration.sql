-- AlterTable
ALTER TABLE "PromoLink" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PUBLIC_SITE';
ALTER TABLE "PromoLink" ADD COLUMN "targetUrl" TEXT;
ALTER TABLE "PromoLink" ADD COLUMN "generatedUrl" TEXT;

-- AlterTable
ALTER TABLE "PromoStartSession" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PUBLIC_SITE';

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
    "sourceType" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_promoLinkId_fkey" FOREIGN KEY ("promoLinkId") REFERENCES "PromoLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarHash", "avatarUrl", "createdAt", "email", "id", "name", "passwordHash", "phone", "promoLinkId", "role", "sourceCode", "telegramId", "updatedAt", "username") SELECT "avatarHash", "avatarUrl", "createdAt", "email", "id", "name", "passwordHash", "phone", "promoLinkId", "role", "sourceCode", "telegramId", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "PromoClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promoLinkId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "telegramUserId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromoClick_promoLinkId_fkey" FOREIGN KEY ("promoLinkId") REFERENCES "PromoLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PromoLink_type_idx" ON "PromoLink"("type");
CREATE INDEX "PromoStartSession_type_idx" ON "PromoStartSession"("type");
CREATE INDEX "PromoClick_promoLinkId_idx" ON "PromoClick"("promoLinkId");
CREATE INDEX "PromoClick_code_idx" ON "PromoClick"("code");
CREATE INDEX "PromoClick_type_idx" ON "PromoClick"("type");
CREATE INDEX "PromoClick_telegramUserId_idx" ON "PromoClick"("telegramUserId");
CREATE INDEX "PromoClick_createdAt_idx" ON "PromoClick"("createdAt");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_promoLinkId_idx" ON "User"("promoLinkId");
CREATE INDEX "User_sourceCode_idx" ON "User"("sourceCode");
CREATE INDEX "User_sourceType_idx" ON "User"("sourceType");
