import type { Request, Response } from "express";
import { unauthorized } from "../../common/errors/app-error.js";
import { prisma } from "../../prisma/client.js";
import { EventsService } from "./events.service.js";

const service = new EventsService(prisma);

export const listEvents = async (req: Request, res: Response) => {
  res.json(await service.list(req.query as never));
};

export const createEvent = async (req: Request, res: Response) => {
  res.status(201).json(await service.create(req.body));
};

export const updateEvent = async (req: Request, res: Response) => {
  res.json(await service.update(req.params.id as string, req.body));
};

export const deleteEvent = async (req: Request, res: Response) => {
  res.json(await service.delete(req.params.id as string));
};

export const registerForEvent = async (req: Request, res: Response) => {
  const userId = req.body.userId ?? req.user?.id;
  if (!userId) throw unauthorized();
  res.status(201).json(await service.registerUser(req.params.id as string, userId));
};

export const cancelEventRegistration = async (req: Request, res: Response) => {
  if (!req.user) throw unauthorized();
  res.json(await service.cancelRegistration(req.params.id as string, req.user.id));
};

export const addParticipant = async (req: Request, res: Response) => {
  res.status(201).json(await service.addParticipant(req.params.id as string, req.body.userId));
};

export const removeParticipant = async (req: Request, res: Response) => {
  res.json(await service.removeParticipant(req.params.id as string, req.body.userId));
};
