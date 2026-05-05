import { Router } from "express";
import { authenticate, authorize } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { Roles } from "../../common/types/domain.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { getContentPage, upsertContentPage } from "./content.controller.js";
import { contentKeyParamsSchema, upsertContentSchema } from "./content.schemas.js";

export const contentRouter = Router();

contentRouter.get("/:key", validate({ params: contentKeyParamsSchema }), asyncHandler(getContentPage));
contentRouter.put(
  "/:key",
  authenticate,
  authorize(Roles.admin),
  validate({ params: contentKeyParamsSchema, body: upsertContentSchema }),
  asyncHandler(upsertContentPage)
);
