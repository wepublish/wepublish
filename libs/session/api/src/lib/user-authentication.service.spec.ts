import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserService } from '@wepublish/user/api';
import { UserAuthenticationService } from './user-authentication.service';

describe('UserAuthenticationService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the error stack when updating the last login link fails', async () => {
    const error = new Error('connection lost');
    const prisma = {
      user: { findUniqueOrThrow: vi.fn().mockRejectedValue(error) },
    } as unknown as PrismaClient;
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    await new UserAuthenticationService(
      {} as UserService,
      prisma
    ).updateUserLastLoginLinkSend('user-1');

    expect(warn).toHaveBeenCalledWith(
      `Updating User with ID user-1 failed: ${error.stack}`
    );
  });

  it('logs a thrown value that is not an error', async () => {
    const prisma = {
      user: { findUniqueOrThrow: vi.fn().mockRejectedValue('timeout') },
    } as unknown as PrismaClient;
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    await new UserAuthenticationService(
      {} as UserService,
      prisma
    ).updateUserLastLoginLinkSend('user-1');

    expect(warn).toHaveBeenCalledWith(
      'Updating User with ID user-1 failed: timeout'
    );
  });
});
