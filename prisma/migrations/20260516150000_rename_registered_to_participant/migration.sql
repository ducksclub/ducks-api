UPDATE "EventRegistration"
SET "status" = 'PARTICIPANT'
WHERE "status" = 'REGISTERED';

CREATE TABLE "new_EventRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PARTICIPANT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "position" INTEGER,
    "tableNumber" INTEGER,
    "seatNumber" INTEGER,
    CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_EventRegistration" (
    "cancelledAt",
    "createdAt",
    "eventId",
    "id",
    "position",
    "seatNumber",
    "status",
    "tableNumber",
    "userId"
)
SELECT
    "cancelledAt",
    "createdAt",
    "eventId",
    "id",
    "position",
    "seatNumber",
    "status",
    "tableNumber",
    "userId"
FROM "EventRegistration";

DROP TABLE "EventRegistration";
ALTER TABLE "new_EventRegistration" RENAME TO "EventRegistration";

CREATE UNIQUE INDEX "EventRegistration_userId_eventId_key" ON "EventRegistration"("userId", "eventId");
CREATE UNIQUE INDEX "EventRegistration_eventId_tableNumber_seatNumber_key"
ON "EventRegistration"("eventId", "tableNumber", "seatNumber");
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");
CREATE INDEX "EventRegistration_userId_status_idx" ON "EventRegistration"("userId", "status");
