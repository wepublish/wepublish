import {Injectable} from '@nestjs/common'
import {CreateNavigationInput, UpdateNavigationInput} from './navigation.model'
import {PrismaClient} from '@prisma/client'
import {NavigationDataloader} from './navigation.dataloader'
import {PrimeDataLoader} from '@wepublish/utils/api'

@Injectable()
export class NavigationService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(NavigationDataloader)
  async getNavigationById(id: string) {
    return this.prisma.navigation.findUnique({
      where: {id},
      include: {links: true}
    })
  }

  @PrimeDataLoader(NavigationDataloader)
  async getNavigationByKey(key: string) {
    return this.prisma.navigation.findUnique({
      where: {key},
      include: {links: true}
    })
  }

  @PrimeDataLoader(NavigationDataloader)
  async getNavigations() {
    return this.prisma.navigation.findMany({
      orderBy: {createdAt: 'desc'},
      include: {links: true}
    })
  }

  @PrimeDataLoader(NavigationDataloader)
  async createNavigation(input: CreateNavigationInput) {
    const {links, ...data} = input

    return this.prisma.navigation.create({
      data: {
        ...data,
        links: {
          createMany: {data: links}
        }
      },
      include: {links: true}
    })
  }

  async deleteNavigationById(id: string) {
    return this.prisma.navigation.delete({
      where: {id},
      include: {links: true}
    })
  }

  @PrimeDataLoader(NavigationDataloader)
  async updateNavigation(input: UpdateNavigationInput) {
    const {id, links, ...data} = input
    await this.prisma.navigationLink.deleteMany({
      where: {navigationId: id}
    })
    return this.prisma.navigation.update({
      where: {id},
      data: {
        ...data,
        links: {
          createMany: {data: links}
        }
      },
      include: {links: true}
    })
  }
}
