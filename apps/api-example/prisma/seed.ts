/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {PrismaClient} from '@prisma/client'
import {seed as rootSeed} from '../../../libs/api/prisma/seed'
import {hashPassword} from '../../../libs/api/src/lib/db/user'

async function seed() {
  const prisma = new PrismaClient()
  await prisma.$connect()

  const [adminUserRole, editorUserRole] = await rootSeed(prisma)

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done')
  }

  await prisma.user.upsert({
    where: {
      email: 'dev@wepublish.ch'
    },
    update: {},
    create: {
      email: 'dev@wepublish.ch',
      emailVerifiedAt: new Date(),
      name: 'Dev User',
      active: true,
      roleIDs: [adminUserRole.id],
      password: await hashPassword('123')
    }
  })

  await prisma.user.upsert({
    where: {
      email: 'editor@wepublish.ch'
    },
    update: {},
    create: {
      email: 'editor@wepublish.ch',
      emailVerifiedAt: new Date(),
      name: 'Editor User',
      active: true,
      roleIDs: [editorUserRole.id],
      password: await hashPassword('123')
    }
  })

  await prisma.mailTemplate.upsert({
    where: {
      externalMailTemplateId: 'sample-slug-1'
    },
    update: {},
    create: {
      name: 'sample-template-existing',
      description: 'sample-template-description',
      externalMailTemplateId: 'sample-slug-1'
    }
  })

  await prisma.mailTemplate.upsert({
    where: {
      externalMailTemplateId: 'sample-slug-2'
    },
    update: {},
    create: {
      name: 'sample-template-deleted',
      description: 'sample-template-description',
      externalMailTemplateId: 'sample-slug-2',
      remoteMissing: true
    }
  })

  await prisma.$disconnect()
}

seed()
