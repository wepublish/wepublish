import {Inject, Injectable} from '@nestjs/common'
import sharp from 'sharp'
import {TransformationsDto} from './transformations.dto'
import {StorageClient} from '../storage-client/storage-client.service'

export const MEDIA_SERVICE_MODULE_OPTIONS = Symbol('MEDIA_SERVICE_MODULE_OPTIONS')

export type MediaServiceConfig = {
  uploadBucket: string
  transformationBucket: string
}

const getTransformationKey = (transformations: TransformationsDto) => {
  return JSON.stringify(transformations, (_key, value) =>
    value instanceof Object && !(value instanceof Array)
      ? Object.keys(value)
          .sort()
          .reduce((sorted, key) => {
            sorted[key] = value[key]
            return sorted
          }, {} as Record<string, unknown>)
      : value
  )
}

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_SERVICE_MODULE_OPTIONS) private config: MediaServiceConfig,
    private storage: StorageClient
  ) {}

  public async getImage(imageId: string, transformations: TransformationsDto) {
    const transformationsKey = getTransformationKey(transformations)
    const isAlreadyTransformed = await this.storage.hasFile(
      this.config.transformationBucket,
      `images/${imageId}/${transformationsKey}.webp`
    )

    if (!isAlreadyTransformed) {
      return await this.transformImage(imageId, transformations)
    }

    return await Promise.all([
      this.storage.getFile(
        this.config.transformationBucket,
        `images/${imageId}/${transformationsKey}.webp`
      ),
      this.storage.getFileInformation(
        this.config.transformationBucket,
        `images/${imageId}/${transformationsKey}.webp`
      )
    ])
  }

  private async transformImage(imageId: string, transformations: TransformationsDto) {
    const imageStream = await this.storage.getFile(
      this.config.uploadBucket,
      `images/${imageId}.webp`
    )

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
    const transformedImage = sharpInstance.webp({
      quality: transformations.quality
    })

    await this.storage.saveFile(
      this.config.transformationBucket,
      `images/${imageId}/${transformationsKey}.webp`,
      transformedImage.clone()
    )

    return Promise.all([
      transformedImage,
      this.storage.getFileInformation(
        this.config.transformationBucket,
        `images/${imageId}/${transformationsKey}.webp`
      )
    ])
  }

  public async saveImage(imageId: string, image: Buffer) {
    const sharpInstance = sharp(image, {
      animated: true
    })

    await this.storage.saveFile(
      this.config.uploadBucket,
      `images/${imageId}.webp`,
      sharpInstance.webp({
        quality: 100,
        nearLossless: true
      })
    )

    return await sharpInstance.metadata()
  }

  public async hasImage(imageId: string): Promise<boolean> {
    return await this.storage.hasFile(this.config.uploadBucket, `images/${imageId}.webp`)
  }

  public async deleteImage(imageId: string) {
    return await this.storage.deleteFile(this.config.uploadBucket, `images/${imageId}.webp`)
  }
}
