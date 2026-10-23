import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { OrganizationDataloaderService } from './organization/organization-dataloader.service';
import { PlaceDataloaderService } from './place/place-dataloader.service';
import { EventRelationsResolver } from './event-relations.resolver';
import { AudienceDataloader } from './taxonomy/event-taxonomy.dataloader';

const member = {
  type: AuthSessionType.User,
  user: { id: 'user-1' },
  roles: [],
  organizationIds: ['org-a'],
} as unknown as AuthSession;

describe('EventRelationsResolver', () => {
  const places = { load: vi.fn(async (id: string) => ({ id })) };
  const audiences = { load: vi.fn(async (id: string) => ({ id })) };
  const organizations = { load: vi.fn() };
  const resolver = new EventRelationsResolver(
    places as unknown as PlaceDataloaderService,
    audiences as unknown as AudienceDataloader,
    organizations as unknown as OrganizationDataloaderService
  );

  beforeEach(() => vi.clearAllMocks());

  it('loads the place and the audience of an event', async () => {
    await expect(
      resolver.place({ placeId: 'place-1' } as any)
    ).resolves.toEqual({ id: 'place-1' });
    await expect(
      resolver.audience({ audienceId: 'audience-1' } as any)
    ).resolves.toEqual({ id: 'audience-1' });
  });

  it('is null without a place, audience or organisation', async () => {
    const event = { placeId: null, audienceId: null, organizationId: null };

    await expect(resolver.place(event as any)).resolves.toBeNull();
    await expect(resolver.audience(event as any)).resolves.toBeNull();
    await expect(
      resolver.organization(event as any, undefined)
    ).resolves.toBeNull();
    expect(places.load).not.toHaveBeenCalled();
    expect(audiences.load).not.toHaveBeenCalled();
    expect(organizations.load).not.toHaveBeenCalled();
  });

  it('loads an enabled organisation for everybody', async () => {
    organizations.load.mockResolvedValue({ id: 'org-b', enabled: true });

    await expect(
      resolver.organization({ organizationId: 'org-b' } as any, undefined)
    ).resolves.toEqual({ id: 'org-b', enabled: true });
  });

  it('hides a disabled organisation from those who may not see it', async () => {
    organizations.load.mockImplementation(async (id: string) => ({
      id,
      enabled: false,
    }));

    await expect(
      resolver.organization({ organizationId: 'org-b' } as any, member)
    ).resolves.toBeNull();
    await expect(
      resolver.organization({ organizationId: 'org-a' } as any, member)
    ).resolves.toEqual({ id: 'org-a', enabled: false });
  });
});
