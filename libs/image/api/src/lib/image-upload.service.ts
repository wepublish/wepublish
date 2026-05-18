import { Injectable } from '@nestjs/common';
import { MediaAdapter } from './media-adapter';
import { PrismaClient } from '@prisma/client';
import { UploadImageInput } from './image.model';
import { ImageDataloaderService } from './image-dataloader.service';
import { Image } from '@prisma/client';
import { PrimeDataLoader } from '@wepublish/utils/api';

export type UploadImage = Pick<
  Image,
  | 'id'
  | 'filename'
  | 'fileSize'
  | 'extension'
  | 'mimeType'
  | 'format'
  | 'width'
  | 'height'
>;

@Injectable()
export class ImageUploadService {
  constructor(
    private prisma: PrismaClient,
    private mediaAdapter: MediaAdapter
  ) {}

  @PrimeDataLoader(ImageDataloaderService)
  async uploadImage({ file, ...input }: UploadImageInput): Promise<Image> {
    const { id, ...image } = await this.mediaAdapter.uploadImage(file);

    return this.prisma.image.create({
      data: {
        id,
        ...input,
        ...image,
        filename: input.filename ?? image.filename,
      },
    });
  }

  async replaceImage(
    imageId: string,
    uploadImageInput: UploadImageInput
  ): Promise<Image> {
    const {
      file,
      filename,
      title,
      description,
      tags,
      source,
      link,
      license,
      focalPointX,
      focalPointY,
    } = uploadImageInput;
    const { id, ...image } = await this.mediaAdapter.uploadImage(file);

    return this.prisma.image.update({
      where: {
        id: imageId,
      },
      data: {
        id,
        ...image,
        filename: filename ?? image.filename,
        title,
        description,
        tags,
        source,
        link,
        license,
        focalPointX,
        focalPointY,
      },
    });
  }

  async deleteImage(imageId: string) {
    await this.mediaAdapter.deleteImage(imageId);
    await this.prisma.image.delete({ where: { id: imageId } });

    return imageId;
  }
}
