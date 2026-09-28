import { PrismaModule } from '@wepublish/nest-modules';
import { PrismaClient } from '@prisma/client';
import { TestingModule, Test } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { AuthSession, AuthSessionType } from './auth-session';
import { createKvMock, KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        AuthenticationService,
        { provide: KvTtlCacheService, useValue: createKvMock() },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<AuthenticationService>(AuthenticationService);

    jest
      .spyOn(prisma.settingLetterProvider, 'findMany')
      .mockResolvedValue([] as any);
  });

  it('should return a token session', async () => {
    const tokenSpy = jest.spyOn(prisma.token, 'findFirst').mockReturnValue(
      Promise.resolve({
        id: '1234-1234',
        name: 'Foo Token',
        token: '1234',
        roleIDs: ['1234', '12345'],
      }) as any
    );
    const userRoleSpy = jest
      .spyOn(prisma.userRole, 'findMany')
      .mockReturnValue(Promise.resolve([]) as any);

    const result = await service.getPeerSession('1234');
    expect(result).toMatchSnapshot();
    expect(tokenSpy.mock.calls[0]).toMatchSnapshot();
    expect(userRoleSpy.mock.calls[0]).toMatchSnapshot();
  });

  it('should return a user session', async () => {
    const sessionSpy = jest.spyOn(prisma.session, 'findFirst').mockReturnValue(
      Promise.resolve({
        userID: '12345',
        origin: 'password',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        user: {
          id: '12345',
          email: 'test@example.com',
        },
      }) as any
    );
    const userRoleSpy = jest
      .spyOn(prisma.userRole, 'findMany')
      .mockReturnValue(Promise.resolve([]) as any);

    const result = await service.getUserSession('1234');
    expect(result).toMatchSnapshot();
    expect(sessionSpy.mock.calls[0]).toMatchSnapshot();
    expect(userRoleSpy.mock.calls[0]).toMatchSnapshot();
  });

  it("should return null if user can't be found", async () => {
    const sessionSpy = jest.spyOn(prisma.session, 'findFirst').mockReturnValue(
      Promise.resolve({
        userID: '12345',
      }) as any
    );
    const userRoleSpy = jest
      .spyOn(prisma.userRole, 'findMany')
      .mockReturnValue(Promise.resolve([]) as any);

    const result = await service.getUserSession('1234');
    expect(result).toBeNull();
    expect(sessionSpy.mock.calls[0]).toMatchSnapshot();
    expect(userRoleSpy.mock.calls[0]).toMatchSnapshot();
  });

  it('should return that the session is valid if expiresAt is in the future', () => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + 5000);

    const session = {
      type: AuthSessionType.User,
      expiresAt: future,
      user: { active: true },
    } as AuthSession;

    const result = service.isSessionValid(session);
    expect(result).toBeTruthy();
  });

  it('should return that the session is invalid if the user is inactive', () => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + 5000);

    const session = {
      type: AuthSessionType.User,
      expiresAt: future,
      user: { active: false },
    } as AuthSession;

    const result = service.isSessionValid(session);
    expect(result).toBeFalsy();
  });

  it("should return that the session is valid if it's a token session", () => {
    const session = {
      type: AuthSessionType.Token,
    } as AuthSession;

    const result = service.isSessionValid(session);
    expect(result).toBeTruthy();
  });

  it('should return that the session is invalid if expiresAt is in the past', () => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - 5000);

    const session = {
      type: AuthSessionType.User,
      expiresAt: past,
      user: { active: true },
    } as AuthSession;

    const result = service.isSessionValid(session);
    expect(result).toBeFalsy();
  });

  it("should return that the session is invalid if it's null", () => {
    const result = service.isSessionValid(null);
    expect(result).toBeFalsy();
  });
});
