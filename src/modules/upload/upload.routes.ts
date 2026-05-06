import express from 'express'
import multer from 'multer'
import { UploadController } from './upload.controller'

export const uploadRouter = express.Router()
const controller = new UploadController()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

uploadRouter.post('/image', upload.single('file'), (req, res) => controller.uploadImage(req, res))
