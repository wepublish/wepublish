import { Injectable } from '@nestjs/common';
import { Banner, LoginStatus, Page, PrismaClient } from '@prisma/client';
import {
  BannerDocumentType,
  CreateBannerInput,
  PrimaryBannerArgs,
  UpdateBannerInput,
} from './banner.model';
import { PaginationArgs } from './pagination.model';
import { findIndex, sortBy } from 'ramda';

@Injectable()
export class BannerService {
  constructor(private prisma: PrismaClient) {}

  async findOne(id: string) {
    return this.prisma.banner.findUnique({
      where: {
        id,
      },
    });
  }

  async findAll(args: PaginationArgs) {
    return this.prisma.banner.findMany({
      skip: args.skip,
      take: args.take,
    });
  }

  async findFirst(args: PrimaryBannerArgs) {
    let showForLoginStatus = [] as Array<{ showForLoginStatus: LoginStatus }>;

    if (args.hasSubscription === false && args.loggedIn === false) {
      showForLoginStatus = [
        { showForLoginStatus: LoginStatus.LOGGED_OUT },
        { showForLoginStatus: LoginStatus.UNSUBSCRIBED },
      ];
    }

    if (args.hasSubscription === false && args.loggedIn === true) {
      showForLoginStatus = [
        { showForLoginStatus: LoginStatus.UNSUBSCRIBED },
        { showForLoginStatus: LoginStatus.LOGGED_IN },
      ];
    }

    if (args.hasSubscription === true && args.loggedIn === true) {
      showForLoginStatus = [
        { showForLoginStatus: LoginStatus.SUBSCRIBED },
        { showForLoginStatus: LoginStatus.LOGGED_IN },
      ];
    }

    showForLoginStatus = [
      ...showForLoginStatus,
      { showForLoginStatus: LoginStatus.ALL },
    ];

    let banners: Banner[] = [];

    if (args.documentType === BannerDocumentType.ARTICLE) {
      banners = await this.prisma.banner.findMany({
        where: {
          active: true,
          showOnArticles: true,
          OR: showForLoginStatus,
        },
      });
    } else if (args.documentType === BannerDocumentType.PAGE) {
      banners = await this.prisma.banner.findMany({
        where: {
          active: true,
          showOnPages: {
            some: {
              id: args.documentId,
            },
          },
          OR: showForLoginStatus,
        },
      });
    }

    const sortBannerByFittingLoginStatus = sortBy<Banner>(banner => {
      const index = findIndex<(typeof showForLoginStatus)[0]>(
        ls => ls.showForLoginStatus === banner.showForLoginStatus
      )(showForLoginStatus);

      if (index === -1) {
        // not found, so put it at the end
        return showForLoginStatus.length;
      }

      return index;
    });

    return sortBannerByFittingLoginStatus(banners).at(0);
  }

  async findPages(id: string): Promise<Page[]> {
    const banner = await this.prisma.banner.findUnique({
      where: {
        id,
      },
      select: {
        showOnPages: true,
      },
    });

    if (!banner) {
      return [];
    }

    return banner.showOnPages;
  }

  async create(args: CreateBannerInput) {
    const { actions, showOnPages, ...bannerInputs } = args;
    return this.prisma.banner.create({
      data: {
        ...bannerInputs,
        actions: {
          create: actions,
        },
        showOnPages: {
          connect: showOnPages?.map(page => ({ id: page.id })),
        },
      },
    });
  }

  async update(args: UpdateBannerInput) {
    const { id, actions, showOnPages, imageId, ...bannerInputs } = args;

    return this.prisma.banner.update({
      where: {
        id,
      },
      data: {
        ...bannerInputs,
        imageId: imageId ?? null,
        actions: {
          deleteMany: {},
          create: actions,
        },
        showOnPages: {
          set: [],
          connect: showOnPages?.map(page => ({ id: page.id })),
        },
      },
    });
  }

  async delete(id: string): Promise<undefined> {
    await this.prisma.banner.delete({
      where: {
        id,
      },
    });
  }
}
