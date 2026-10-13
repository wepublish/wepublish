import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GateMode, UserRole } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import {
  CanCreateBanner,
  CanCreateContentGate,
  CanCreatePaywall,
  CanDeleteBanner,
  CanDeleteContentGate,
  CanDeletePaywall,
  CanGetBanner,
  CanUpdateBanner,
  CanUpdateContentGate,
  CanUpdatePaywall,
  Permission,
} from '@wepublish/permissions';
import { GateResolver } from './gate.resolver';

const sessionWith = (...permissions: Permission[]) =>
  ({
    type: AuthSessionType.User,
    roles: [{ permissionIDs: permissions.map(({ id }) => id) } as UserRole],
  }) as AuthSession;

const PERMISSIONS: Record<
  GateMode,
  { create: Permission; update: Permission; delete: Permission }
> = {
  [GateMode.PAYWALL]: {
    create: CanCreatePaywall,
    update: CanUpdatePaywall,
    delete: CanDeletePaywall,
  },
  [GateMode.CONTENT_GATE]: {
    create: CanCreateContentGate,
    update: CanUpdateContentGate,
    delete: CanDeleteContentGate,
  },
  [GateMode.BANNER]: {
    create: CanCreateBanner,
    update: CanUpdateBanner,
    delete: CanDeleteBanner,
  },
};

const MODES = Object.values(GateMode);
const otherMode = (mode: GateMode) => MODES.find(other => other !== mode)!;

describe('GateResolver', () => {
  const service = {
    getGates: vi.fn(),
    getGate: vi.fn(),
    createGate: vi.fn(),
    updateGate: vi.fn(),
    deleteGate: vi.fn(),
  };
  const resolver = new GateResolver(service as any, {} as any, {} as any);

  beforeEach(() => {
    for (const fn of Object.values(service)) {
      fn.mockReset().mockResolvedValue({ id: 'gate-1' });
    }
  });

  describe.each(MODES)('a %s', mode => {
    const permissions = PERMISSIONS[mode];
    const others = PERMISSIONS[otherMode(mode)];

    beforeEach(() => {
      service.getGate.mockResolvedValue({ id: 'gate-1', mode });
    });

    it('can be created with its create permission', async () => {
      await resolver.createGate({ mode }, sessionWith(permissions.create));

      expect(service.createGate).toHaveBeenCalledWith({ mode });
    });

    it.each([
      ['no permission', sessionWith()],
      ['the permission of another mode', sessionWith(others.create)],
      ['no session', undefined],
    ])('can not be created with %s', async (_, session) => {
      await expect(resolver.createGate({ mode }, session)).rejects.toThrow(
        ForbiddenException
      );
      expect(service.createGate).not.toHaveBeenCalled();
    });

    it('can be updated with its update permission', async () => {
      await resolver.updateGate(
        { id: 'gate-1', name: 'x' },
        sessionWith(permissions.update)
      );

      expect(service.updateGate).toHaveBeenCalledWith({
        id: 'gate-1',
        name: 'x',
      });
    });

    it.each([
      ['no permission', sessionWith(permissions.create)],
      ['the permission of another mode', sessionWith(others.update)],
    ])('can not be updated with %s', async (_, session) => {
      await expect(
        resolver.updateGate({ id: 'gate-1' }, session)
      ).rejects.toThrow(ForbiddenException);
      expect(service.updateGate).not.toHaveBeenCalled();
    });

    it('can be deleted with its delete permission', async () => {
      await resolver.deleteGate('gate-1', sessionWith(permissions.delete));

      expect(service.deleteGate).toHaveBeenCalledWith('gate-1');
    });

    it.each([
      ['no permission', sessionWith(permissions.update)],
      ['the permission of another mode', sessionWith(others.delete)],
    ])('can not be deleted with %s', async (_, session) => {
      await expect(resolver.deleteGate('gate-1', session)).rejects.toThrow(
        ForbiddenException
      );
      expect(service.deleteGate).not.toHaveBeenCalled();
    });
  });

  it.each([
    ['updating', () => resolver.updateGate({ id: 'missing' }, sessionWith())],
    ['deleting', () => resolver.deleteGate('missing', sessionWith())],
    ['reading', () => resolver.gate('missing', undefined)],
  ])('fails %s a gate that does not exist', async (_, run) => {
    service.getGate.mockResolvedValue(null);

    await expect(run()).rejects.toThrow(NotFoundException);
  });

  describe('reading', () => {
    // Paywalls and content gates were always public, banners never were.
    it.each([GateMode.PAYWALL, GateMode.CONTENT_GATE])(
      'lists %s gates for anyone',
      async mode => {
        await resolver.gates({ mode }, undefined);

        expect(service.getGates).toHaveBeenCalledWith({ mode });
      }
    );

    it('lists banners only with CanGetBanner', async () => {
      await expect(
        resolver.gates({ mode: GateMode.BANNER }, sessionWith(CanCreateBanner))
      ).rejects.toThrow(ForbiddenException);
      expect(service.getGates).not.toHaveBeenCalled();

      await resolver.gates(
        { mode: GateMode.BANNER },
        sessionWith(CanGetBanner)
      );
      expect(service.getGates).toHaveBeenCalled();
    });

    it('answers a banner only with CanGetBanner', async () => {
      service.getGate.mockResolvedValue({
        id: 'gate-1',
        mode: GateMode.BANNER,
      });

      await expect(resolver.gate('gate-1', undefined)).rejects.toThrow(
        ForbiddenException
      );
      await expect(
        resolver.gate('gate-1', sessionWith(CanGetBanner))
      ).resolves.toEqual({ id: 'gate-1', mode: GateMode.BANNER });
    });

    it('answers a paywall for anyone', async () => {
      service.getGate.mockResolvedValue({
        id: 'gate-1',
        mode: GateMode.PAYWALL,
      });

      await expect(resolver.gate('gate-1', undefined)).resolves.toEqual({
        id: 'gate-1',
        mode: GateMode.PAYWALL,
      });
    });
  });

  it('answers no newsletter params for gates without any', () => {
    expect(
      resolver.newsletterParams({ newsletterParams: null } as any)
    ).toEqual([]);
  });
});
