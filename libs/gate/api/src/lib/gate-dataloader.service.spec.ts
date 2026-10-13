import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { Test } from '@nestjs/testing';
import { GateDataloaderService } from './gate-dataloader.service';

describe('GateDataloaderService', () => {
  let kv: KvTtlCacheService;
  const prisma = { gate: { findMany: vi.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
    prisma.gate.findMany.mockReset().mockResolvedValue([
      { id: 'gate-2', actions: [] },
      { id: 'gate-1', actions: [] },
    ]);
  });

  it('loads gates with their actions in one query, in the order asked for', async () => {
    const loader = new GateDataloaderService(prisma as any, kv);

    expect(await loader.loadMany(['gate-1', 'gate-2', 'gate-3'])).toEqual([
      { id: 'gate-1', actions: [] },
      { id: 'gate-2', actions: [] },
      null,
    ]);
    expect(prisma.gate.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.gate.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['gate-1', 'gate-2', 'gate-3'] } },
      include: { actions: true },
    });
  });

  it('can be primed', async () => {
    const loader = new GateDataloaderService(prisma as any, kv);
    loader.prime('gate-9', { id: 'gate-9' } as any);

    expect(await loader.load('gate-9')).toEqual({ id: 'gate-9' });
    expect(prisma.gate.findMany).not.toHaveBeenCalled();
  });
});
