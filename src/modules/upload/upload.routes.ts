import express from 'express'
import multer from 'multer'
import { UploadController } from './upload.controller'

export const uploadRouter = express.Router()
const controller = new UploadController()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024, // 6MB
  },
})

uploadRouter.post('/image', upload.single('file'), (req, res) => controller.uploadImage(req, res))
