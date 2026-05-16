-- Add seat assignment support for poker registrations.
ALTER TABLE "EventRegistration" ADD COLUMN "seatNumber" INTEGER;

-- Move existing string statuses to the new registration status vocabulary.
UPDATE "EventRegistration"
SET "status" = 'REGISTERED'
WHERE "status" = 'active';

UPDATE "EventRegistration"
SET "status" = 'CANCELLED'
WHERE "status" = 'cancelled';

-- Rebuild the table to change the default status value in SQLite.
CREATE TABLE "new_EventRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "position" INTEGER,
    "seatNumber" INTEGER,
    CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_EventRegistration" ("cancelledAt", "createdAt", "eventId", "id", "position", "seatNumber", "status", "userId")
SELECT "cancelledAt", "createdAt", "eventId", "id", "position", "seatNumber", "status", "userId"
FROM "EventRegistration";

DROP TABLE "EventRegistration";
ALTER TABLE "new_EventRegistration" RENAME TO "EventRegistration";

-- Existing poker participants become assigned seats in registration order.
WITH ranked_poker_registrations AS (
    SELECT
        er."id",
        ROW_NUMBER() OVER (PARTITION BY er."eventId" ORDER BY er."createdAt" ASC, er."id" ASC) AS "seatNumber"
    FROM "EventRegistration" er
    INNER JOIN "Event" e ON e."id" = er."eventId"
    WHERE LOWER(e."gameType") = 'poker'
      AND er."status" = 'REGISTERED'
      AND er."seatNumber" IS NULL
)
UPDATE "EventRegistration"
SET "seatNumber" = (
    SELECT ranked_poker_registrations."seatNumber"
    FROM ranked_poker_registrations
    WHERE ranked_poker_registrations."id" = "EventRegistration"."id"
)
WHERE "id" IN (SELECT "id" FROM ranked_poker_registrations);

CREATE UNIQUE INDEX "EventRegistration_userId_eventId_key" ON "EventRegistration"("userId", "eventId");
CREATE UNIQUE INDEX "EventRegistration_eventId_seatNumber_key" ON "EventRegistration"("eventId", "seatNumber");
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");
CREATE INDEX "EventRegistration_userId_status_idx" ON "EventRegistration"("userId", "status");
