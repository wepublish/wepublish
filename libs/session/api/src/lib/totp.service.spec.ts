import * as OTPAuth from 'otpauth';
import { TotpService } from './totp.service';

const sharedDragonfly = () => {
  const locks = new Set<string>();
  const counts = new Map<string, number>();

  return {
    claim: vi.fn(async (name: string) => {
      if (locks.has(name)) {
        return false;
      }

      locks.add(name);

      return true;
    }),
    increment: vi.fn(async (name: string) => {
      const count = (counts.get(name) ?? 0) + 1;
      counts.set(name, count);

      return count;
    }),
    count: vi.fn(async (name: string) => counts.get(name) ?? 0),
    forgetCount: vi.fn(async (name: string) => {
      counts.delete(name);
    }),
  };
};

const noDragonfly = () => ({
  claim: vi.fn(async () => undefined),
  increment: vi.fn(async () => undefined),
  count: vi.fn(async () => undefined),
  forgetCount: vi.fn(async () => undefined),
});

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

  const replicas = (kv: object) => {
    const prisma = {
      user: { findUnique: vi.fn(), update: vi.fn() },
    };
    const create = () =>
      new TotpService(prisma as any, { invalidate: vi.fn() } as any, kv as any);
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
  ])(
    'refuses guesses sent in parallel once five are used up %s',
    async (_, kv) => {
      const { a } = replicas(kv());
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

  it('still refuses a reused code on the same replica without Dragonfly', async () => {
    const { a } = replicas(noDragonfly());
    const code = totp.generate();

    await expect(a.verifyUserTotp('user-1', code)).resolves.toBe(true);
    await expect(a.verifyUserTotp('user-1', code)).rejects.toThrow(
      'already been used'
    );
  });

  it('remembers a used code by its time step, so Dragonfly keys carry no code material', async () => {
    const kv = sharedDragonfly();
    const { a } = replicas(kv);
    const step = Math.floor(Date.now() / 30_000);

    await a.verifyUserTotp('user-1', totp.generate());

    expect(kv.claim.mock.calls.map(([name]) => name)).toEqual([
      expect.stringMatching(
        new RegExp(`^totp-used:user-1:(${step - 1}|${step}|${step + 1})$`)
      ),
    ]);
  });

  it('never sends the code itself to Dragonfly', async () => {
    const kv = sharedDragonfly();
    const { a } = replicas(kv);
    const code = totp.generate();

    await a.verifyUserTotp('user-1', code);

    expect(JSON.stringify(kv.claim.mock.calls)).not.toContain(code);
  });
});
