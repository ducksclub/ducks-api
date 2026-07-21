import { Request, Response } from 'express'
import { UploadService } from './upload.service'
import { badRequest } from '../../common/errors/app-error'

const uploadService = new UploadService()

export class UploadController {
  async uploadImage(req: Request, res: Response) {
    if (!req.file) {
      throw badRequest('Необходимо выбрать изображение')
    }

    const result = await uploadService.uploadImage(req.file)

    return res.json(result)
  }
}
