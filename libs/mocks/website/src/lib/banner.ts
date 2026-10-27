import {
  BannerActionRole,
  FullBannerActionFragment,
  FullBannerFragment,
} from '@wepublish/website/api';
import { mockImage } from './image';
import { faker } from './faker';
import { definedOnly } from './overrides';

export const mockBannerAction = (
  overrides: Partial<FullBannerActionFragment> = {}
): FullBannerActionFragment => ({
  __typename: 'BannerAction',
  id: faker.string.nanoid(),
  label: 'Jetzt abonnieren',
  url: 'https://example.com/abo',
  style: 'primary',
  role: BannerActionRole.Primary,
  ...definedOnly(overrides),
});

export const mockBanner = ({
  image = mockImage(),
  actions = [
    mockBannerAction(),
    mockBannerAction({
      label: 'Später',
      url: 'https://example.com/later',
      style: 'secondary',
      role: BannerActionRole.Cancel,
    }),
  ],
  ...overrides
}: Partial<FullBannerFragment> = {}): FullBannerFragment => ({
  __typename: 'Banner',
  id: faker.string.nanoid(),
  title: 'Unterstütze unabhängigen Journalismus',
  text: 'Mit einem Abo ermöglichst du unsere Arbeit.',
  cta: 'Jetzt abonnieren',
  collapsible: false,
  html: null,
  embedUrl: null,
  delay: 0,
  hideForMinutes: 0,
  showOnArticles: true,
  showOnPages: [],
  image,
  actions,
  ...definedOnly(overrides),
});
