import { FullNavigationFragment } from '@wepublish/website/api';
import { faker } from './faker';
import { definedOnly } from './overrides';

type NavigationLink = FullNavigationFragment['links'][number];
type PageNavigationLink = Extract<
  NavigationLink,
  { __typename: 'PageNavigationLink' }
>;
type ArticleNavigationLink = Extract<
  NavigationLink,
  { __typename: 'ArticleNavigationLink' }
>;
type ExternalNavigationLink = Extract<
  NavigationLink,
  { __typename: 'ExternalNavigationLink' }
>;

export const mockPageNavigationLink = (
  overrides: Partial<PageNavigationLink> = {}
): PageNavigationLink => ({
  __typename: 'PageNavigationLink',
  label: 'Page',
  page: { __typename: 'Page', url: '/page' },
  ...definedOnly(overrides),
});

export const mockArticleNavigationLink = (
  overrides: Partial<ArticleNavigationLink> = {}
): ArticleNavigationLink => ({
  __typename: 'ArticleNavigationLink',
  label: 'Article',
  article: { __typename: 'Article', url: '/a/article' },
  ...definedOnly(overrides),
});

export const mockExternalNavigationLink = (
  overrides: Partial<ExternalNavigationLink> = {}
): ExternalNavigationLink => ({
  __typename: 'ExternalNavigationLink',
  label: 'External',
  url: 'https://example.com',
  ...definedOnly(overrides),
});

export const mockNavigation = ({
  links = [
    mockPageNavigationLink(),
    mockArticleNavigationLink(),
    mockExternalNavigationLink(),
  ],
  ...overrides
}: Partial<FullNavigationFragment> = {}): FullNavigationFragment => ({
  __typename: 'Navigation',
  id: faker.string.nanoid(),
  key: 'main',
  name: 'Main',
  links,
  ...definedOnly(overrides),
});

export const mockNavigations = (): FullNavigationFragment[] => [
  mockNavigation({
    key: 'main',
    name: 'Main',
    links: [
      mockPageNavigationLink({
        label: 'Gesellschaft',
        page: { __typename: 'Page', url: '/gesellschaft' },
      }),
      mockArticleNavigationLink({
        label: 'Politik',
        article: { __typename: 'Article', url: '/a/politik' },
      }),
      mockArticleNavigationLink({
        label: 'Kultur',
        article: { __typename: 'Article', url: '/a/kultur' },
      }),
      mockExternalNavigationLink({
        label: 'Was lauft?',
        url: 'https://example.com/agenda',
      }),
    ],
  }),
  mockNavigation({
    key: 'categories',
    name: 'Kategorien',
    links: [
      mockPageNavigationLink({
        label: 'Mobilität',
        page: { __typename: 'Page', url: '/mobilitaet' },
      }),
      mockArticleNavigationLink({
        label: 'Bildung',
        article: { __typename: 'Article', url: '/a/bildung' },
      }),
      mockExternalNavigationLink({
        label: 'Denkmal.org',
        url: 'https://example.com/denkmal',
      }),
    ],
  }),
  mockNavigation({
    key: 'about',
    name: 'Über Uns',
    links: [
      mockPageNavigationLink({
        label: 'Team',
        page: { __typename: 'Page', url: '/team' },
      }),
      mockPageNavigationLink({
        label: 'Kontakt',
        page: { __typename: 'Page', url: '/kontakt' },
      }),
      mockPageNavigationLink({
        label: 'Jobs',
        page: { __typename: 'Page', url: '/jobs' },
      }),
    ],
  }),
];
