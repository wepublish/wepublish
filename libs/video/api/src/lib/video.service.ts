import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  SortOrder,
} from '@wepublish/utils/api';
import {
  VideoFilter,
  VideoListArgs,
  VideoSort,
  UpdateVideoInput,
  UploadVideoInput,
} from './video.model';
import { VideoUploadService } from './video-upload.service';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaClient,
    private upload: VideoUploadService
  ) {}

  async getVideos({
    filter,
    cursorId,
    sort = VideoSort.CreatedAt,
    order = SortOrder.Descending,
    take = 10,
    skip,
  }: VideoListArgs) {
    const orderBy = createVideoOrder(sort, order);
    const where = createVideoFilter(filter ?? {});

    const [totalCount, videos] = await Promise.all([
      this.prisma.video.count({
        where,
        orderBy,
      }),
      this.prisma.video.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = videos.slice(0, getMaxTake(take));
    const firstVideo = nodes[0];
    const lastVideo = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = videos.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstVideo?.id,
        endCursor: lastVideo?.id,
      },
    };
  }

  async updateVideo({ id, ...input }: UpdateVideoInput) {
    return this.prisma.video.update({
      where: { id },
      data: { ...input },
    });
  }

  async createVideo(input: UploadVideoInput) {
    return this.upload.uploadVideo(input);
  }

  async deleteVideo(id: string) {
    return this.upload.deleteVideo(id);
  }
}

export const createVideoOrder = (
  field: VideoSort,
  sortOrder: SortOrder
): Prisma.VideoFindManyArgs['orderBy'] => {
  switch (field) {
    case VideoSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case VideoSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createTitleFilter = (
  filter: Partial<VideoFilter>
): Prisma.VideoWhereInput => {
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

export const createVideoFilter = (
  filter: Partial<VideoFilter>
): Prisma.VideoWhereInput => ({
  AND: [createTitleFilter(filter)],
});
