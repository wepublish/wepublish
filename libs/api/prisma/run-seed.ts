import {PrismaClient} from '@prisma/client'
import {seed as rootSeed} from './seed'
import bcrypt from 'bcrypt'
import {randomBytes} from 'crypto'

const generateSecureRandomPassword = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-'
  let password = ''
  const characterCount = characters.length
  const maxValidValue = 256 - (256 % characterCount)

  while (password.length < length) {
    const randomValue = randomBytes(1)[0]
    if (randomValue < maxValidValue) {
      const index = randomValue % characterCount
      password += characters.charAt(index)
    }
  }
  return password
}
export async function runSeed() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  const [adminUserRole, editorUserRole] = await rootSeed(prisma)

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done')
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: 'admin'
    }
  })
  if (!admin) {
    const email = 'admin@wepublish.ch'
    const overriddenPw = process.env.OVERRIDE_ADMIN_PW
    let password = generateSecureRandomPassword(20)
    if (overriddenPw) {
      console.log(
        '\x1b[31m\x1b[1m%s\x1b[0m',
        `!!!!!!!!!!!!!!!!!! WARNING: UNSECURE PASSWORD IS OVERRIDDEN WITH ENV VARIABLE !!!!!!!!!!!!!!!!!! `
      )
      password = overriddenPw
    }

    console.log(
      '\x1b[31m\x1b[1m%s\x1b[0m',
      `Bootstrapping initial admin user ${email} with password: ${password}`
    )
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
        password: await bcrypt.hash(password, 11)
      }
    })
  } else {
    console.log(
      '\x1b[32m\x1b[1m%s\x1b[0m',
      'Skipping bootstrapping of initial admin user because the user already exist...'
    )
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
