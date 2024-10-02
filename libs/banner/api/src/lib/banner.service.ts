import {Injectable} from '@nestjs/common'
import {Page, PrismaClient} from '@prisma/client'
import {Banner, CreateBannerInput, UpdateBannerInput} from './banner.model'
import {PaginationArgs} from './pagination.model'

@Injectable()
export class BannerService {
  constructor(private prisma: PrismaClient) {}

  async findOne(id: string): Promise<Banner | null> {
    return this.prisma.banner.findUnique({
      where: {
        id
      }
    })
  }

  async findAll(args: PaginationArgs): Promise<Banner[]> {
    return this.prisma.banner.findMany({
      skip: args.skip,
      take: args.take
    })
  }

  async findFirst(): Promise<Banner | null> {
    return this.prisma.banner.findFirst()
  }

  async findPages(id: string): Promise<Page[]> {
    const banner = await this.prisma.banner.findUnique({
      where: {
        id: id
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

  async create(args: CreateBannerInput): Promise<Banner> {
    const {actions, showOnPages, ...bannerInputs} = args
    return this.prisma.banner.create({
      data: {
        ...bannerInputs,
        actions: {
          create: actions
        },
        showOnPages: {
          create: showOnPages
        }
      }
    })
  }

  async update(args: UpdateBannerInput): Promise<Banner> {
    const {id, actions, showOnPages, ...args_without_id} = args

    return this.prisma.banner.update({
      where: {
        id
      },
      data: {
        ...args_without_id,
        actions: {
          deleteMany: {},
          create: actions
        },
        showOnPages: {
          deleteMany: {},
          create: showOnPages
        }
      }
    })
  }

  async delete(id: string): Promise<undefined> {
    this.prisma.banner.delete({
      where: {
        id
      }
    })
  }
}
