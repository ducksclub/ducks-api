CREATE TABLE "ClientUiSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "ClientUiSetting" ("id", "type", "createdAt", "updatedAt")
VALUES ('default', 'ПОКЕР', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
