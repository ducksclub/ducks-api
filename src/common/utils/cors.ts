import { env } from '../../config/env'

import type { CorsOptions } from 'cors'

export const allowedOrigins =
  env.CORS_ORIGIN === '*'
    ? ['*']
    : env.CORS_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    /**
     * origin может отсутствовать у curl, Postman, server-to-server requests.
     * Такие запросы разрешаем.
     */
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes('*')) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`CORS blocked origin: ${origin}`))
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}
