import {PrismaClient} from '@prisma/client'
import {seed as rootSeed} from './seed'
import {hashPassword} from '../src'

export async function runSeed() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  const [adminUserRole, editorUserRole] = await rootSeed(prisma)

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done')
  }

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
      roleIDs: [adminUserRole.id],
      password: await hashPassword('123')
    }
  })

  await prisma.$disconnect()
}
runSeed()
