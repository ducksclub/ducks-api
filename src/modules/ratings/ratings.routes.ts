import { Router } from "express";
import { authenticate, authorize } from "../../common/middleware/auth";
import { validate } from "../../common/middleware/validate";
import { Roles } from "../../common/types/domain";
import { asyncHandler } from "../../common/utils/async-handler";
import { awardPoints, getTop } from "./ratings.controller";
import { awardPointsSchema, ratingGameParamsSchema } from "./ratings.schemas";

export const ratingsRouter = Router();

ratingsRouter.get(
  "/:game",
  validate({
    params: ratingGameParamsSchema,
  }),
  asyncHandler(getTop),
);
ratingsRouter.post(
  "/points/award",
  authenticate,
  authorize(Roles.admin),
  validate({ body: awardPointsSchema }),
  asyncHandler(awardPoints),
);
