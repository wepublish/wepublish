import * as crypto from 'crypto'
import {TransformationsDto} from '../media-service/transformations.dto'
import {getTransformationKey} from '../media-service/media.service'
import {timingSafeEqual} from 'crypto'

const TOKEN = process.env['MEDIA_SERVER_TOKEN'] || process.env['TOKEN']
if (!TOKEN) throw new Error('MEDIA_SERVER_TOKEN missing')
const KEY = Buffer.from(TOKEN, 'base64')

export class MediaServerSignatureHelper {
  static getSignatureForImage(imageId: string, transformations: TransformationsDto) {
    const transformationsKeys = getTransformationKey(transformations)
    return crypto
      .createHmac('sha256', KEY)
      .update(`${imageId}-${transformationsKeys}`)
      .digest('base64url')
  }

  static timeConstantCompare(a: string, b: string): boolean {
    try {
      return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
    } catch {
      return false
    }
  }
  static removeSignatureFromTransformations(t: TransformationsDto) {
    const {sig, ...dataWithoutSignature} = t
    return dataWithoutSignature
  }
}
