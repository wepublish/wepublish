import { SecretCrypto, SettingName } from '@wepublish/settings/api';
import { addDays } from 'date-fns';
import { LoginCodeService } from './login-code.service';
import {
  InvalidLoginCodeError,
  LoginCodeDisabledError,
} from './login-code.errors';
import { deriveLoginCodeKey, hashLoginCode } from './login-code.util';

process.env['APP_SECRET_KEY'] = 'login-code-test-secret-key-0123456789';

const SECRET = process.env['APP_SECRET_KEY'];
const CODE = 'ABCDEFGHJK';

const createPrismaMock = ({ enabled = true }: { enabled?: boolean } = {}) => ({
  setting: {
    findUnique: vi.fn(async ({ where }: { where: { name: SettingName } }) => {
      switch (where.name) {
        case SettingName.LOGIN_CODE_ENABLED:
          return { value: enabled };
        case SettingName.LOGIN_CODE_MAX_USES:
          return { value: 3 };
        default:
          return { value: 30 };
      }
    }),
  },
  userLoginCode: {
    findFirst: vi.fn(async () => null),
    findUnique: vi.fn(async () => null),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'code-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      lastUsedAt: null,
      revokedAt: null,
      revokedBy: null,
      ...data,
    })),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
});

const createService = (prisma = createPrismaMock()) => ({
  prisma,
  service: new LoginCodeService(prisma as never, {
    websiteURL: 'https://example.com',
  }),
});

const activeRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'code-1',
  userId: 'user-1',
  codeHash: hashLoginCode(CODE, deriveLoginCodeKey(SECRET)),
  codeEncrypted: new SecretCrypto().encrypt(CODE),
  expiresAt: addDays(new Date(), 60),
  maxUses: 5,
  usesRemaining: 5,
  lastUsedAt: null,
  revokedAt: null,
  revokedBy: null,
  issuedBy: 'mail',
  createdAt: new Date(),
  modifiedAt: new Date(),
  user: { id: 'user-1', active: true, totpEnabled: false },
  ...overrides,
});

describe('LoginCodeService', () => {
  it('mints a code with the configured limits when none exists', async () => {
    const { prisma, service } = createService();

    const { record, canonical } = await service.getOrIssue('user-1', 'letter');

    expect(canonical).toHaveLength(10);
    expect(prisma.userLoginCode.create).toHaveBeenCalledTimes(1);
    expect(record.maxUses).toBe(3);
    expect(record.usesRemaining).toBe(3);
    expect(record.issuedBy).toBe('letter');
    expect(record.codeHash).toBe(
      hashLoginCode(canonical, deriveLoginCodeKey(SECRET))
    );
    expect(new SecretCrypto().decrypt(record.codeEncrypted as string)).toBe(
      canonical
    );
  });

  it('reuses an active code so mail and letter carry the same one', async () => {
    const prisma = createPrismaMock();
    prisma.userLoginCode.findFirst.mockResolvedValue(activeRecord() as never);
    const { service } = createService(prisma);

    const first = await service.purlFor('user-1', 'mail');
    const second = await service.purlFor('user-1', 'letter');

    expect(first.purlCode).toBe('ABCDE-FGHJK');
    expect(second.purl).toBe(first.purl);
    expect(first.purl).toBe('https://example.com/l/ABCDE-FGHJK');
    expect(first.purlQr).toMatch(/^<svg/);
    expect(prisma.userLoginCode.create).not.toHaveBeenCalled();
  });

  it('verifies a typed code without consuming a use', async () => {
    const prisma = createPrismaMock();
    prisma.userLoginCode.findUnique.mockResolvedValue(activeRecord() as never);
    const { service } = createService(prisma);

    const record = await service.verify('abcde-fghjk');

    expect(record.id).toBe('code-1');
    expect(prisma.userLoginCode.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { codeHash: hashLoginCode(CODE, deriveLoginCodeKey(SECRET)) },
      })
    );
    expect(prisma.userLoginCode.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['unknown', null],
    ['revoked', activeRecord({ revokedAt: new Date() })],
    ['expired', activeRecord({ expiresAt: addDays(new Date(), -1) })],
    ['exhausted', activeRecord({ usesRemaining: 0 })],
  ])('rejects a %s code', async (_label, record) => {
    const prisma = createPrismaMock();
    prisma.userLoginCode.findUnique.mockResolvedValue(record as never);
    const { service } = createService(prisma);

    await expect(service.verify(CODE)).rejects.toBeInstanceOf(
      InvalidLoginCodeError
    );
    expect(prisma.userLoginCode.updateMany).not.toHaveBeenCalled();
  });

  it('rejects malformed input before touching the database', async () => {
    const { prisma, service } = createService();

    await expect(service.verify('nope')).rejects.toBeInstanceOf(
      InvalidLoginCodeError
    );
    expect(prisma.userLoginCode.findUnique).not.toHaveBeenCalled();
  });

  it('consumes exactly one use and fails when the code is no longer active', async () => {
    const prisma = createPrismaMock();
    const { service } = createService(prisma);

    await service.consume('code-1');
    expect(prisma.userLoginCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'code-1', revokedAt: null }),
        data: expect.objectContaining({ usesRemaining: { decrement: 1 } }),
      })
    );

    prisma.userLoginCode.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.consume('code-1')).rejects.toBeInstanceOf(
      InvalidLoginCodeError
    );
  });

  describe('while the medium has not switched login codes on', () => {
    it.each([
      ['switched off', { value: false }],
      ['never set', null],
    ])('rejects even a valid code when %s', async (_label, setting) => {
      const prisma = createPrismaMock();
      prisma.setting.findUnique.mockResolvedValue(setting as never);
      prisma.userLoginCode.findUnique.mockResolvedValue(
        activeRecord() as never
      );
      const { service } = createService(prisma);

      await expect(service.verify(CODE)).rejects.toBeInstanceOf(
        LoginCodeDisabledError
      );
    });

    it('puts no login link into mails and letters, and issues no code', async () => {
      const prisma = createPrismaMock({ enabled: false });
      const { service } = createService(prisma);

      expect(await service.purlFor('user-1', 'letter')).toEqual({
        purl: '',
        purlCode: '',
        purlQr: '',
      });
      expect(prisma.userLoginCode.findFirst).not.toHaveBeenCalled();
      expect(prisma.userLoginCode.create).not.toHaveBeenCalled();
    });

    it('lets no editor issue a new code', async () => {
      const prisma = createPrismaMock({ enabled: false });
      const { service } = createService(prisma);

      await expect(
        service.reissue('user-1', 'editor:admin')
      ).rejects.toBeInstanceOf(LoginCodeDisabledError);
      expect(prisma.userLoginCode.create).not.toHaveBeenCalled();
    });
  });
});
