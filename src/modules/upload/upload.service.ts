import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

export class UploadService {
  async uploadImage(file: Express.Multer.File) {
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex')

    const fileName = `${hash}-${Date.now()}.jpg`

    const uploadDir = path.join(process.cwd(), 'uploads')
    const uploadPath = path.join(uploadDir, fileName)

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    fs.writeFileSync(uploadPath, file.buffer)

    return {
      url: `/uploads/${fileName}`,
      hash,
    }
  }
}
