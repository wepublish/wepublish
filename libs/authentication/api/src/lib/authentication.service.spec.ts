import { PrismaModule } from '@wepublish/nest-modules';
import { PrismaClient } from '@prisma/client';
import { TestingModule, Test } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { AuthSession, AuthSessionType } from './auth-session';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [AuthenticationService],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should return a token session', async () => {
    const sessionSpy = jest
      .spyOn(prisma.session, 'findFirst')
      .mockReturnValue(Promise.resolve(null) as any);
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
    const userSpy = jest.spyOn(prisma.user, 'findUnique');

    const result = await service.getSessionByToken('1234');
    expect(result).toMatchSnapshot();
    expect(sessionSpy.mock.calls[0]).toMatchSnapshot();
    expect(tokenSpy.mock.calls[0]).toMatchSnapshot();
    expect(userRoleSpy.mock.calls[0]).toMatchSnapshot();
    expect(userSpy).not.toHaveBeenCalled();
  });

  it('should return a user session', async () => {
    const sessionSpy = jest.spyOn(prisma.session, 'findFirst').mockReturnValue(
      Promise.resolve({
        userID: '12345',
      }) as any
    );
    const tokenSpy = jest
      .spyOn(prisma.token, 'findFirst')
      .mockReturnValue(Promise.resolve(null) as any);
    const userRoleSpy = jest
      .spyOn(prisma.userRole, 'findMany')
      .mockReturnValue(Promise.resolve([]) as any);
    const userSpy = jest.spyOn(prisma.user, 'findUnique').mockReturnValue(
      Promise.resolve({
        roleIDs: ['1111', '2222'],
      }) as any
    );

    const result = await service.getSessionByToken('1234');
    expect(result).toMatchSnapshot();
    expect(sessionSpy.mock.calls[0]).toMatchSnapshot();
    expect(tokenSpy.mock.calls[0]).toMatchSnapshot();
    expect(userRoleSpy.mock.calls[0]).toMatchSnapshot();
    expect(userSpy.mock.calls[0][0]).toMatchSnapshot({
      select: expect.any(Object),
    });
  });

  it("should return null if user can't be found", async () => {
    const sessionSpy = jest.spyOn(prisma.session, 'findFirst').mockReturnValue(
      Promise.resolve({
        userID: '12345',
      }) as any
    );
    const tokenSpy = jest
      .spyOn(prisma.token, 'findFirst')
      .mockReturnValue(Promise.resolve(null) as any);
    const userRoleSpy = jest
      .spyOn(prisma.userRole, 'findMany')
      .mockReturnValue(Promise.resolve([]) as any);
    const userSpy = jest
      .spyOn(prisma.user, 'findUnique')
      .mockReturnValue(Promise.resolve(null) as any);

    const result = await service.getSessionByToken('1234');
    expect(result).toBeNull();
    expect(sessionSpy.mock.calls[0]).toMatchSnapshot();
    expect(tokenSpy.mock.calls[0]).toMatchSnapshot();
    expect(userRoleSpy.mock.calls[0]).toMatchSnapshot();
    expect(userSpy.mock.calls[0][0]).toMatchSnapshot({
      select: expect.any(Object),
    });
  });

  it('should return that the session is valid if expiresAt is in the future', () => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + 5000);

    const session = {
      type: AuthSessionType.User,
      expiresAt: future,
    } as AuthSession;

    const result = service.isSessionValid(session);
    expect(result).toBeTruthy();
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
    } as AuthSession;

    const result = service.isSessionValid(session);
    expect(result).toBeFalsy();
  });

  it("should return that the session is invalid if it's null", () => {
    const result = service.isSessionValid(null);
    expect(result).toBeFalsy();
  });
});
