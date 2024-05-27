import {Injectable} from '@nestjs/common'
import {CreateUserRoleInput, GetUserRolesArgs, UpdateUserRoleInput} from './user-role.model'
import {getMaxTake} from '@wepublish/utils/api'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class UserRoleService {
  constructor(private prisma: PrismaClient) {}

  getUserRoleById(id: string) {
    return this.prisma.userRole.findUnique({
      where: {
        id
      }
    })
  }

  async getUserRoles({filter: where, ...pagination}: GetUserRolesArgs) {
    const {skip, take, cursorId} = pagination
    const [totalCount, userroles] = await Promise.all([
      this.prisma.userRole.count({
        where
      }),
      this.prisma.userRole.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy: {
          name: 'asc'
        },
        cursor: cursorId ? {id: cursorId} : undefined
      })
    ])

    const nodes = userroles.slice(0, take)
    const firstUserRole = nodes[0]
    const lastUserRole = nodes[nodes.length - 1]

    const hasPreviousPage = Boolean(skip)
    const hasNextPage = userroles.length > nodes.length

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstUserRole?.id,
        endCursor: lastUserRole?.id
      }
    }
  }

  createUserRole(data: CreateUserRoleInput) {
    return this.prisma.userRole.create({
      data: {...data, systemRole: false}
    })
  }

  async updateUserRole({id, ...data}: UpdateUserRoleInput) {
    const role = await this.prisma.userRole.findUnique({where: {id}})
    if (role?.systemRole) {
      throw new Error('Cannot change SystemRoles')
    }
    return this.prisma.userRole.update({
      where: {id},
      data
    })
  }

  async deleteUserRoleById(id: string) {
    const role = await this.prisma.userRole.findUnique({where: {id}})
    if (role?.systemRole) {
      throw new Error('Cannot delete SystemRoles')
    }
    return this.prisma.userRole.delete({where: {id}})
  }
}
