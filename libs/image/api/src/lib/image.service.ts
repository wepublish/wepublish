import { Injectable } from '@nestjs/common';
import { MediaAdapter } from './media-adapter';
import { PrismaClient } from '@prisma/client';
import { UploadImageInput } from './image.model';
import { ImageWithFocalPoint } from './image-dataloader.service';

@Injectable()
export class ImageService {
  constructor(
    readonly prisma: PrismaClient,
    readonly mediaAdapter: MediaAdapter
  ) {}

  async uploadNewImage(
    uploadImageInput: UploadImageInput
  ): Promise<ImageWithFocalPoint> {
    const {
      file,
      filename,
      title,
      description,
      tags,
      source,
      link,
      license,
      focalPoint,
    } = uploadImageInput;
    const { id, ...image } = await this.mediaAdapter.uploadImage(file);

    return this.prisma.image.create({
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
        focalPoint: {
          create: focalPoint,
        },
      },
      include: {
        focalPoint: true,
      },
    });
  }

  async replaceImage(
    imageId: string,
    uploadImageInput: UploadImageInput
  ): Promise<ImageWithFocalPoint> {
    const {
      file,
      filename,
      title,
      description,
      tags,
      source,
      link,
      license,
      focalPoint,
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
        focalPoint: {
          create: focalPoint,
        },
      },
      include: {
        focalPoint: true,
      },
    });
  }

  async deleteImage(imageId: string) {
    await this.mediaAdapter.deleteImage(imageId);
    await this.prisma.image.delete({ where: { id: imageId } });
  }

  @PrimeDataLoader(ImageDataloaderService)
  public async getImagesByTag(tag: string) {
    return this.prisma.image.findMany({
      where: {
        tags: {
          has: tag,
        },
      },
      include: {
        focalPoint: true,
      },
    });
  }
}
