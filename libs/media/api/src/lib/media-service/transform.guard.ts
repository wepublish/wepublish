import sharp from 'sharp'
import {TransformationsDto} from '@wepublish/media/api'
import {BadRequestException} from '@nestjs/common'

const M_PIXEL_LIMIT = 10
const IMAGE_SIZE_LIMIT = 1

export class TransformGuard {
  constructor() {}
  checkDimensions(metadata: sharp.Metadata, transformations: TransformationsDto) {
    const totalHeight =
      (metadata.height ?? 0) +
      (transformations.extend?.top ?? 0) +
      (transformations.extend?.bottom ?? 0) +
      (transformations.resize?.height ?? 0)
    const totalWidth =
      (metadata.width ?? 0) +
      (transformations.extend?.left ?? 0) +
      (transformations.extend?.right ?? 0) +
      (transformations.resize?.width ?? 0)
    const mPixel = (totalHeight * totalWidth) / 1000 / 1000
    if (mPixel > M_PIXEL_LIMIT) {
      throw new BadRequestException(`Transformation exceeds pixel limit!`)
    }
  }
  checkImageSize(metadata: sharp.Metadata) {
    const mByte = (metadata.size ?? 0) / 1000 / 1000
    if (mByte > IMAGE_SIZE_LIMIT) {
      throw new BadRequestException(`Transformation exceeds image size limit!`)
    }
  }
}
