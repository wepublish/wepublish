import {Inject, Injectable, NotFoundException} from '@nestjs/common'
import sharp from 'sharp'
import {TransformationsDto} from './transformations.dto'
import {StorageClient} from '../storage-client/storage-client.service'
import {TransformGuard} from './transform.guard'
import {createHash} from 'crypto'
import {Readable} from 'stream'

export const MEDIA_SERVICE_MODULE_OPTIONS = Symbol('MEDIA_SERVICE_MODULE_OPTIONS')

export type MediaServiceConfig = {
  uploadBucket: string
  transformationBucket: string
}

export const getTransformationKey = (transformations: TransformationsDto) => {
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

  private generateETag(buffer: Buffer): string {
    const hash = createHash('md5')
    hash.update(buffer)
    return `"${hash.digest('hex')}"`
  }

  private bufferStream(stream: Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', chunk => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  }

  public async getRemoteEtag(image: string) {
    return (await this.storage.getFileInformation(this.config.transformationBucket, image)).etag
  }

  public async getImage(imageId: string, transformations: TransformationsDto) {
    const transformationsKey = getTransformationKey(transformations)

    let file: Readable
    try {
      file = await this.storage.getFile(
        this.config.transformationBucket,
        `images/${imageId}/${transformationsKey}`
      )
    } catch (e: any) {
      if (e.code == 'NoSuchKey') {
        return await this.transformImage(imageId, transformations)
      }
      throw e
    }
    const fileBuffer = await this.bufferStream(file)
    const etag = this.generateETag(fileBuffer)

    return await Promise.all([Readable.from(fileBuffer), etag])
  }

  private async transformImage(imageId: string, transformations: TransformationsDto) {
    let imageStream: Readable
    try {
      imageStream = await this.storage.getFile(this.config.uploadBucket, `images/${imageId}`)
    } catch (e: any) {
      if (e.code == 'NoSuchKey') {
        throw new NotFoundException()
      }

      throw e
    }

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
      // Prevent animated image from enlarging (DOS prevention)
      if (transformGuard.isAnimatedImage(metadata)) {
        transformations.resize.withoutEnlargement = true
      }
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
      effort
    })

    metadata = await sharp(await transformedImage.clone().toBuffer()).metadata()
    transformGuard.checkImageSize(metadata)

    await this.storage.saveFile(
      this.config.transformationBucket,
      `images/${imageId}/${transformationsKey}`,
      transformedImage.clone(),
      metadata.size,
      {ContentType: `image/${metadata.format}`}
    )
    const etag = this.generateETag(await this.bufferStream(transformedImage.clone()))

    return Promise.all([transformedImage, etag])
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
    // Delete Transformations
    const objects = await this.storage.listFiles(
      this.config.transformationBucket,
      `images/${imageId}`,
      true
    )
    this.storage.deleteFiles(
      this.config.transformationBucket,
      objects.map(file => file.name || '')
    )

    // Delete main image
    return await this.storage.deleteFile(this.config.uploadBucket, `images/${imageId}`)
  }
}
