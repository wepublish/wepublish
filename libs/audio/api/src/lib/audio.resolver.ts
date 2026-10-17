import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  Audio,
  AudioListArgs,
  AudioStorageUsage,
  PaginatedAudios,
  UpdateAudioInput,
  UploadAudioInput,
} from './audio.model';
import { MediaAdapter } from '@wepublish/image/api';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Permissions } from '@wepublish/permissions/api';
import {
  CanCreateAudio,
  CanDeleteAudio,
  CanGetAudio,
  CanGetAudios,
} from '@wepublish/permissions';
import { AudioService } from './audio.service';
import { AudioUploadService } from './audio-upload.service';
import { PrismaClient } from '@prisma/client';

@Resolver(() => Audio)
export class AudioResolver {
  constructor(
    private service: AudioService,
    private uploadService: AudioUploadService,
    private mediaAdapter: MediaAdapter,
    private prisma: PrismaClient
  ) {}

  @Permissions(CanGetAudios)
  @Query(() => PaginatedAudios, {
    description: `Returns a paginated list of audios based on the filters given.`,
  })
  public audios(@Args() filter: AudioListArgs) {
    return this.service.getAudios(filter);
  }

  @Permissions(CanGetAudio)
  @Query(() => Audio, { description: `Returns a audio by id.` })
  public async audio(@Args('id') id: string) {
    const audio = await this.prisma.audio.findUnique({ where: { id } });

    if (!audio) {
      throw new NotFoundException(`Audio with id ${id} was not found.`);
    }

    return audio;
  }

  @Permissions(CanGetAudios)
  @Query(() => AudioStorageUsage, {
    description: `Returns the current audio storage usage and limit.`,
  })
  public audioStorageUsage() {
    return this.uploadService.getStorageUsage();
  }

  @Permissions(CanCreateAudio)
  @Mutation(returns => Audio, { description: `Uploads a new audio.` })
  public uploadAudio(@Args() audio: UploadAudioInput) {
    if (process.env['DISABLE_AUDIO_UPLOAD'] === 'true') {
      throw new ForbiddenException('Audio upload has been disabled.');
    }
    return this.service.createAudio(audio);
  }

  @Permissions(CanCreateAudio)
  @Mutation(returns => Audio, {
    description: `Updates an existing audio.`,
  })
  public updateAudio(@Args() audio: UpdateAudioInput) {
    return this.service.updateAudio(audio);
  }

  @Permissions(CanDeleteAudio)
  @Mutation(returns => String, {
    description: `Deletes an existing audio.`,
  })
  public deleteAudio(@Args('id') id: string) {
    return this.service.deleteAudio(id);
  }

  @ResolveField(() => String)
  public async url(@Parent() audio: Audio) {
    return this.mediaAdapter.getAudioURL(audio);
  }
}
