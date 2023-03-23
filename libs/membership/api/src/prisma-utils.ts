import {PrismaClient} from '@prisma/client'

export const clearDatabase = async (prismaService: PrismaClient, tables: string[]) => {
  for (const table of tables) {
    try {
      await prismaService.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
    } catch (e) {
      1 + 2
    }
  }
}
