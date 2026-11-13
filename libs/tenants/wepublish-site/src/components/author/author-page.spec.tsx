import { screen } from '@testing-library/react';
import {
  applyTenantTranslations,
  mockArticle,
  mockArticleRevision,
  mockAuthor,
  mockAuthorLink,
  mockImage,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullAuthorFragment } from '@wepublish/website/api';

import { wepublishSiteTenant } from '../../wepublish-site-tenant';
import { WepAuthorPage } from './author-page';

const author = mockAuthor({
  name: 'Stephan Agnolazza',
  jobTitle: 'Senior Advisor, Vaduz',
  image: mockImage({ title: 'Porträt Stephan Agnolazza' }),
  bio: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'In Zeiten von Sparrunden.' }],
      },
    ],
  } as FullAuthorFragment['bio'],
  links: [
    mockAuthorLink({ title: 'LinkedIn', url: 'https://linkedin.com/in/sa' }),
    mockAuthorLink({
      title: 'stephanagnolazza.com',
      url: 'https://stephanagnolazza.com',
    }),
  ],
});

const articles = (count: number, locale: string) =>
  Array.from({ length: count }, (_, index) =>
    mockArticle({
      slug: `beitrag-${index + 1}-${locale}`,
      url: `https://wepublish.ch/a/beitrag-${index + 1}-${locale}`,
      latest: mockArticleRevision({
        blocks: [],
        title: `Beitrag ${index + 1} (${locale})`,
      }),
    })
  );

const renderAuthorPage = ({
  page,
  authorArticles = [...articles(11, 'de'), ...articles(2, 'fr')],
}: { page?: number; authorArticles?: ReturnType<typeof articles> } = {}) =>
  renderWithProviders(
    <WepAuthorPage
      author={author}
      articles={authorArticles}
      page={page}
      onPageChange={() => undefined}
    />,
    { tenant: wepublishSiteTenant, router: { locale: 'de' } }
  );

describe('author page', () => {
  beforeAll(() => applyTenantTranslations(wepublishSiteTenant));
  afterAll(() => resetTranslations());

  it('opens with the job title above the name', () => {
    renderAuthorPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Stephan Agnolazza' })
    ).toBeInTheDocument();
    expect(screen.getByText('Senior Advisor, Vaduz')).toBeInTheDocument();
  });

  it('shows the portrait and the bio', () => {
    renderAuthorPage();

    expect(screen.getByText('In Zeiten von Sparrunden.')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Porträt Stephan Agnolazza' })
    ).toBeInTheDocument();
  });

  it('shows every link as a button with its title', () => {
    renderAuthorPage();

    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/sa'
    );
    expect(
      screen.getByRole('link', { name: 'stephanagnolazza.com' })
    ).toHaveAttribute('href', 'https://stephanagnolazza.com');
  });

  it('lists the articles of the current language, nine per page', () => {
    renderAuthorPage();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Beiträge von Stephan Agnolazza',
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(9);
    expect(
      screen.queryByRole('article', { name: 'Beitrag 1 (fr)' })
    ).not.toBeInTheDocument();
  });

  it('shows the rest on the next page', () => {
    renderAuthorPage({ page: 2 });

    expect(
      screen.getAllByRole('article').map(article => article.textContent)
    ).toEqual([
      expect.stringContaining('Beitrag 10 (de)'),
      expect.stringContaining('Beitrag 11 (de)'),
    ]);
    expect(
      screen.getByRole('navigation', { name: /pagination/i })
    ).toBeInTheDocument();
  });

  it('leaves out the articles without any in the current language', () => {
    renderAuthorPage({ authorArticles: articles(2, 'fr') });

    expect(
      screen.queryByRole('heading', { name: /Beiträge von/ })
    ).not.toBeInTheDocument();
  });
});
