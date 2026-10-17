import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  SortOrder,
} from '@wepublish/utils/api';
import {
  AudioFilter,
  AudioListArgs,
  AudioSort,
  UpdateAudioInput,
  UploadAudioInput,
} from './audio.model';
import { AudioUploadService } from './audio-upload.service';

@Injectable()
export class AudioService {
  constructor(
    private prisma: PrismaClient,
    private upload: AudioUploadService
  ) {}

  async getAudios({
    filter,
    cursorId,
    sort = AudioSort.CreatedAt,
    order = SortOrder.Descending,
    take = 10,
    skip,
  }: AudioListArgs) {
    const orderBy = createAudioOrder(sort, order);
    const where = createAudioFilter(filter ?? {});

    const [totalCount, audios] = await Promise.all([
      this.prisma.audio.count({
        where,
        orderBy,
      }),
      this.prisma.audio.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = audios.slice(0, getMaxTake(take));
    const firstAudio = nodes[0];
    const lastAudio = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = audios.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstAudio?.id,
        endCursor: lastAudio?.id,
      },
    };
  }

  async updateAudio({ id, ...input }: UpdateAudioInput) {
    return this.prisma.audio.update({
      where: { id },
      data: { ...input },
    });
  }

  async createAudio(input: UploadAudioInput) {
    return this.upload.uploadAudio(input);
  }

  async deleteAudio(id: string) {
    return this.upload.deleteAudio(id);
  }
}

export const createAudioOrder = (
  field: AudioSort,
  sortOrder: SortOrder
): Prisma.AudioFindManyArgs['orderBy'] => {
  switch (field) {
    case AudioSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case AudioSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createTitleFilter = (
  filter: Partial<AudioFilter>
): Prisma.AudioWhereInput => {
  if (filter?.title) {
    return {
      OR: [
        {
          title: {
            contains: filter.title,
            mode: 'insensitive',
          },
        },
        {
          filename: {
            contains: filter.title,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  return {};
};

export const createAudioFilter = (
  filter: Partial<AudioFilter>
): Prisma.AudioWhereInput => ({
  AND: [createTitleFilter(filter)],
});
