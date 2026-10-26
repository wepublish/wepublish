import { EventTaxonomyResolver } from './event-taxonomy.resolver';
import { EventTaxonomyService } from './event-taxonomy.service';

const handler = (name: string) =>
  (EventTaxonomyResolver.prototype as any)[name];

describe('EventTaxonomyResolver', () => {
  it.each(['eventRegions', 'eventAudiences', 'eventAffiliations'])(
    '%s is public',
    name => {
      expect(Reflect.getMetadata('public', handler(name))).toBe(true);
    }
  );

  it('passes the session to the region query and nothing else to the others', async () => {
    const service = {
      getRegions: vi.fn().mockResolvedValue(['region']),
      getAudiences: vi.fn().mockResolvedValue(['audience']),
      getAffiliations: vi.fn().mockResolvedValue(['affiliation']),
    };
    const resolver = new EventTaxonomyResolver(
      service as unknown as EventTaxonomyService
    );
    const session = { type: 'user' } as any;

    await expect(resolver.eventRegions(session)).resolves.toEqual(['region']);
    await expect(resolver.eventAudiences()).resolves.toEqual(['audience']);
    await expect(resolver.eventAffiliations()).resolves.toEqual([
      'affiliation',
    ]);
    expect(service.getRegions).toHaveBeenCalledWith(session);
  });
});
