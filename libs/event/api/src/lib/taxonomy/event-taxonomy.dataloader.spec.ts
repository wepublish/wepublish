import { PrismaClient } from '@prisma/client';
import {
  AudienceDataloader,
  RegionDataloader,
} from './event-taxonomy.dataloader';

describe('RegionDataloader', () => {
  it('loads regions by id, disabled ones included, in key order', async () => {
    const prisma = {
      region: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'r-2', enabled: false },
          { id: 'r-1', enabled: true },
        ]),
      },
    };
    const loader = new RegionDataloader(prisma as unknown as PrismaClient);

    await expect(loader.loadMany(['r-1', 'r-2', 'r-3'])).resolves.toEqual([
      { id: 'r-1', enabled: true },
      { id: 'r-2', enabled: false },
      null,
    ]);
    expect(prisma.region.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['r-1', 'r-2', 'r-3'] } },
    });
  });
});

describe('AudienceDataloader', () => {
  it('loads audiences by id', async () => {
    const prisma = {
      audience: { findMany: vi.fn().mockResolvedValue([{ id: 'a-1' }]) },
    };
    const loader = new AudienceDataloader(prisma as unknown as PrismaClient);

    await expect(loader.load('a-1')).resolves.toEqual({ id: 'a-1' });
  });
});
