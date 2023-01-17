import {PrismaClient} from '@prisma/client'
import {seed as rootSeed} from './seed'
import {hashPassword} from '../src/lib/db/user'

export async function runSeed() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  const [adminUserRole, editorUserRole] = await rootSeed(prisma)

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done')
  }

  console.log('Adding admin user')
  await prisma.user.upsert({
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
  .then(() => {
    console.log('Seeding applied successfully')
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
