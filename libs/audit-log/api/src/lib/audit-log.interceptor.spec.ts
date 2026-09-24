import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditLogAction, AuditLogActorType, User } from '@prisma/client';
import { AuthSessionType, UserSession } from '@wepublish/authentication/api';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AUDIT_LOG_METADATA_KEY } from './audit-log.decorator';
import { AuditLogInterceptor, describeActor } from './audit-log.interceptor';
import { AuditLogService } from './audit-log.service';

const CanDoSomething = {
  id: 'CAN_DO_SOMETHING',
  description: '',
  deprecated: false,
};

const user = { id: 'user-1', email: 'editor@example.com' } as User;

const userSession: UserSession = {
  type: AuthSessionType.User,
  id: 'session-1',
  token: 'token',
  createdAt: new Date(),
  expiresAt: new Date(),
  user,
  roles: [],
};

type ContextOverrides = {
  operation?: string;
  fieldName?: string;
  args?: unknown;
  session?: unknown;
  type?: string;
};

const createContext = ({
  operation = 'mutation',
  fieldName = 'updateArticle',
  args = { id: 'article-1' },
  session = userSession,
  type = 'graphql',
}: ContextOverrides = {}) =>
  ({
    getType: () => type,
    getHandler: () => jest.fn(),
    getClass: () => class {},
    getArgs: () => [
      undefined,
      args,
      { req: { user: session } },
      { operation: { operation }, fieldName },
    ],
  }) as unknown as ExecutionContext;

describe('describeActor', () => {
  it('describes a user session', () => {
    expect(describeActor(userSession)).toEqual({
      actorType: AuditLogActorType.user,
      userID: 'user-1',
      userEmail: 'editor@example.com',
      tokenName: null,
      sessionID: 'session-1',
      impersonatedBy: null,
    });
  });

  it('carries impersonation through', () => {
    expect(
      describeActor({ ...userSession, impersonatedBy: 'admin-9' })
    ).toMatchObject({
      userID: 'user-1',
      impersonatedBy: 'admin-9',
    });
  });

  it('describes a token session', () => {
    expect(
      describeActor({
        type: AuthSessionType.Token,
        id: 'token-1',
        name: 'Peering Token',
        token: 'secret',
        roles: [],
      })
    ).toEqual({
      actorType: AuditLogActorType.token,
      userID: null,
      userEmail: null,
      tokenName: 'Peering Token',
      sessionID: 'token-1',
      impersonatedBy: null,
    });
  });

  it('describes an absent session without throwing', () => {
    expect(describeActor(undefined)).toMatchObject({
      userID: null,
      sessionID: null,
    });
  });
});

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let reflector: Reflector;
  let auditLogService: { record: jest.Mock };

  const permitted = (key: string) =>
    key === PERMISSIONS_METADATA_KEY ? [CanDoSomething] : [];

  beforeEach(() => {
    jest.clearAllMocks();
    auditLogService = { record: jest.fn().mockResolvedValue(undefined) };
    reflector = new Reflector();
    jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockImplementation(permitted as never);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(undefined as never);

    interceptor = new AuditLogInterceptor(
      reflector,
      auditLogService as unknown as AuditLogService
    );
  });

  const run = async (
    context: ExecutionContext,
    handler = { handle: () => of({ id: 'article-1' }) }
  ) => firstValueFrom(interceptor.intercept(context, handler));

  it('records a permission gated mutation', async () => {
    await run(createContext());

    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        mutation: 'updateArticle',
        action: AuditLogAction.update,
        entity: 'Article',
        recordId: 'article-1',
        userID: 'user-1',
        sessionID: 'session-1',
        success: true,
      })
    );
  });

  it('does not record a mutation without permission metadata', async () => {
    jest.spyOn(reflector, 'getAllAndMerge').mockReturnValue([] as never);

    await run(createContext());

    expect(auditLogService.record).not.toHaveBeenCalled();
  });

  it('does not record queries', async () => {
    await run(createContext({ operation: 'query' }));

    expect(auditLogService.record).not.toHaveBeenCalled();
  });

  it('does not record outside of graphql', async () => {
    await run(createContext({ type: 'http' }));

    expect(auditLogService.record).not.toHaveBeenCalled();
  });

  it('honours an explicit skip', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) =>
        key === AUDIT_LOG_METADATA_KEY ?
          ({ skip: true } as never)
        : (undefined as never)
      );

    await run(createContext());

    expect(auditLogService.record).not.toHaveBeenCalled();
  });

  it('honours an entity and action override', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) =>
        key === AUDIT_LOG_METADATA_KEY ?
          ({ entity: 'Paywall', action: AuditLogAction.delete } as never)
        : (undefined as never)
      );

    await run(createContext({ fieldName: 'sendSomething' }));

    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'Paywall',
        action: AuditLogAction.delete,
      })
    );
  });

  it('takes the record id from the result when the args carry none', async () => {
    await run(createContext({ fieldName: 'createArticle', args: {} }), {
      handle: () => of({ id: 'new-article' }),
    });

    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditLogAction.create,
        recordId: 'new-article',
      })
    );
  });

  it('records a failed mutation and rethrows the error', async () => {
    const failure = new Error('not allowed');

    await expect(
      run(createContext(), { handle: () => throwError(() => failure) })
    ).rejects.toThrow('not allowed');

    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        mutation: 'updateArticle',
        success: false,
        errorMessage: 'not allowed',
      })
    );
  });

  it('does not break the mutation when recording throws', async () => {
    auditLogService.record.mockImplementation(() => {
      throw new Error('audit log down');
    });

    await expect(run(createContext())).resolves.toEqual({ id: 'article-1' });
  });
});
