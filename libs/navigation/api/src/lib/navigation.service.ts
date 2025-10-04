import { Injectable } from '@nestjs/common';
import {
  CreateNavigationInput,
  UpdateNavigationInput,
} from './navigation.model';
import { PrismaClient } from '@prisma/client';
import { NavigationDataloaderService } from './navigation-dataloader.service';
import { PrimeDataLoader } from '@wepublish/utils/api';

@Injectable()
export class NavigationService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(NavigationDataloaderService)
  async getNavigations() {
    return this.prisma.navigation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @PrimeDataLoader(NavigationDataloaderService)
  async createNavigation(input: CreateNavigationInput) {
    const { links, ...data } = input;

    return this.prisma.navigation.create({
      data: {
        ...data,
        links: {
          createMany: { data: links },
        },
      },
    });
  }

  async deleteNavigationById(id: string) {
    return this.prisma.navigation.delete({
      where: { id },
    });
  }

  @PrimeDataLoader(NavigationDataloaderService)
  async updateNavigation(input: UpdateNavigationInput) {
    const { id, links, ...data } = input;

    await this.prisma.navigationLink.deleteMany({
      where: { navigationId: id },
    });

    return this.prisma.navigation.update({
      where: { id },
      data: {
        ...data,
        links: {
          createMany: { data: links },
        },
      },
    });
  }

  async getNavigationLinks(id: string) {
    return this.prisma.navigationLink.findMany({
      where: {
        navigationId: id,
      },
    });
  }
}
