import {PrismaClient} from '@prisma/client'

export async function seed(prisma: PrismaClient) {
  return prisma.$transaction([
    prisma.userRole.upsert({
      where: {
        id: 'admin'
      },
      update: {},
      create: {
        id: 'admin',
        systemRole: true,
        name: 'Admin',
        description: 'Administrator Role',
        permissionIDs: []
      }
    }),
    prisma.userRole.upsert({
      where: {
        id: 'editor'
      },
      update: {},
      create: {
        id: 'editor',
        systemRole: true,
        name: 'Editor',
        description: 'Editor Role',
        permissionIDs: []
      }
    }),
    prisma.userRole.upsert({
      where: {
        id: 'peer'
      },
      update: {},
      create: {
        id: 'peer',
        systemRole: true,
        name: 'Peer',
        description: 'Peer Role',
        permissionIDs: []
      }
    })
  ])
}
