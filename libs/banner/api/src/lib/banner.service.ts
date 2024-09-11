import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {Banner, BannerArgs, NewBannerInput, UpdateBannerInput} from './banner.model'

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

  async findAll(args: BannerArgs): Promise<Banner[]> {
    return this.prisma.banner.findMany({
      skip: args.skip,
      take: args.take
    })
  }

  async create(input: NewBannerInput): Promise<Banner> {
    return this.prisma.banner.create({
      data: input
    })
  }

  async update(params: UpdateBannerInput): Promise<Banner> {
    const {id, ...params_without_id} = params

    return this.prisma.banner.update({
      where: {
        id
      },
      data: {
        ...params_without_id
      }
    })
  }

  async delete(id: string): Promise<Banner> {
    return this.prisma.banner.delete({
      where: {
        id
      }
    })
  }
}
