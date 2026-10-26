import { Test } from '@nestjs/testing';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { MeterService } from './meter.service';
import { METER_SECRET, deriveMeterSecret, signMeter } from './meter-token';
import { ReaderContext } from './reader-context';
import { Meter } from './meter';

const secret = deriveMeterSecret('key');

const reader = (overrides: Partial<ReaderContext> = {}): ReaderContext => ({
  kind: 'anonymous',
  privileged: false,
  loggedIn: false,
  activeMemberPlanIds: [],
  paying: false,
  newsletter: 'unknown',
  ...overrides,
});

const anonymous = reader();
const user = reader({ kind: 'user', loggedIn: true, userId: 'user-1' });
const meter: Meter = { reads: [['a', 1]] };

describe('MeterService', () => {
  let service: MeterService;
  let kv: KvTtlCacheService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
      providers: [MeterService, { provide: METER_SECRET, useValue: secret }],
    }).compile();

    service = module.get(MeterService);
    kv = module.get(KvTtlCacheService);
  });

  it("reads an anonymous reader's meter from the token", async () => {
    expect(await service.load(anonymous, signMeter(meter, secret))).toEqual(
      meter
    );
  });

  it('counts a forged token as an empty meter', async () => {
    expect(
      await service.load(anonymous, signMeter(meter, deriveMeterSecret('x')))
    ).toEqual({ reads: [] });
  });

  it('hands an anonymous reader a signed token to keep', async () => {
    const token = await service.save(anonymous, meter, 30);

    expect(token).toBeTruthy();
    expect(await service.load(anonymous, token)).toEqual(meter);
  });

  it("keeps a logged-in reader's meter on the server, under a hash of their id", async () => {
    const setNs = vi.spyOn(kv, 'setNs');

    expect(await service.save(user, meter, 30)).toBeNull();
    expect(await service.load(user, undefined)).toEqual(meter);
    expect(setNs).toHaveBeenCalledWith(
      'engagement:meters',
      expect.not.stringContaining('user-1'),
      meter,
      30 * 24 * 60 * 60
    );
  });

  it('can not be reset by a logged-in reader dropping their token', async () => {
    await service.save(user, meter, 30);

    expect(await service.load(user, signMeter({ reads: [] }, secret))).toEqual(
      meter
    );
  });

  it('adds the reads of the anonymous token once the reader logs in', async () => {
    await service.save(user, meter, 30);

    expect(
      await service.load(user, signMeter({ reads: [['b', 2]] }, secret))
    ).toEqual({
      reads: [
        ['a', 1],
        ['b', 2],
      ],
    });
  });

  it('gives privileged readers no meter', async () => {
    expect(
      await service.load(
        reader({ kind: 'apiToken', privileged: true }),
        signMeter(meter, secret)
      )
    ).toEqual({ reads: [] });
  });
});
