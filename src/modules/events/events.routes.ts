import { Router } from "express";
import { authenticate, authorize } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { Roles } from "../../common/types/domain.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  addParticipant,
  cancelEventRegistration,
  createEvent,
  deleteEvent,
  listEvents,
  registerForEvent,
  removeParticipant,
  updateEvent
} from "./events.controller.js";
import {
  createEventSchema,
  eventIdParamsSchema,
  eventListQuerySchema,
  manageParticipantSchema,
  updateEventSchema
} from "./events.schemas.js";

export const eventsRouter = Router();

eventsRouter.get("/", validate({ query: eventListQuerySchema }), asyncHandler(listEvents));
eventsRouter.post("/", authenticate, authorize(Roles.admin), validate({ body: createEventSchema }), asyncHandler(createEvent));
eventsRouter.patch(
  "/:id",
  authenticate,
  authorize(Roles.admin),
  validate({ params: eventIdParamsSchema, body: updateEventSchema }),
  asyncHandler(updateEvent)
);
eventsRouter.delete("/:id", authenticate, authorize(Roles.admin), validate({ params: eventIdParamsSchema }), asyncHandler(deleteEvent));
eventsRouter.post("/:id/register", authenticate, validate({ params: eventIdParamsSchema }), asyncHandler(registerForEvent));
eventsRouter.delete("/:id/register", authenticate, validate({ params: eventIdParamsSchema }), asyncHandler(cancelEventRegistration));
eventsRouter.post(
  "/:id/participants",
  authenticate,
  authorize(Roles.admin),
  validate({ params: eventIdParamsSchema, body: manageParticipantSchema }),
  asyncHandler(addParticipant)
);
eventsRouter.delete(
  "/:id/participants",
  authenticate,
  authorize(Roles.admin),
  validate({ params: eventIdParamsSchema, body: manageParticipantSchema }),
  asyncHandler(removeParticipant)
);
