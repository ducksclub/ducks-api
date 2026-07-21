import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import { badRequest } from '../../common/errors/app-error'

const MAX_IMAGE_DIMENSION = 1920
const WEBP_QUALITY = 80
const MAX_INPUT_PIXELS = 40_000_000

export class UploadService {
  async uploadImage(file: Express.Multer.File) {
    let image: { data: Buffer; info: sharp.OutputInfo }

    try {
      image = await sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: MAX_INPUT_PIXELS,
      })
        .rotate()
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer({ resolveWithObject: true })
    } catch {
      throw badRequest('Файл повреждён, имеет слишком большое разрешение или не является изображением')
    }

    const hash = crypto.createHash('sha256').update(image.data).digest('hex')
    const fileName = `${hash}.webp`

    const uploadDir = path.join(process.cwd(), 'uploads')
    const uploadPath = path.join(uploadDir, fileName)

    await fs.mkdir(uploadDir, { recursive: true })
    await fs.writeFile(uploadPath, image.data, { flag: 'wx' }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EEXIST') {
        throw error
      }
    })

    return {
      url: `/uploads/${fileName}`,
      hash,
      width: image.info.width,
      height: image.info.height,
      size: image.info.size,
      mimeType: 'image/webp',
    }
  }
}
