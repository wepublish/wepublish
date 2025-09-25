import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PeerDataloaderService } from './peer-dataloader.service';
import { PrismaClient } from '@prisma/client';
import { PrimeDataLoader } from '@wepublish/utils/api';

@Injectable()
export class PeerService {
  constructor(
    private peerDataloaderService: PeerDataloaderService,
    private prisma: PrismaClient
  ) {}

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
}
