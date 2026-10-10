import { generateKeyPairSync } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { codeChallengeOf, ImpersonationError } from './impersonation';
import { InvalidCredentialsError } from './session.errors';
import { JwtService } from './jwt.service';
import { SessionService } from './session.service';

const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const otherMediumKeys = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

type Grant = {
  jti: string;
  expiresAt: Date;
  codeChallenge: string | null;
  redeemedAt: Date | null;
};

describe('SessionService impersonation grants', () => {
  let grants: Grant[];
  let sessions: Array<Record<string, unknown>>;
  let service: SessionService;
  let auditLog: { record: ReturnType<typeof vi.fn> };

  const users: Record<string, { id: string; email: string; active: boolean }> =
    {
      support: { id: 'support', email: 'admin@wepublish.ch', active: true },
      editor: { id: 'editor', email: 'editor@medium.ch', active: true },
    };

  beforeEach(() => {
    grants = [];
    sessions = [];
    auditLog = { record: vi.fn() };

    const prisma = {
      user: {
        findUnique: vi.fn(
          async ({ where }: { where: { id: string } }) =>
            users[where.id] ?? null
        ),
        update: vi.fn(async () => ({})),
      },
      impersonationGrant: {
        create: vi.fn(async ({ data }: { data: Partial<Grant> }) => {
          const grant = {
            codeChallenge: null,
            redeemedAt: null,
            ...data,
          } as Grant;
          grants.push(grant);

          return grant;
        }),
        updateMany: vi.fn(
          async ({
            where,
            data,
          }: {
            where: Partial<Grant>;
            data: Partial<Grant>;
          }) => {
            const hits = grants.filter(
              grant =>
                grant.jti === where.jti &&
                grant.redeemedAt === where.redeemedAt &&
                (!('codeChallenge' in where) ||
                  grant.codeChallenge === where.codeChallenge)
            );
            hits.forEach(grant => Object.assign(grant, data));

            return { count: hits.length };
          }
        ),
      },
      session: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          sessions.push(data);

          return { id: `session-${sessions.length}`, createdAt: new Date() };
        }),
      },
    };

    service = new SessionService(
      prisma as unknown as PrismaClient,
      1,
      {} as never,
      {} as never,
      { authenticateUserWithJWT: vi.fn().mockResolvedValue(null) } as never,
      new JwtService(
        privateKey as string,
        publicKey as string,
        'https://api.medium.ch',
        'https://www.medium.ch'
      ),
      {} as never,
      {} as never,
      {} as never,
      { invalidate: vi.fn() } as unknown as SessionCacheInvalidator,
      auditLog as never
    );
  });

  const grant = (
    input: Partial<Parameters<SessionService['createImpersonationGrant']>[0]>
  ) =>
    service.createImpersonationGrant({
      userId: 'support',
      durationMinutes: 60,
      impersonatedBy: 'ops@wepublish.ch',
      ...input,
    });

  it('signs in as admin@wepublish.ch without a reason', async () => {
    const { token } = await grant({});

    const session = await service.createSessionWithJWT(token);

    expect(session.impersonated).toBe(true);
    expect(sessions[0]).toMatchObject({
      impersonatedBy: 'ops@wepublish.ch',
      impersonationReason: null,
    });
  });

  it('keeps a reason given for the support account', async () => {
    const { token } = await grant({ reason: 'Ticket 4711' });

    await service.createSessionWithJWT(token);

    expect(sessions[0]).toMatchObject({ impersonationReason: 'Ticket 4711' });
  });

  it('still asks for a reason to sign in as anyone else', async () => {
    await expect(grant({ userId: 'editor' })).rejects.toThrow(
      ImpersonationError
    );
    await expect(
      grant({ userId: 'editor', reason: 'Ticket 4711' })
    ).resolves.toMatchObject({ email: 'editor@medium.ch' });
  });

  it('redeems a grant bound to a code challenge only with its verifier', async () => {
    const { token } = await grant({ codeChallenge: codeChallengeOf(VERIFIER) });

    await expect(
      service.createSessionWithJWT(token, undefined, 'another-verifier')
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(
      service.createSessionWithJWT(token, undefined, VERIFIER)
    ).resolves.toMatchObject({ impersonated: true });
  });

  it('refuses a grant bound to a code challenge that arrives without its verifier', async () => {
    const { token } = await grant({ codeChallenge: codeChallengeOf(VERIFIER) });

    await expect(service.createSessionWithJWT(token)).rejects.toBeInstanceOf(
      InvalidCredentialsError
    );
  });

  it('redeems a grant without a code challenge through the plain link as before', async () => {
    const { token } = await grant({ reason: 'Ticket 4711', userId: 'editor' });

    await expect(service.createSessionWithJWT(token)).resolves.toMatchObject({
      impersonated: true,
    });
  });

  it('redeems every grant only once', async () => {
    const { token } = await grant({ codeChallenge: codeChallengeOf(VERIFIER) });
    await service.createSessionWithJWT(token, undefined, VERIFIER);

    await expect(
      service.createSessionWithJWT(token, undefined, VERIFIER)
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('refuses a code challenge that is not S256', async () => {
    await expect(grant({ codeChallenge: 'plain-text' })).rejects.toThrow(
      ImpersonationError
    );
  });

  it('refuses a grant another medium issued, even for the same user id', async () => {
    const otherMedium = new JwtService(
      otherMediumKeys.privateKey as string,
      otherMediumKeys.publicKey as string,
      'https://api.other-medium.ch',
      'https://www.other-medium.ch'
    );
    const token = await otherMedium.generateImpersonationGrant({
      userId: 'support',
      durationMinutes: 60,
      impersonatedBy: 'ops@wepublish.ch',
      reason: null,
      jti: 'grant-of-the-other-medium',
    });
    grants.push({
      jti: 'grant-of-the-other-medium',
      expiresAt: new Date(Date.now() + 60_000),
      codeChallenge: null,
      redeemedAt: null,
    });

    await expect(service.createSessionWithJWT(token)).rejects.toBeInstanceOf(
      InvalidCredentialsError
    );
    expect(sessions).toHaveLength(0);
  });

  it('writes every sign-in through One to the audit log, naming the operator', async () => {
    const { token } = await grant({ codeChallenge: codeChallengeOf(VERIFIER) });

    await service.createSessionWithJWT(token, undefined, VERIFIER);

    expect(auditLog.record).toHaveBeenCalledWith({
      mutation: 'createSessionWithJWT',
      action: 'other',
      entity: 'Session',
      recordId: 'session-1',
      actorType: 'user',
      userId: 'support',
      userEmail: 'admin@wepublish.ch',
      sessionId: 'session-1',
      impersonatedBy: 'ops@wepublish.ch',
      success: true,
      errorMessage: null,
    });
  });

  it('writes a refused sign-in through One to the audit log as well', async () => {
    const { token } = await grant({ codeChallenge: codeChallengeOf(VERIFIER) });

    await expect(
      service.createSessionWithJWT(token, undefined, 'another-verifier')
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        mutation: 'createSessionWithJWT',
        userId: 'support',
        impersonatedBy: 'ops@wepublish.ch',
        sessionId: null,
        success: false,
        errorMessage: expect.stringContaining('refused'),
      })
    );
  });
});
