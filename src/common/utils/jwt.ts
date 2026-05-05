import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { Role } from "../types/domain.js";

export const signAccessToken = (payload: { id: string; email: string; role: Role }) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);
