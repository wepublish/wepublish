import sharp from 'sharp'
import {TransformationsDto} from './transformations.dto'
import {BadRequestException} from '@nestjs/common'

const M_PIXEL_LIMIT = 20
// WebP Max
const M_PIXEL_LIMIT_ANIMATED = 60
const IMAGE_SIZE_LIMIT = 10
const MAX_IMAGE_QUALITY = 80
const DEFAULT_IMAGE_QUALITY = 65

export class TransformGuard {
  private calculateMegaPixel(height: number, width: number) {
    return (height * width) / 1000 / 1000
  }

  private calculateEffort(mPixel: number): number {
    const effort = Math.ceil(4 - mPixel / (M_PIXEL_LIMIT / 5))
    return effort < 0 ? 0 : effort
  }

  private resizeDimensions(
    originalWidth: number,
    originalHeight: number,
    targetMPixelCount: number
  ): {newWidth: number; newHeight: number} {
    const targetPixelCount = targetMPixelCount * 1000 * 1000
    const originalPixelCount = originalWidth * originalHeight
    const scaleFactor = Math.sqrt(targetPixelCount / originalPixelCount)
    const newWidth = Math.round(originalWidth * scaleFactor)
    const newHeight = Math.round(originalHeight * scaleFactor)
    return {newWidth, newHeight}
  }

  private dimensionAutoResizeCheck(t: TransformationsDto) {
    return (
      !t.extend?.right &&
      !t.extend?.left &&
      !t.extend?.top &&
      !t.extend?.bottom &&
      !t.resize?.width &&
      !t.resize?.height
    )
  }

  public isAnimatedImage(metadata: sharp.Metadata) {
    return metadata.pages && metadata.pages > 1
  }

  public checkDimensions(metadata: sharp.Metadata, transformations: TransformationsDto): number {
    const originalHeight = metadata.height
    const resizeHeight = transformations.resize?.height
    const originalWidth = metadata.width
    const resizeWidth = transformations.resize?.width
    const hasAnimation = this.isAnimatedImage(metadata)

    let mpLimit = M_PIXEL_LIMIT
    if (hasAnimation) {
      mpLimit = M_PIXEL_LIMIT_ANIMATED
    }

    // Ensure that original picture is not more than M_PIXEL_LIMIT
    if (this.dimensionAutoResizeCheck(transformations)) {
      const originalMP = this.calculateMegaPixel(metadata.height ?? 0, metadata.width ?? 0)

      if (originalMP > mpLimit) {
        const {newWidth, newHeight} = this.resizeDimensions(
          metadata.width ?? 0,
          metadata.height ?? 0,
          mpLimit
        )
        transformations.resize = {width: newWidth, height: newHeight, withoutEnlargement: true}
        return this.calculateEffort(this.calculateMegaPixel(newHeight, newWidth))
      }
      return this.calculateEffort(originalMP)
    }

    let height = resizeHeight ? resizeHeight : originalHeight
    let width = resizeWidth ? resizeWidth : originalWidth

    // If withoutEnlargement is set or animation and dimension is larger than original set it to original dimension
    if (transformations?.resize?.withoutEnlargement || hasAnimation) {
      if (originalHeight && resizeHeight && resizeHeight > originalHeight) {
        height = originalHeight
      }
      if (originalWidth && resizeWidth && resizeWidth > originalWidth) {
        width = originalWidth
      }
    }

    const totalHeight =
      (height ?? 0) + (transformations.extend?.top ?? 0) + (transformations.extend?.bottom ?? 0)

    const totalWidth =
      (width ?? 0) + (transformations.extend?.left ?? 0) + (transformations.extend?.right ?? 0)

    const mPixel = this.calculateMegaPixel(totalHeight, totalWidth)
    if (mPixel > mpLimit) {
      throw new BadRequestException(`Transformation exceeds pixel limit!`)
    }
    return this.calculateEffort(mPixel)
  }

  public checkImageSize(metadata: sharp.Metadata) {
    const mByte = (metadata.size ?? 0) / 1000 / 1000
    if (mByte > IMAGE_SIZE_LIMIT) {
      throw new BadRequestException(`Transformation exceeds image size limit!`)
    }
  }

  public checkQuality(transformations: TransformationsDto) {
    if (transformations.quality) {
      if (transformations.quality > MAX_IMAGE_QUALITY) {
        throw new BadRequestException(`Transformation exceeds quality limit!`)
      }
    } else {
      transformations.quality = DEFAULT_IMAGE_QUALITY
    }
  }
}
