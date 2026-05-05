import type { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";
import { RatingsService } from "./ratings.service.js";

const service = new RatingsService(prisma);

export const getTop = async (req: Request, res: Response) => {
  res.json(await service.top(req.params.game as never, req.query as never));
};

export const awardPoints = async (req: Request, res: Response) => {
  res.status(201).json(await service.award(req.body));
};
