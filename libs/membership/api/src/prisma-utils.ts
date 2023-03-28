import {PrismaClient} from '@prisma/client'

export const clearDatabase = async (prismaService: PrismaClient, tables_left: string[]) => {
  while (tables_left.length > 0) {
    const tables = tables_left
    for (const table of tables) {
      try {
        await prismaService.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
        const index = tables_left.indexOf(table)
        if (index !== -1) {
          tables_left.splice(index, 1)
        }
      } catch (e) {
        1 + 2
      }
    }
  }
}
