import {Injectable} from '@nestjs/common'
import {CreateNavigationInput, UpdateNavigationArgs} from './navigation.model'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class NavigationService {
  constructor(private prisma: PrismaClient) {}

  async getNavigationById(id: string) {
    return this.prisma.navigation.findUnique({
      where: {id},
      include: {links: true}
    })
  }

  async getNavigationByKey(key: string) {
    return this.prisma.navigation.findUnique({
      where: {key},
      include: {links: true}
    })
  }

  async getNavigations() {
    return this.prisma.navigation.findMany({
      orderBy: {createdAt: 'desc'},
      include: {links: true}
    })
  }

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

  async updateNavigation(input: UpdateNavigationArgs) {
    const {id, links, ...data} = input
    await this.prisma.navigationLink.deleteMany({
      where: {navigationId: id}
    })
    return this.prisma.navigation.update({
      where: {id},
      data: {
        ...data,
        links: {
          createMany: {data: links ?? []}
        }
      },
      include: {links: true}
    })
  }
}
