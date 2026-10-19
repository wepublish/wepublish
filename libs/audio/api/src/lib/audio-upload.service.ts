import { ForbiddenException, Injectable } from '@nestjs/common';
import { MediaAdapter } from '@wepublish/image/api';
import { PrismaClient } from '@prisma/client';
import { UploadAudioInput } from './audio.model';
import { Audio } from '@prisma/client';

export type UploadAudioResult = Pick<
  Audio,
  'id' | 'filename' | 'fileSize' | 'extension' | 'mimeType'
>;

const STORAGE_LIMIT_BYTES =
  (() => {
    const mb = parseInt(process.env['AUDIO_STORAGE_LIMIT_MB'] ?? '', 10);
    if (isNaN(mb) || mb < 0) return 100 * 1000; // 100 GB in MB (SI)
    return mb;
  })() *
  1000 *
  1000; // convert MB to bytes (SI)

@Injectable()
export class AudioUploadService {
  constructor(
    private prisma: PrismaClient,
    private mediaAdapter: MediaAdapter
  ) {}

  async getStorageUsage() {
    const result = await this.prisma.audio.aggregate({
      _sum: { fileSize: true },
      _count: true,
    });
    return {
      usedBytes: result._sum.fileSize ?? 0,
      limitBytes: STORAGE_LIMIT_BYTES === 0 ? 0 : STORAGE_LIMIT_BYTES,
      audioCount: result._count,
    };
  }

  async uploadAudio({ file, ...input }: UploadAudioInput) {
    if (STORAGE_LIMIT_BYTES > 0) {
      const { usedBytes } = await this.getStorageUsage();
      if (usedBytes >= STORAGE_LIMIT_BYTES) {
        throw new ForbiddenException(
          'Audio storage limit exceeded. Please delete some audios or contact your administrator.'
        );
      }
    }

    const { id, ...audio } = await this.mediaAdapter.uploadAudio(file);

    return this.prisma.audio.create({
      data: {
        id,
        ...input,
        ...audio,
        filename: input.filename ?? audio.filename,
      },
    });
  }

  async deleteAudio(audioId: string) {
    await this.mediaAdapter.deleteAudio(audioId);
    await this.prisma.audio.delete({ where: { id: audioId } });

    return audioId;
  }
}
