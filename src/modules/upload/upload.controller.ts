import { Request, Response } from 'express'
import { UploadService } from './upload.service'

const uploadService = new UploadService()

export class UploadController {
  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'File is required',
        })
      }

      const result = await uploadService.uploadImage(req.file)

      return res.json(result)
    } catch (e) {
      console.error(e)

      return res.status(500).json({
        message: 'Upload failed',
      })
    }
  }
}
