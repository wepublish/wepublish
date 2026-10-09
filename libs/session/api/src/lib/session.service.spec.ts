import type { MockInstance } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { SessionOrigin } from '@prisma/client';
import { AuthenticationService } from '@wepublish/authentication/api';
import { ChallengeService } from '@wepublish/challenge/api';
import {
  InvalidLoginCodeError,
  LoginCodeDisabledError,
  LoginCodeRateLimiter,
  LoginCodeService,
} from '@wepublish/login-code/api';
import { createMock } from '@wepublish/testing';
import { NotActiveError } from './session.errors';
import { SessionService } from './session.service';
import { TotpService } from './totp.service';

const activeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'reader@example.com',
  active: true,
  totpEnabled: false,
  emailVerifiedAt: null,
  ...overrides,
});

const codeRecord = (user: ReturnType<typeof activeUser>) => ({
  id: 'code-1',
  userId: user.id,
  user,
});

describe('SessionService.createSessionWithLoginCode', () => {
  let service: SessionService;
  let loginCodes: ReturnType<typeof createMock<LoginCodeService>>;
  let limiter: ReturnType<typeof createMock<LoginCodeRateLimiter>>;
  let totp: ReturnType<typeof createMock<TotpService>>;
  let challenge: ReturnType<typeof createMock<ChallengeService>>;
  let authentication: ReturnType<typeof createMock<AuthenticationService>>;
  let createUserSession: MockInstance;

  beforeEach(() => {
    loginCodes = createMock(LoginCodeService);
    limiter = createMock(LoginCodeRateLimiter);
    totp = createMock(TotpService);
    challenge = createMock(ChallengeService);
    authentication = createMock(AuthenticationService);

    limiter.assertAllowed!.mockResolvedValue(undefined);
    limiter.recordFailure!.mockResolvedValue(undefined);
    limiter.clear!.mockResolvedValue(undefined);
    loginCodes.consume!.mockResolvedValue(undefined);
    loginCodes.isEnabled!.mockResolvedValue(true);
    authentication.isPlaceholderEmail!.mockResolvedValue(false);

    service = new SessionService(
      {} as never,
      1000,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      totp as never,
      authentication as never,
      loginCodes as never,
      limiter as never,
      challenge as never
    );

    createUserSession = vi
      .spyOn(service, 'createUserSession')
      .mockResolvedValue({ token: 'session-token' } as never);
  });

  it('consumes one use and opens a purl session for an active user', async () => {
    const user = activeUser();
    loginCodes.verify!.mockResolvedValue(codeRecord(user) as never);

    const result = await service.createSessionWithLoginCode(
      'ABCDE-FGHJK',
      undefined,
      'fp'
    );

    expect(result).toEqual({ token: 'session-token' });
    expect(limiter.assertAllowed).toHaveBeenCalledWith('fp', false);
    expect(loginCodes.consume).toHaveBeenCalledTimes(1);
    expect(loginCodes.consume).toHaveBeenCalledWith('code-1');
    expect(limiter.clear).toHaveBeenCalledWith('fp');
    expect(limiter.recordFailure).not.toHaveBeenCalled();
    expect(createUserSession).toHaveBeenCalledWith(user, {
      origin: SessionOrigin.purl,
    });
  });

  it('refuses login codes while the medium has them switched off, before any rate limiting or challenge', async () => {
    loginCodes.isEnabled!.mockResolvedValue(false);

    await expect(
      service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp', {
        challengeID: 'challenge-1',
        challengeSolution: 'solution',
      })
    ).rejects.toBeInstanceOf(LoginCodeDisabledError);

    expect(challenge.validateChallenge).not.toHaveBeenCalled();
    expect(limiter.assertAllowed).not.toHaveBeenCalled();
    expect(limiter.recordFailure).not.toHaveBeenCalled();
    expect(loginCodes.verify).not.toHaveBeenCalled();
    expect(createUserSession).not.toHaveBeenCalled();
  });

  it('refuses inactive users without consuming a use', async () => {
    loginCodes.verify!.mockResolvedValue(
      codeRecord(activeUser({ active: false })) as never
    );

    await expect(
      service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp')
    ).rejects.toBeInstanceOf(NotActiveError);

    expect(loginCodes.consume).not.toHaveBeenCalled();
    expect(limiter.recordFailure).toHaveBeenCalledWith('fp');
    expect(createUserSession).not.toHaveBeenCalled();
  });

  it('asks for the TOTP code first and does not count that as a failed guess', async () => {
    loginCodes.verify!.mockResolvedValue(
      codeRecord(activeUser({ totpEnabled: true })) as never
    );

    await expect(
      service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp')
    ).rejects.toThrow('TOTP_REQUIRED');

    expect(loginCodes.consume).not.toHaveBeenCalled();
    expect(limiter.recordFailure).not.toHaveBeenCalled();
  });

  it('verifies the TOTP code when one is given', async () => {
    const user = activeUser({ totpEnabled: true });
    loginCodes.verify!.mockResolvedValue(codeRecord(user) as never);
    totp.verifyUserTotp!.mockResolvedValue(true as never);

    await service.createSessionWithLoginCode('ABCDE-FGHJK', '123456', 'fp');

    expect(totp.verifyUserTotp).toHaveBeenCalledWith('user-1', '123456');
    expect(loginCodes.consume).toHaveBeenCalledTimes(1);
  });

  it('records a failed guess for an invalid code', async () => {
    loginCodes.verify!.mockRejectedValue(new InvalidLoginCodeError());

    await expect(
      service.createSessionWithLoginCode('WRONG-CODE0', undefined, 'fp')
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(limiter.recordFailure).toHaveBeenCalledWith('fp');
    expect(loginCodes.consume).not.toHaveBeenCalled();
  });

  it('does not open a session when the client is locked out', async () => {
    limiter.assertAllowed!.mockRejectedValue(
      new BadRequestException('TOO_MANY_ATTEMPTS')
    );

    await expect(
      service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp')
    ).rejects.toThrow('TOO_MANY_ATTEMPTS');

    expect(loginCodes.verify).not.toHaveBeenCalled();
  });

  it('accepts a valid challenge answer to lift the global lock', async () => {
    const user = activeUser();
    loginCodes.verify!.mockResolvedValue(codeRecord(user) as never);
    challenge.validateChallenge!.mockResolvedValue({ valid: true } as never);

    await service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp', {
      challengeID: 'c1',
      challengeSolution: 's1',
    });

    expect(challenge.validateChallenge).toHaveBeenCalledWith({
      challengeID: 'c1',
      solution: 's1',
    });
    expect(limiter.assertAllowed).toHaveBeenCalledWith('fp', true);
  });
});
