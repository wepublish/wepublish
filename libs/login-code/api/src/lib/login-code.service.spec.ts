import { SecretCrypto, SettingName } from '@wepublish/settings/api';
import { addDays } from 'date-fns';
import { LoginCodeService } from './login-code.service';
import {
  InvalidLoginCodeError,
  LoginCodeDisabledError,
  LoginCodeNotAllowedError,
} from './login-code.errors';
import { deriveLoginCodeKey, hashLoginCode } from './login-code.util';

process.env['APP_SECRET_KEY'] = 'login-code-test-secret-key-0123456789';

const SECRET = process.env['APP_SECRET_KEY'];
const CODE = 'ABCDEFGHJK';

const ROLES = [
  { id: 'admin', permissionIDs: [] },
  { id: 'editor', permissionIDs: [] },
  { id: 'paywall-free', permissionIDs: ['CAN_GET_ARTICLE'] },
  { id: 'comment-moderator', permissionIDs: ['CAN_TAKE_COMMENT_ACTION'] },
];

const createPrismaMock = ({
  enabled = true,
  roleIDs = [] as string[],
}: { enabled?: boolean; roleIDs?: string[] } = {}) => ({
  user: {
    findUnique: vi.fn(async () => ({ id: 'user-1', roleIDs })),
  },
  userRole: {
    findMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) =>
      ROLES.filter(role => where.id.in.includes(role.id))
    ),
    findUnique: vi.fn(
      async ({ where }: { where: { id: string } }) =>
        ROLES.find(role => role.id === where.id) ?? null
    ),
  },
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
  user: { id: 'user-1', active: true, totpEnabled: false, roleIDs: [] },
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

  describe('for staff, whose roles grant more than reading past the paywall', () => {
    it.each([['admin'], ['editor'], ['comment-moderator']])(
      'puts no login link into mails and letters of a %s, and issues no code',
      async roleId => {
        const prisma = createPrismaMock({ roleIDs: [roleId] });
        const { service } = createService(prisma);

        expect(await service.purlFor('user-1', 'mail')).toEqual({
          purl: '',
          purlCode: '',
          purlQr: '',
        });
        expect(prisma.userLoginCode.create).not.toHaveBeenCalled();
      }
    );

    it('does not hand out a code that was issued before the role was given', async () => {
      const prisma = createPrismaMock({ roleIDs: ['editor'] });
      prisma.userLoginCode.findFirst.mockResolvedValue(activeRecord() as never);
      const { service } = createService(prisma);

      await expect(service.getOrIssue('user-1', 'mail')).rejects.toBeInstanceOf(
        LoginCodeNotAllowedError
      );
      expect(await service.purlFor('user-1', 'letter')).toEqual({
        purl: '',
        purlCode: '',
        purlQr: '',
      });
    });

    it('lets no editor issue them a code', async () => {
      const prisma = createPrismaMock({ roleIDs: ['admin'] });
      const { service } = createService(prisma);

      await expect(
        service.reissue('user-1', 'editor:other-admin')
      ).rejects.toBeInstanceOf(LoginCodeNotAllowedError);
      expect(prisma.userLoginCode.updateMany).not.toHaveBeenCalled();
      expect(prisma.userLoginCode.create).not.toHaveBeenCalled();
    });

    it('refuses a code they still hold, the same way as an unknown one, and revokes it', async () => {
      const prisma = createPrismaMock();
      prisma.userLoginCode.findUnique.mockResolvedValue(
        activeRecord({
          user: {
            id: 'user-1',
            active: true,
            totpEnabled: false,
            roleIDs: ['editor'],
          },
        }) as never
      );
      const { service } = createService(prisma);

      await expect(service.verify(CODE)).rejects.toBeInstanceOf(
        InvalidLoginCodeError
      );
      expect(prisma.userLoginCode.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date), revokedBy: 'system:staff-role' },
      });
    });

    describe('once someone becomes staff', () => {
      const revokedForStaff = {
        revokedAt: expect.any(Date),
        revokedBy: 'system:staff-role',
      };

      it('revokes the codes of a person given a staff role', async () => {
        const prisma = createPrismaMock({
          roleIDs: ['paywall-free', 'editor'],
        });
        const { service } = createService(prisma);

        await service.revokeIfStaff('user-1');

        expect(prisma.userLoginCode.updateMany).toHaveBeenCalledWith({
          where: { userId: 'user-1', revokedAt: null },
          data: revokedForStaff,
        });
      });

      it('keeps the code of a reader', async () => {
        const prisma = createPrismaMock({ roleIDs: ['paywall-free'] });
        const { service } = createService(prisma);

        await service.revokeIfStaff('user-1');

        expect(prisma.userLoginCode.updateMany).not.toHaveBeenCalled();
      });

      it.each([['comment-moderator'], ['admin']])(
        'revokes the codes of everyone holding the %s role at once',
        async roleId => {
          const prisma = createPrismaMock();
          const { service } = createService(prisma);

          await service.revokeForRole(roleId);

          expect(prisma.userLoginCode.updateMany).toHaveBeenCalledTimes(1);
          expect(prisma.userLoginCode.updateMany).toHaveBeenCalledWith({
            where: { revokedAt: null, user: { roleIDs: { has: roleId } } },
            data: revokedForStaff,
          });
        }
      );

      it('leaves the holders of a reader role alone', async () => {
        const prisma = createPrismaMock();
        const { service } = createService(prisma);

        await service.revokeForRole('paywall-free');
        await service.revokeForRole('deleted-role');

        expect(prisma.userLoginCode.updateMany).not.toHaveBeenCalled();
      });
    });

    it('still serves readers whose role only lets them past the paywall', async () => {
      const prisma = createPrismaMock({ roleIDs: ['paywall-free'] });
      prisma.userLoginCode.findUnique.mockResolvedValue(
        activeRecord({
          user: {
            id: 'user-1',
            active: true,
            totpEnabled: false,
            roleIDs: ['paywall-free'],
          },
        }) as never
      );
      const { service } = createService(prisma);

      expect((await service.purlFor('user-1', 'mail')).purlCode).not.toBe('');
      await expect(service.verify(CODE)).resolves.toMatchObject({
        id: 'code-1',
      });
    });
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
