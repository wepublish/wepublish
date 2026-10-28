import { PrismaService } from '@wepublish/nest-modules';

const resultFor = (method: string) => {
  if (method === 'findMany' || method === 'groupBy') {
    return [];
  }

  if (method === 'count') {
    return 0;
  }

  return null;
};

export const createPrismaStub = (): PrismaService => {
  const models = new Map<string, unknown>();
  const prisma: object = new Proxy(
    {},
    {
      get: (_target, property) => {
        if (typeof property !== 'string' || property === 'then') {
          return undefined;
        }

        if (property === '$transaction') {
          return async (work: unknown) =>
            typeof work === 'function' ?
              work(prisma)
            : Promise.all(work as Promise<unknown>[]);
        }

        if (property.startsWith('$')) {
          return async () => [];
        }

        if (!models.has(property)) {
          models.set(
            property,
            new Proxy(
              {},
              {
                get: (_model, method) =>
                  typeof method === 'string' && method !== 'then' ?
                    async () => resultFor(method)
                  : undefined,
              }
            )
          );
        }

        return models.get(property);
      },
    }
  );

  return prisma as PrismaService;
};
