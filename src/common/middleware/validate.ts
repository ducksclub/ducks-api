import type { NextFunction, Request, Response } from 'express'
import type { z, ZodTypeAny } from 'zod'

type Schemas = {
  body?: ZodTypeAny
  query?: ZodTypeAny
  params?: ZodTypeAny
}

export const validate =
  (schemas: Schemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) req.body = schemas.body.parse(req.body) as z.infer<typeof schemas.body>
    if (schemas.query) req.query = schemas.query.parse(req.query) as z.infer<typeof schemas.query>
    if (schemas.params)
      req.params = schemas.params.parse(req.params) as z.infer<typeof schemas.params>
    next()
  }
