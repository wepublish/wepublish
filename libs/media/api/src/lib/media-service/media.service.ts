import {Inject, Injectable} from '@nestjs/common'
import sharp from 'sharp'
import {TransformationsDto} from './transformations.dto'
import {StorageClient} from '../storage-client/storage-client.service'
import {TransformGuard} from './transform.guard'

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
      `images/${imageId}/${transformationsKey}`
    )

    if (!isAlreadyTransformed) {
      return await this.transformImage(imageId, transformations)
    }

    return await Promise.all([
      this.storage.getFile(
        this.config.transformationBucket,
        `images/${imageId}/${transformationsKey}`
      ),
      this.storage.getFileInformation(
        this.config.transformationBucket,
        `images/${imageId}/${transformationsKey}`
      )
    ])
  }

  private async transformImage(imageId: string, transformations: TransformationsDto) {
    const imageStream = await this.storage.getFile(this.config.uploadBucket, `images/${imageId}`)

    const sharpInstance = imageStream.pipe(
      sharp({
        animated: true,
        failOn: 'error'
      })
    )
    let metadata = await sharpInstance.metadata()

    const transformGuard = new TransformGuard()
    const effort = transformGuard.checkDimensions(metadata, transformations)
    transformGuard.checkQuality(transformations)

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
      quality: transformations.quality,
      effort: effort
    })

    metadata = await transformedImage.metadata()
    transformGuard.checkImageSize(metadata)

    await this.storage.saveFile(
      this.config.transformationBucket,
      `images/${imageId}/${transformationsKey}`,
      transformedImage.clone(),
      metadata.size,
      {ContentType: `image/${metadata.format}`}
    )

    return Promise.all([
      transformedImage,
      this.storage.getFileInformation(
        this.config.transformationBucket,
        `images/${imageId}/${transformationsKey}`
      )
    ])
  }

  public async saveImage(imageId: string, image: Buffer) {
    const metadata = await sharp(image).metadata()
    await this.storage.saveFile(
      this.config.uploadBucket,
      `images/${imageId}`,
      image,
      metadata.size,
      {ContentType: `image/${metadata.format}`}
    )
    return metadata
  }

  public async hasImage(imageId: string): Promise<boolean> {
    return await this.storage.hasFile(this.config.uploadBucket, `images/${imageId}`)
  }

  public async deleteImage(imageId: string) {
    return await this.storage.deleteFile(this.config.uploadBucket, `images/${imageId}`)
  }
}
