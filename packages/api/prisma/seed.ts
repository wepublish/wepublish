import {PrismaClient} from '@prisma/client'
import {hashPassword} from '../../../packages/api/src/db/user'
import {seedBase as rootSeed} from '../../../packages/api/prisma/seed-base'

async function seed() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  await rootSeed(prisma)
}
seed()
