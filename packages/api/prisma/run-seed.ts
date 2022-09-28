import {PrismaClient} from '@prisma/client'
import {seed as rootSeed} from './seed'
import {hashPassword} from '../src'

const seedUsers = async (prisma: PrismaClient) => [
  prisma.user.upsert({
    where: {
      id: 'admin'
    },
    update: {},
    create: {
      id: 'admin',
      email: 'admin@wepublish.ch',
      emailVerifiedAt: new Date(),
      name: 'Admin',
      active: true,
      roleIDs: ['admin'],
      password: await hashPassword('123')
    }
  })
]

export async function runSeed() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  await rootSeed(prisma)
  await seedUsers(prisma)
  await prisma.$disconnect()
}
runSeed()
