import express from 'express'
import multer from 'multer'
import { UploadController } from './upload.controller'
import { asyncHandler } from '../../common/utils/async-handler'
import { badRequest } from '../../common/errors/app-error'

export const uploadRouter = express.Router()
const controller = new UploadController()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(badRequest('Поддерживаются только изображения JPEG, PNG и WebP'))
    }

    callback(null, true)
  },
})

uploadRouter.post(
  '/image',
  (req, res, next) => {
    upload.single('file')(req, res, (error) => {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return next(badRequest('Размер изображения не должен превышать 20 МБ'))
      }

      next(error)
    })
  },
  asyncHandler((req, res) => controller.uploadImage(req, res)),
)
