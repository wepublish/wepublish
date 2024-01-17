import {PrismaClient} from '@prisma/client'
import {seed as rootSeed} from './seed'
import {hashPassword, generateSecureRandomPassword} from '../src/lib/db/user'

export async function runSeed() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  const [adminUserRole, editorUserRole] = await rootSeed(prisma)

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done')
  }

  const randomPassword = generateSecureRandomPassword(20)
  const email = 'admin@wepublish.ch'

  const admin = await prisma.user.findUnique({
    where: {
      id: 'admin'
    }
  })
  if (!admin) {
    console.log(`Bootstrapping initial admin user ${email} with password: ${randomPassword}`)
    await prisma.user.upsert({
      where: {
        id: 'admin'
      },
      update: {},
      create: {
        id: 'admin',
        email,
        emailVerifiedAt: new Date(),
        name: 'Admin',
        active: true,
        roleIDs: [adminUserRole.id],
        password: await hashPassword(randomPassword)
      }
    })
  } else {
    console.log('Skipping bootstrapping of initial admin user because the user already exist...')
  }

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
