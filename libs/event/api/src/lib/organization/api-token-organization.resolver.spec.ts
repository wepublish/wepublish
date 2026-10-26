import { ApiTokenOrganizationResolver } from './api-token-organization.resolver';

const dataloader = (organization: unknown) => ({
  load: vi.fn(async () => organization),
});

describe('ApiTokenOrganizationResolver', () => {
  it('loads the organisation a key is bound to', async () => {
    const organization = { id: 'org-1', name: 'Dampfzentrale' };
    const loader = dataloader(organization);

    await expect(
      new ApiTokenOrganizationResolver(loader as never).organization({
        organizationId: 'org-1',
      } as never)
    ).resolves.toBe(organization);

    expect(loader.load).toHaveBeenCalledWith('org-1');
  });

  it('is nothing for a platform key', () => {
    const loader = dataloader(null);

    expect(
      new ApiTokenOrganizationResolver(loader as never).organization({
        organizationId: null,
      } as never)
    ).toBeNull();
    expect(loader.load).not.toHaveBeenCalled();
  });
});
