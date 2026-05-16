-- Add table-aware poker seating.
ALTER TABLE "Event" ADD COLUMN "seatsPerTable" INTEGER NOT NULL DEFAULT 9;
ALTER TABLE "EventRegistration" ADD COLUMN "tableNumber" INTEGER;

DROP INDEX IF EXISTS "EventRegistration_eventId_seatNumber_key";

-- Convert previous one-dimensional poker seat numbers into table/seat pairs.
-- Example with seatsPerTable = 9: 1..9 => table 1, 10 => table 2 seat 1.
UPDATE "EventRegistration"
SET
    "tableNumber" = CAST((("seatNumber" - 1) / (
        SELECT "seatsPerTable" FROM "Event" WHERE "Event"."id" = "EventRegistration"."eventId"
    )) AS INTEGER) + 1,
    "seatNumber" = (("seatNumber" - 1) % (
        SELECT "seatsPerTable" FROM "Event" WHERE "Event"."id" = "EventRegistration"."eventId"
    )) + 1
WHERE "status" = 'REGISTERED'
  AND "seatNumber" IS NOT NULL
  AND EXISTS (
      SELECT 1
      FROM "Event"
      WHERE "Event"."id" = "EventRegistration"."eventId"
        AND LOWER("Event"."gameType") = 'poker'
        AND "Event"."seatsPerTable" > 0
  );

CREATE UNIQUE INDEX "EventRegistration_eventId_tableNumber_seatNumber_key"
ON "EventRegistration"("eventId", "tableNumber", "seatNumber");
