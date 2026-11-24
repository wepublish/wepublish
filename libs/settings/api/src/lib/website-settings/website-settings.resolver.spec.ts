import type { WebsiteSettings } from '@prisma/client';
import { WebsiteSettingsResolver } from './website-settings.resolver';
import { WebsiteSettingsService } from './website-settings.service';

describe('WebsiteSettingsResolver', () => {
  const resolver = new WebsiteSettingsResolver({} as WebsiteSettingsService);

  it('exposes the search params Umami must not receive', () => {
    const analytics = resolver.analytics({
      analyticsUmamiEnabled: true,
      analyticsUmamiId: '4f4c5ea1-0000-4000-8000-000000000000',
      analyticsUmamiExcludedSearchParams: ['mail', 'firstName'],
    } as WebsiteSettings);

    expect(analytics.umami).toEqual({
      enabled: true,
      key: '4f4c5ea1-0000-4000-8000-000000000000',
      excludedSearchParams: ['mail', 'firstName'],
    });
  });
});
