import sharp from 'sharp'
import {TransformationsDto} from './transformations.dto'
import {BadRequestException} from '@nestjs/common'

const M_PIXEL_LIMIT = 20
const IMAGE_SIZE_LIMIT = 10
const MAX_IMAGE_QUALITY = 80
const DEFAULT_IMAGE_QUALITY = 65

export class TransformGuard {
  private calculateMegaPixel(height: number, width: number) {
    return (height * width) / 1000 / 1000
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

  public checkDimensions(metadata: sharp.Metadata, transformations: TransformationsDto) {
    // Ensure that original picture is not more than M_PIXEL_LIMIT
    if (!transformations.extend && !transformations.resize) {
      const originalMP = this.calculateMegaPixel(metadata.height ?? 0, metadata.width ?? 0)
      if (originalMP > M_PIXEL_LIMIT) {
        const {newWidth, newHeight} = this.resizeDimensions(
          metadata.width ?? 0,
          metadata.height ?? 0,
          M_PIXEL_LIMIT
        )
        transformations.resize = {width: newWidth, height: newHeight}
      }
      return
    }

    let height = transformations.resize?.height ? transformations.resize?.height : metadata.height

    const totalHeight =
      (height ?? 0) + (transformations.extend?.top ?? 0) + (transformations.extend?.bottom ?? 0)

    const width = transformations.resize?.width ? transformations.resize?.width : metadata.width

    const totalWidth =
      (width ?? 0) + (transformations.extend?.left ?? 0) + (transformations.extend?.right ?? 0)

    const mPixel = this.calculateMegaPixel(totalHeight, totalWidth)
    if (mPixel > M_PIXEL_LIMIT) {
      throw new BadRequestException(`Transformation exceeds pixel limit!`)
    }
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
