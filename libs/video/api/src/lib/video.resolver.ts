import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  Video,
  VideoListArgs,
  VideoStorageUsage,
  PaginatedVideos,
  UpdateVideoInput,
  UploadVideoInput,
} from './video.model';
import { MediaAdapter } from '@wepublish/image/api';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Permissions } from '@wepublish/permissions/api';
import {
  CanCreateVideo,
  CanDeleteVideo,
  CanGetVideo,
  CanGetVideos,
} from '@wepublish/permissions';
import { VideoService } from './video.service';
import { VideoUploadService } from './video-upload.service';
import { PrismaClient } from '@prisma/client';

@Resolver(() => Video)
export class VideoResolver {
  constructor(
    private service: VideoService,
    private uploadService: VideoUploadService,
    private mediaAdapter: MediaAdapter,
    private prisma: PrismaClient
  ) {}

  @Permissions(CanGetVideos)
  @Query(() => PaginatedVideos, {
    description: `Returns a paginated list of videos based on the filters given.`,
  })
  public videos(@Args() filter: VideoListArgs) {
    return this.service.getVideos(filter);
  }

  @Permissions(CanGetVideo)
  @Query(() => Video, { description: `Returns a video by id.` })
  public async video(@Args('id') id: string) {
    const video = await this.prisma.video.findUnique({ where: { id } });

    if (!video) {
      throw new NotFoundException(`Video with id ${id} was not found.`);
    }

    return video;
  }

  @Permissions(CanGetVideos)
  @Query(() => VideoStorageUsage, {
    description: `Returns the current video storage usage and limit.`,
  })
  public videoStorageUsage() {
    return this.uploadService.getStorageUsage();
  }

  @Permissions(CanCreateVideo)
  @Mutation(returns => Video, { description: `Uploads a new video.` })
  public uploadVideo(@Args() video: UploadVideoInput) {
    if (process.env['DISABLE_VIDEO_UPLOAD'] === 'true') {
      throw new ForbiddenException('Video upload has been disabled.');
    }
    return this.service.createVideo(video);
  }

  @Permissions(CanCreateVideo)
  @Mutation(returns => Video, {
    description: `Updates an existing video.`,
  })
  public updateVideo(@Args() video: UpdateVideoInput) {
    return this.service.updateVideo(video);
  }

  @Permissions(CanDeleteVideo)
  @Mutation(returns => String, {
    description: `Deletes an existing video.`,
  })
  public deleteVideo(@Args('id') id: string) {
    return this.service.deleteVideo(id);
  }

  @ResolveField(() => String)
  public async url(@Parent() video: Video) {
    return this.mediaAdapter.getVideoURL(video);
  }

  @ResolveField(() => String, { nullable: true })
  public async posterUrl(@Parent() video: Video) {
    if (!video.hasPoster) {
      return null;
    }

    return this.mediaAdapter.getVideoPosterURL(video);
  }
}
