import {Injectable} from '@nestjs/common'
import {LoginStatus, Page, PrismaClient} from '@prisma/client'
import {
  BannerDocumentType,
  CreateBannerInput,
  PrimaryBannerArgs,
  UpdateBannerInput
} from './banner.model'
import {PaginationArgs} from './pagination.model'

@Injectable()
export class BannerService {
  constructor(private prisma: PrismaClient) {}

  async findOne(id: string) {
    return this.prisma.banner.findUnique({
      where: {
        id
      }
    })
  }

  async findAll(args: PaginationArgs) {
    return this.prisma.banner.findMany({
      skip: args.skip,
      take: args.take
    })
  }

  async findFirst(args: PrimaryBannerArgs) {
    if (args.documentType === BannerDocumentType.ARTICLE) {
      return this.prisma.banner.findFirst({
        where: {
          active: true,
          showOnArticles: true,
          OR: [
            {showForLoginStatus: LoginStatus.ALL},
            {showForLoginStatus: args.loggedIn ? LoginStatus.LOGGED_IN : LoginStatus.LOGGED_OUT}
          ]
        }
      })
    } else if (args.documentType === BannerDocumentType.PAGE) {
      return this.prisma.banner.findFirst({
        where: {
          active: true,
          showOnPages: {
            some: {
              id: args.documentId
            }
          },
          OR: [
            {showForLoginStatus: LoginStatus.ALL},
            {showForLoginStatus: args.loggedIn ? LoginStatus.LOGGED_IN : LoginStatus.LOGGED_OUT}
          ]
        }
      })
    } else {
      return null
    }
  }

  async findPages(id: string): Promise<Page[]> {
    const banner = await this.prisma.banner.findUnique({
      where: {
        id
      },
      select: {
        showOnPages: true
      }
    })

    if (!banner) {
      return []
    }

    return banner.showOnPages
  }

  async create(args: CreateBannerInput) {
    const {actions, showOnPages, ...bannerInputs} = args
    return this.prisma.banner.create({
      data: {
        ...bannerInputs,
        actions: {
          create: actions
        },
        showOnPages: {
          connect: showOnPages?.map(page => ({id: page.id}))
        }
      }
    })
  }

  async update(args: UpdateBannerInput) {
    const {id, actions, showOnPages, imageId, ...bannerInputs} = args

    return this.prisma.banner.update({
      where: {
        id
      },
      data: {
        ...bannerInputs,
        imageId: imageId ?? null,
        actions: {
          deleteMany: {},
          create: actions
        },
        showOnPages: {
          set: [],
          connect: showOnPages?.map(page => ({id: page.id}))
        }
      }
    })
  }

  async delete(id: string): Promise<undefined> {
    await this.prisma.banner.delete({
      where: {
        id
      }
    })
  }
}
