import type { Request, Response } from "express";
import { ContentPageKeys, type ContentPageKey } from "../../common/types/domain.js";
import { prisma } from "../../prisma/client.js";
import { ContentService } from "./content.service.js";

const service = new ContentService(prisma);

export const getContentPage = async (req: Request, res: Response) => {
  res.json(await service.get(req.params.key as ContentPageKey));
};

export const getRules = async (_req: Request, res: Response) => {
  res.json(await service.get(ContentPageKeys.rules));
};

export const upsertContentPage = async (req: Request, res: Response) => {
  res.json(await service.upsert(req.params.key as ContentPageKey, req.body));
};
