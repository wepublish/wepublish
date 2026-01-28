import { Prisma, PrismaClient } from '@prisma/client';

export const clearDatabase = async (
  prismaService: PrismaClient,
  tables_left: string[]
) => {
  while (tables_left.length > 0) {
    const tables = tables_left;
    for (const table of tables) {
      try {
        await prismaService.$executeRawUnsafe(
          `TRUNCATE TABLE "${table}" CASCADE;`
        );
        const index = tables_left.indexOf(table);
        if (index !== -1) {
          tables_left.splice(index, 1);
        }
      } catch (e) {
        //
      }
    }
  }
};

interface Table {
  table_name: string;
}
export const clearFullDatabase = async (prismaService: PrismaClient) => {
  const tables = await prismaService.$queryRaw<Table[]>(
    Prisma.sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  const t: string[] = [];
  for (const table of tables) {
    t.push(table.table_name);
  }
  await clearDatabase(prismaService, t);
};
