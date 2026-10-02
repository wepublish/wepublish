import { PrismaModule } from '@wepublish/nest-modules';
import { PrismaClient } from '@prisma/client';
import { TestingModule, Test } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { AuthSession, AuthSessionType } from './auth-session';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { createHash } from 'crypto';
import { SESSION_CACHE_NAMESPACE } from './session-cache';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let prisma: PrismaClient;
  let kv: KvTtlCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, KvTtlCacheModule],
      providers: [AuthenticationService],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    kv = module.get(KvTtlCacheService);
    service = module.get<AuthenticationService>(AuthenticationService);
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
        user: {
          id: '12345',
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

  describe('session cache', () => {
    const userSession = {
      id: 'session-1',
      token: 'secret-token',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      impersonatedBy: null,
      user: { id: 'user-1', roleIDs: ['editor'] },
    };

    it('reuses a cached user session instead of querying again', async () => {
      const sessionSpy = jest
        .spyOn(prisma.session, 'findFirst')
        .mockResolvedValue(userSession as any);
      jest.spyOn(prisma.userRole, 'findMany').mockResolvedValue([]);

      const first = await service.getUserSession('secret-token');
      const second = await service.getUserSession('secret-token');

      expect(sessionSpy).toHaveBeenCalledTimes(1);
      expect(second).toEqual(first);
      expect(
        second?.type === AuthSessionType.User && second.expiresAt
      ).toBeInstanceOf(Date);
    });

    it('keys cached sessions by a hash of the token, never by the token itself', async () => {
      jest
        .spyOn(prisma.session, 'findFirst')
        .mockResolvedValue(userSession as any);
      jest.spyOn(prisma.userRole, 'findMany').mockResolvedValue([]);
      const cacheSpy = jest.spyOn(kv, 'getOrLoadNs');

      await service.getUserSession('secret-token');

      const [namespace, key] = cacheSpy.mock.calls[0];
      expect(namespace).toBe(SESSION_CACHE_NAMESPACE);
      expect(key).toBe(
        `user:${createHash('sha256').update('secret-token').digest('hex')}`
      );
      expect(key).not.toContain('secret-token');
    });

    it('leaves the token out of the cached user session but still returns it', async () => {
      jest
        .spyOn(prisma.session, 'findFirst')
        .mockResolvedValue(userSession as any);
      jest.spyOn(prisma.userRole, 'findMany').mockResolvedValue([]);
      const cacheSpy = jest.spyOn(kv, 'getOrLoadNs');

      const session = await service.getUserSession('secret-token');
      const cached = await cacheSpy.mock.calls[0][2]();

      expect(session?.token).toBe('secret-token');
      expect(JSON.stringify(cached)).not.toContain('secret-token');
    });

    it('leaves the token out of the cached peer session but still returns it', async () => {
      jest.spyOn(prisma.token, 'findFirst').mockResolvedValue({
        id: 'token-1',
        name: 'Peer',
        token: 'secret-token',
        roleIDs: [],
      } as any);
      jest.spyOn(prisma.userRole, 'findMany').mockResolvedValue([]);
      const cacheSpy = jest.spyOn(kv, 'getOrLoadNs');

      const session = await service.getPeerSession('secret-token');
      const cached = await cacheSpy.mock.calls[0][2]();

      expect(session?.token).toBe('secret-token');
      expect(JSON.stringify(cached)).not.toContain('secret-token');
    });

    it('caches peer sessions apart from user sessions', async () => {
      jest.spyOn(prisma.token, 'findFirst').mockResolvedValue({
        id: 'token-1',
        name: 'Peer',
        token: 'secret-token',
        roleIDs: [],
      } as any);
      jest.spyOn(prisma.userRole, 'findMany').mockResolvedValue([]);
      const cacheSpy = jest.spyOn(kv, 'getOrLoadNs');

      await service.getPeerSession('secret-token');

      expect(cacheSpy.mock.calls[0][1]).toMatch(/^peer:/);
    });

    it('keeps user and peer sessions for 5 minutes, since every write to them clears the cache', async () => {
      jest
        .spyOn(prisma.session, 'findFirst')
        .mockResolvedValue(userSession as any);
      jest.spyOn(prisma.token, 'findFirst').mockResolvedValue({
        id: 'token-1',
        name: 'Peer',
        token: 'peer-token',
        roleIDs: [],
      } as any);
      jest.spyOn(prisma.userRole, 'findMany').mockResolvedValue([]);
      const cacheSpy = jest.spyOn(kv, 'getOrLoadNs');

      await service.getUserSession('secret-token');
      await service.getPeerSession('peer-token');

      expect(cacheSpy.mock.calls.map(call => call[3])).toEqual([300, 300]);
    });

    it('does not cache unknown tokens', async () => {
      const sessionSpy = jest
        .spyOn(prisma.session, 'findFirst')
        .mockResolvedValue(null);

      await service.getUserSession('unknown');
      await service.getUserSession('unknown');

      expect(sessionSpy).toHaveBeenCalledTimes(2);
    });

    it('loads the session again after the cache was cleared', async () => {
      const sessionSpy = jest
        .spyOn(prisma.session, 'findFirst')
        .mockResolvedValue(userSession as any);
      jest.spyOn(prisma.userRole, 'findMany').mockResolvedValue([]);

      await service.getUserSession('secret-token');
      await new Promise(resolve => setTimeout(resolve, 2));
      await kv.resetNamespace(SESSION_CACHE_NAMESPACE);
      await service.getUserSession('secret-token');

      expect(sessionSpy).toHaveBeenCalledTimes(2);
    });
  });
});
