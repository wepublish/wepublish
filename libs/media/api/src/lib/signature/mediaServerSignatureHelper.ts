import * as crypto from 'crypto'
import {getTransformationKey, TransformationsDto} from '@wepublish/media/api'
import {timingSafeEqual} from 'crypto'

const TOKEN = process.env['MEDIA_SERVER_TOKEN'] ?? process.env['TOKEN']

export class MediaServerSignatureHelper {
  static getSignatureForImage(imageId: string, transformations: TransformationsDto) {
    const transformationsKeys = getTransformationKey(transformations)
    return crypto
      .createHash('sha256')
      .update(`${TOKEN}-${imageId}-${transformationsKeys}`)
      .digest('base64url')
  }

  static timeConstantCompare(a: string, b: string): boolean {
    try {
      return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
    } catch {
      return false
    }
  }
}
