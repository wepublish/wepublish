import { ForbiddenException, Injectable } from '@nestjs/common';
import { MediaAdapter } from '@wepublish/image/api';
import { PrismaClient } from '@prisma/client';
import { UploadVideoInput } from './video.model';
import { Video } from '@prisma/client';

export type UploadVideoResult = Pick<
  Video,
  'id' | 'filename' | 'fileSize' | 'extension' | 'mimeType'
>;

const STORAGE_LIMIT_BYTES =
  (() => {
    const mb = parseInt(process.env['VIDEO_STORAGE_LIMIT_MB'] ?? '', 10);
    if (isNaN(mb) || mb < 0) return 100 * 1000; // 100 GB in MB (SI)
    return mb;
  })() *
  1000 *
  1000; // convert MB to bytes (SI)

@Injectable()
export class VideoUploadService {
  constructor(
    private prisma: PrismaClient,
    private mediaAdapter: MediaAdapter
  ) {}

  async getStorageUsage() {
    const result = await this.prisma.video.aggregate({
      _sum: { fileSize: true },
      _count: true,
    });
    return {
      usedBytes: result._sum.fileSize ?? 0,
      limitBytes: STORAGE_LIMIT_BYTES === 0 ? 0 : STORAGE_LIMIT_BYTES,
      videoCount: result._count,
    };
  }

  async uploadVideo({ file, poster, ...input }: UploadVideoInput) {
    if (STORAGE_LIMIT_BYTES > 0) {
      const { usedBytes } = await this.getStorageUsage();
      if (usedBytes >= STORAGE_LIMIT_BYTES) {
        throw new ForbiddenException(
          'Video storage limit exceeded. Please delete some videos or contact your administrator.'
        );
      }
    }

    const { id, ...video } = await this.mediaAdapter.uploadVideo(file, poster);

    return this.prisma.video.create({
      data: {
        id,
        ...input,
        ...video,
        filename: input.filename ?? video.filename,
        hasPoster: Boolean(poster),
      },
    });
  }

  async deleteVideo(videoId: string) {
    await this.mediaAdapter.deleteVideo(videoId);
    await this.prisma.video.delete({ where: { id: videoId } });

    return videoId;
  }
}
