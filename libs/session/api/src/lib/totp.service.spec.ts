import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import {
  DistributedClaims,
  DistributedCounters,
  type DragonflyConnection,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import * as OTPAuth from 'otpauth';
import { TotpService } from './totp.service';

const sharedDragonfly = () => new FakeDragonfly();

const noDragonfly = () => new MemoryDragonflyConnection();

const unreachableDragonfly = () => {
  const dragonfly = new FakeDragonfly();
  dragonfly.down();

  return dragonfly;
};

const sentKeys = (dragonfly: FakeDragonfly, prefix: string) =>
  dragonfly.commands
    .filter(([command, key]) => command === 'SET' && key.startsWith(prefix))
    .map(([, key]) => key);

describe('TotpService across replicas', () => {
  const originalKey = process.env['APP_SECRET_KEY'];
  const secret = new OTPAuth.Secret().base32;
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  let wrong = 0;
  const wrongCode = () => {
    const now = Date.now();
    const valid = [-30_000, 0, 30_000].map(offset =>
      totp.generate({ timestamp: now + offset })
    );
    let code: string;

    do {
      code = String(100_000 + wrong++);
    } while (valid.includes(code));

    return code;
  };

  beforeAll(() => {
    process.env['APP_SECRET_KEY'] = 'totp-spec-secret';
  });

  afterAll(() => {
    process.env['APP_SECRET_KEY'] = originalKey;
  });

  const replicas = (dragonfly: DragonflyConnection) => {
    const prisma = {
      user: { findUnique: vi.fn(), update: vi.fn() },
    };
    const sessionCache = {
      invalidate: vi.fn(),
    } satisfies Pick<SessionCacheInvalidator, 'invalidate'>;
    const create = () =>
      new TotpService(
        prisma as unknown as PrismaClient,
        sessionCache as unknown as SessionCacheInvalidator,
        new DistributedClaims(dragonfly),
        new DistributedCounters(dragonfly)
      );
    const a = create();
    const b = create();
    prisma.user.findUnique.mockResolvedValue({
      totpSecret: (a as any).encrypt(secret),
      totpEnabled: true,
    });

    return { a, b };
  };

  describe('at the end of a time step', () => {
    const stepEnd = Math.ceil(Date.now() / 30_000) * 30_000 + 30_000;

    beforeEach(() => {
      vi.useFakeTimers({ now: stepEnd - 1 });
      const validate = OTPAuth.TOTP.prototype.validate;
      vi.spyOn(OTPAuth.TOTP.prototype, 'validate').mockImplementation(function (
        this: OTPAuth.TOTP,
        options
      ) {
        const delta = validate.call(this, options);
        vi.setSystemTime(Date.now() + 2);

        return delta;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('refuses the same code again, even when the next time step started while checking it', async () => {
      const { a, b } = replicas(sharedDragonfly());
      const code = totp.generate({ timestamp: stepEnd - 1 });

      await expect(a.verifyUserTotp('user-1', code)).resolves.toBe(true);
      await expect(b.verifyUserTotp('user-1', code)).rejects.toThrow(
        'already been used'
      );
    });
  });

  it('forgets failed codes on a replica without Dragonfly after fifteen minutes without one', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-02T10:00:00.000Z') });
    const { a } = replicas(noDragonfly());

    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        await expect(a.verifyUserTotp('user-1', wrongCode())).rejects.toThrow(
          'Invalid verification code'
        );
      }

      vi.setSystemTime(new Date('2026-10-02T10:16:00.000Z'));

      await expect(a.verifyUserTotp('user-1', wrongCode())).rejects.toThrow(
        'Invalid verification code'
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('refuses a code that was already used on another replica', async () => {
    const { a, b } = replicas(sharedDragonfly());
    const code = totp.generate();

    await expect(a.verifyUserTotp('user-1', code)).resolves.toBe(true);
    await expect(b.verifyUserTotp('user-1', code)).rejects.toThrow(
      'already been used'
    );
  });

  it('locks the account after five failed codes spread over replicas', async () => {
    const { a, b } = replicas(sharedDragonfly());

    for (const replica of [a, a, a, b, b]) {
      await expect(
        replica.verifyUserTotp('user-1', wrongCode())
      ).rejects.toThrow('Invalid verification code');
    }

    await expect(a.verifyUserTotp('user-1', totp.generate())).rejects.toThrow(
      'Too many failed attempts'
    );
  });

  it.each([
    ['across replicas', sharedDragonfly],
    ['on one replica without Dragonfly', noDragonfly],
    ['on one replica while Dragonfly is unreachable', unreachableDragonfly],
  ])(
    'refuses guesses sent in parallel once five are used up %s',
    async (_, dragonfly) => {
      const { a } = replicas(dragonfly());
      const codes = Array.from({ length: 8 }, () => wrongCode());

      const results = await Promise.allSettled(
        codes.map(code => a.verifyUserTotp('user-1', code))
      );

      expect(
        results.filter(
          result =>
            result.status === 'rejected' &&
            /Too many failed attempts/.test(String(result.reason))
        )
      ).toHaveLength(3);
    }
  );

  it('starts counting again after a correct code', async () => {
    const { a, b } = replicas(sharedDragonfly());

    for (const replica of [a, b, a, b]) {
      await expect(
        replica.verifyUserTotp('user-1', wrongCode())
      ).rejects.toThrow('Invalid verification code');
    }

    await expect(a.verifyUserTotp('user-1', totp.generate())).resolves.toBe(
      true
    );
    await expect(b.verifyUserTotp('user-1', wrongCode())).rejects.toThrow(
      'Invalid verification code'
    );
  });

  it.each([
    ['without Dragonfly', noDragonfly],
    ['while Dragonfly is unreachable', unreachableDragonfly],
  ])(
    'still refuses a reused code on the same replica %s',
    async (_, dragonfly) => {
      const { a } = replicas(dragonfly());
      const code = totp.generate();

      await expect(a.verifyUserTotp('user-1', code)).resolves.toBe(true);
      await expect(a.verifyUserTotp('user-1', code)).rejects.toThrow(
        'already been used'
      );
    }
  );

  it('locks the account on one replica after five failed codes while Dragonfly is unreachable', async () => {
    const { a } = replicas(unreachableDragonfly());

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(a.verifyUserTotp('user-1', wrongCode())).rejects.toThrow(
        'Invalid verification code'
      );
    }

    await expect(a.verifyUserTotp('user-1', totp.generate())).rejects.toThrow(
      'Too many failed attempts'
    );
  });

  it('forgets the shared failure count after a correct code', async () => {
    const dragonfly = sharedDragonfly();
    const { a } = replicas(dragonfly);

    await a.verifyUserTotp('user-1', totp.generate());

    expect(dragonfly.commands).toContainEqual([
      'DEL',
      'count:totp-failures:user-1',
    ]);
  });

  it('remembers a used code by its time step, so Dragonfly keys carry no code material', async () => {
    const dragonfly = sharedDragonfly();
    const { a } = replicas(dragonfly);
    const step = Math.floor(Date.now() / 30_000);

    await a.verifyUserTotp('user-1', totp.generate());

    expect(sentKeys(dragonfly, 'lock:')).toEqual([
      expect.stringMatching(
        new RegExp(`^lock:totp-used:user-1:(${step - 1}|${step}|${step + 1})$`)
      ),
    ]);
  });

  it('never sends the code itself to Dragonfly', async () => {
    const dragonfly = sharedDragonfly();
    const { a } = replicas(dragonfly);
    const code = totp.generate();

    await a.verifyUserTotp('user-1', code);

    expect(
      JSON.stringify(dragonfly.commands.map(([, key]) => key))
    ).not.toContain(code);
  });
});
