import {Injectable} from '@nestjs/common'
import {StorageClient} from '@wepublish/media/api'
import sharp from 'sharp'
import {TransformationsDto} from './transformations.dto'
import {Readable} from 'stream'

const getTransformationKey = (transformations: TransformationsDto) => {
  return JSON.stringify(transformations, (key, value) =>
    value instanceof Object && !(value instanceof Array)
      ? Object.keys(value)
          .sort()
          .reduce((sorted, key) => {
            sorted[key] = value[key]
            return sorted
          }, {})
      : value
  )
}

@Injectable()
export class AppService {
  constructor(private storage: StorageClient) {}

  public async getData(imageId: string, transformations: TransformationsDto) {
    const transformationsKey = getTransformationKey(transformations)
    const isAlreadyTransformed = await this.storage.hasFile(
      'wepublish-transformed',
      `images/${imageId}/${transformationsKey}.webp`
    )

    if (!isAlreadyTransformed) {
      return await this.transformImage(imageId, transformations)
    }

    return await Promise.all([
      this.storage.getFile('wepublish-transformed', `images/${imageId}/${transformationsKey}.webp`),
      this.storage.getFileInformation(
        'wepublish-transformed',
        `images/${imageId}/${transformationsKey}.webp`
      )
    ])
  }

  public async transformImage(imageId: string, transformations: TransformationsDto) {
    const imageStream = await this.storage.getFile('wepublish-staff', `images/${imageId}.webp`)

    const sharpInstance = imageStream.pipe(
      sharp({
        animated: true
      })
    )

    if (transformations.extend) {
      sharpInstance.extend(transformations.extend)
    }

    if (transformations.resize) {
      sharpInstance.resize(transformations.resize)
    }

    if (transformations.blur) {
      sharpInstance.blur(transformations.blur)
    }

    if (transformations.sharpen) {
      sharpInstance.sharpen()
    }

    if (transformations.flip) {
      sharpInstance.flip(transformations.flip)
    }

    if (transformations.flop) {
      sharpInstance.flop(transformations.flop)
    }

    if (transformations.rotate) {
      sharpInstance.rotate(transformations.rotate)
    }

    if (transformations.negate) {
      sharpInstance.negate(transformations.negate)
    }

    if (transformations.grayscale) {
      sharpInstance.grayscale(transformations.grayscale)
    }

    const transformationsKey = getTransformationKey(transformations)
    await this.storage.saveFile(
      'wepublish-transformed',
      `images/${imageId}/${transformationsKey}.webp`,
      sharpInstance.webp({
        quality: transformations.quality
      })
    )

    return Promise.all([
      sharpInstance.webp({
        quality: transformations.quality
      }),
      this.storage.getFileInformation(
        'wepublish-transformed',
        `images/${imageId}/${transformationsKey}.webp`
      )
    ])
  }

  public async saveImage(imageId: string, image: Buffer) {
    const sharpInstance = sharp(image, {
      animated: true
    })

    await this.storage.saveFile(
      'wepublish-staff',
      `images/${imageId}.webp`,
      sharpInstance.webp({
        quality: 100,
        lossless: true
      })
    )

    return await sharpInstance.metadata()
  }

  public async deleteImage(imageId: string) {
    return await this.storage.deleteFile('wepublish-staff', `images/${imageId}.webp`)
  }
}
