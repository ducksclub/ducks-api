import { Router } from "express";
import { authenticate, authorize } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { Roles } from "../../common/types/domain.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { awardPoints, getTop } from "./ratings.controller.js";
import { awardPointsSchema, ratingGameParamsSchema, ratingListQuerySchema } from "./ratings.schemas.js";

export const ratingsRouter = Router();

ratingsRouter.get("/:game", validate({ params: ratingGameParamsSchema, query: ratingListQuerySchema }), asyncHandler(getTop));
ratingsRouter.post("/points/award", authenticate, authorize(Roles.admin), validate({ body: awardPointsSchema }), asyncHandler(awardPoints));
