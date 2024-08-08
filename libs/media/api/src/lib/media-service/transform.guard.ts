import sharp from 'sharp'
import {TransformationsDto} from './transformations.dto'
import {BadRequestException} from '@nestjs/common'

const M_PIXEL_LIMIT = 25
const IMAGE_SIZE_LIMIT = 10

export class TransformGuard {
  checkDimensions(metadata: sharp.Metadata, transformations: TransformationsDto) {
    let height = transformations.resize?.height ? transformations.resize?.height : metadata.height

    const totalHeight =
      (height ?? 0) + (transformations.extend?.top ?? 0) + (transformations.extend?.bottom ?? 0)

    const width = transformations.resize?.width ? transformations.resize?.width : metadata.width

    const totalWidth =
      (width ?? 0) + (transformations.extend?.left ?? 0) + (transformations.extend?.right ?? 0)

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
