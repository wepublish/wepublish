import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PeerDataloaderService } from './peer-dataloader.service';
import { PrismaClient } from '@prisma/client';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { CreatePeerInput, UpdatePeerInput } from './peer.model';

@Injectable()
export class PeerService {
  constructor(
    private peerDataloaderService: PeerDataloaderService,
    private prisma: PrismaClient
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
        information: information as any[],
      },
    });
  }

  @PrimeDataLoader(PeerDataloaderService)
  async updatePeer({ id, information, ...input }: UpdatePeerInput) {
    return this.prisma.peer.update({
      where: {
        id,
      },
      data: {
        ...input,
        information: information as any[],
      },
    });
  }

  async deletePeer(id: string) {
    return this.prisma.peer.delete({
      where: {
        id,
      },
    });
  }
}
