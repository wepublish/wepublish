import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  AuthenticationService,
  AuthSession,
  AuthSessionType,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import {
  KvTtlCacheModule,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { OrganizationDataloaderService } from './organization-dataloader.service';
import { OrganizationService } from './organization.service';

const sessionRow = (organizationIds: string[]) => ({
  id: 'session-1',
  token: 'secret-token',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  expiresAt: new Date('2030-01-01T00:00:00.000Z'),
  impersonatedBy: null,
  user: {
    id: 'user-1',
    active: true,
    roleIDs: [],
    organizationMemberships: organizationIds.map(organizationId => ({
      organizationId,
    })),
  },
});

const organizationIdsOfSession = (session: AuthSession | null) =>
  session?.type === AuthSessionType.User ? session.organizationIds : null;

const tick = () => new Promise(resolve => setTimeout(resolve, 2));

describe('session cache after organisation membership changes', () => {
  let authentication: AuthenticationService;
  let organizations: OrganizationService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule, KvTtlCacheModule],
      providers: [
        AuthenticationService,
        SessionCacheInvalidator,
        OrganizationService,
        {
          provide: PublicContentCacheInvalidator,
          useValue: { invalidate: vi.fn() },
        },
        {
          provide: OrganizationDataloaderService,
          useValue: { prime: vi.fn() },
        },
      ],
    }).compile();

    prisma = module.get(PrismaClient);
    authentication = module.get(AuthenticationService);
    organizations = await module.resolve(OrganizationService);

    vi.spyOn(prisma.userRole, 'findMany').mockResolvedValue([]);
  });

  it('takes access away from a removed member on their next request', async () => {
    const sessionSpy = vi
      .spyOn(prisma.session, 'findFirst')
      .mockResolvedValue(sessionRow(['org-1']) as any);
    vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
      userId: 'user-1',
      organizationId: 'org-1',
    } as any);
    vi.spyOn(prisma.organizationMember, 'delete').mockResolvedValue({
      userId: 'user-1',
      organizationId: 'org-1',
    } as any);

    expect(
      organizationIdsOfSession(
        await authentication.getUserSession('secret-token')
      )
    ).toEqual(['org-1']);

    await tick();
    sessionSpy.mockResolvedValue(sessionRow([]) as any);
    await organizations.removeOrganizationMember({
      organizationId: 'org-1',
      userId: 'user-1',
    });

    expect(
      organizationIdsOfSession(
        await authentication.getUserSession('secret-token')
      )
    ).toEqual([]);
    expect(sessionSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps cached sessions when an organisation is only updated', async () => {
    const sessionSpy = vi
      .spyOn(prisma.session, 'findFirst')
      .mockResolvedValue(sessionRow(['org-1']) as any);
    vi.spyOn(prisma.organization, 'findUnique').mockImplementation((async ({
      where,
    }: any) =>
      where.id === 'org-1' ?
        { id: 'org-1', name: 'A', enabled: true, partner: false }
      : null) as any);
    vi.spyOn(prisma.organization, 'update').mockResolvedValue({
      id: 'org-1',
    } as any);

    const session = await authentication.getUserSession('secret-token');
    await tick();
    await organizations.updateOrganization({ id: 'org-1', name: 'B' }, session);
    await authentication.getUserSession('secret-token');

    expect(sessionSpy).toHaveBeenCalledTimes(1);
  });
});
