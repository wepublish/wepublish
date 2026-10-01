import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PeerDataloaderService } from './peer-dataloader.service';
import { PrismaClient } from '@prisma/client';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { CreatePeerInput, UpdatePeerInput } from './peer.model';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { REMOTE_PEER_PROFILE_CACHE_NAMESPACE } from './peer-profile-cache';

@Injectable()
export class PeerService {
  constructor(
    private peerDataloaderService: PeerDataloaderService,
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  @PrimeDataLoader(PeerDataloaderService)
  async getPeers() {
    return this.prisma.peer.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @PrimeDataLoader(PeerDataloaderService)
  async getPeerByIdOrSlug(id?: string, slug?: string) {
    if ((!id && !slug) || (id && slug)) {
      throw new BadRequestException('You must provide either `id` or `slug`.');
    }

    let peer;
    if (id) {
      peer = await this.peerDataloaderService.load(id);
    } else {
      // For slug lookup, we need to query directly as the dataloader doesn't have a slug method
      peer = await this.prisma.peer.findUnique({
        where: { slug: slug! },
      });
    }

    if (peer?.isDisabled) {
      throw new NotFoundException('Peer is disabled');
    }

    return peer;
  }

  @PrimeDataLoader(PeerDataloaderService)
  async createPeer({ information, ...input }: CreatePeerInput) {
    return this.prisma.peer.create({
      data: {
        ...input,
        information: information as any,
      },
    });
  }

  @PrimeDataLoader(PeerDataloaderService)
  async updatePeer({ id, information, ...input }: UpdatePeerInput) {
    const peer = await this.prisma.peer.update({
      where: {
        id,
      },
      data: {
        ...input,
        information: information as any,
      },
    });
    await this.kv.resetNamespace(REMOTE_PEER_PROFILE_CACHE_NAMESPACE);

    return peer;
  }

  async deletePeer(id: string) {
    await this.prisma.peer.delete({
      where: {
        id,
      },
    });
    await this.kv.resetNamespace(REMOTE_PEER_PROFILE_CACHE_NAMESPACE);

    return id;
  }
}
