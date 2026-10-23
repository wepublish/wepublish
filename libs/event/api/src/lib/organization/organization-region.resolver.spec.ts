import { RegionDataloader } from '../taxonomy/event-taxonomy.dataloader';
import { OrganizationRegionResolver } from './organization-region.resolver';

describe('OrganizationRegionResolver', () => {
  const regions = { load: vi.fn(async (id: string) => ({ id })) };
  const resolver = new OrganizationRegionResolver(
    regions as unknown as RegionDataloader
  );

  beforeEach(() => regions.load.mockClear());

  it('loads the region of an organisation', async () => {
    await expect(
      resolver.region({ regionId: 'region-1' } as any)
    ).resolves.toEqual({ id: 'region-1' });
    expect(regions.load).toHaveBeenCalledWith('region-1');
  });

  it('is null without a region', async () => {
    await expect(resolver.region({ regionId: null } as any)).resolves.toBe(
      null
    );
    expect(regions.load).not.toHaveBeenCalled();
  });
});
