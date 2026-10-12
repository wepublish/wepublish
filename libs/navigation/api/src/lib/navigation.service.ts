import { Injectable } from '@nestjs/common';
import {
  CreateNavigationInput,
  UpdateNavigationInput,
} from './navigation.model';
import { PrismaClient } from '@prisma/client';
import { NavigationDataloaderService } from './navigation-dataloader.service';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  NAVIGATION_CACHE_NAMESPACE,
  NAVIGATION_CACHE_TTL_SECONDS,
} from './navigation-cache';

@Injectable()
export class NavigationService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  @PrimeDataLoader(NavigationDataloaderService)
  async getNavigations() {
    return this.kv.getOrLoadNs(
      NAVIGATION_CACHE_NAMESPACE,
      'all',
      () =>
        this.prisma.navigation.findMany({
          orderBy: { createdAt: 'desc' },
        }),
      NAVIGATION_CACHE_TTL_SECONDS
    );
  }

  @PrimeDataLoader(NavigationDataloaderService)
  async createNavigation(input: CreateNavigationInput) {
    const { links, ...data } = input;

    const navigation = await this.prisma.navigation.create({
      data: {
        ...data,
        links: {
          createMany: { data: links },
        },
      },
    });
    await this.kv.resetNamespace(NAVIGATION_CACHE_NAMESPACE);

    return navigation;
  }

  async deleteNavigationById(id: string) {
    const navigation = await this.prisma.navigation.delete({
      where: { id },
    });
    await this.kv.resetNamespace(NAVIGATION_CACHE_NAMESPACE);

    return navigation;
  }

  @PrimeDataLoader(NavigationDataloaderService)
  async updateNavigation(input: UpdateNavigationInput) {
    const { id, links, ...data } = input;

    await this.prisma.navigationLink.deleteMany({
      where: { navigationId: id },
    });

    const navigation = await this.prisma.navigation.update({
      where: { id },
      data: {
        ...data,
        links: {
          createMany: { data: links },
        },
      },
    });
    await this.kv.resetNamespace(NAVIGATION_CACHE_NAMESPACE);

    return navigation;
  }

  async getNavigationLinks(id: string) {
    return this.prisma.navigationLink.findMany({
      where: {
        navigationId: id,
      },
    });
  }
}
