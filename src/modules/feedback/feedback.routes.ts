import { Router } from "express";
import { authenticate, authorize } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { Roles } from "../../common/types/domain.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { createFeedback, listFeedback } from "./feedback.controller.js";
import { feedbackCreateSchema, feedbackListQuerySchema } from "./feedback.schemas.js";

export const feedbackRouter = Router();

feedbackRouter.post("/", validate({ body: feedbackCreateSchema }), asyncHandler(createFeedback));
feedbackRouter.get("/", authenticate, authorize(Roles.admin), validate({ query: feedbackListQuerySchema }), asyncHandler(listFeedback));
