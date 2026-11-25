import { screen, waitFor } from '@testing-library/react';
import {
  mockChallengeQuery,
  mockOperation,
  mockPage,
  mockPageRevision,
  mockPrimaryBannerQuery,
  mockSettingListQuery,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { PageDocument, PageQueryVariables } from '@wepublish/website/api';
import { usePageShell } from '@wepublish/website/builder';
import { PageContainer } from './page-container';

const page = mockPage({
  slug: 'about-us',
  latest: mockPageRevision({
    blocks: [mockTitleBlock({ title: 'About us' })],
  }),
});

const providerMocks = () => [
  mockPrimaryBannerQuery(),
  mockSettingListQuery(),
  mockChallengeQuery(),
];

const pageQuery = (variables: PageQueryVariables) =>
  mockOperation(PageDocument, {
    variables,
    data: { __typename: 'Query', page },
  });

const pageTitle = () =>
  screen.findByRole('heading', { level: 1, name: 'About us' });

describe('PageContainer', () => {
  it('loads the page by id', async () => {
    renderWithProviders(<PageContainer id={page.id} />, {
      mocks: [pageQuery({ id: page.id }), ...providerMocks()],
    });

    expect(await pageTitle()).toBeInTheDocument();
  });

  it('loads the page by slug', async () => {
    renderWithProviders(<PageContainer slug="about-us" />, {
      mocks: [pageQuery({ slug: 'about-us' }), ...providerMocks()],
    });

    expect(await pageTitle()).toBeInTheDocument();
  });

  it('tells the reader the page is not available when loading it fails', async () => {
    renderWithProviders(<PageContainer id="missing" />, {
      mocks: [
        mockOperation(PageDocument, {
          variables: { id: 'missing' },
          errors: [{ message: 'Page not found' }],
        }),
        ...providerMocks(),
      ],
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: /nicht verfügbar/ })
    ).toBeInTheDocument();
  });

  it('renders its children after the page', async () => {
    renderWithProviders(
      <PageContainer id={page.id}>
        <p>Comments</p>
      </PageContainer>,
      { mocks: [pageQuery({ id: page.id }), ...providerMocks()] }
    );

    await pageTitle();

    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  it('hands the hide header/footer flags of the loaded page to the app shell', async () => {
    const shell: { current?: ReturnType<typeof usePageShell> } = {};
    const ShellProbe = () => {
      shell.current = usePageShell();

      return null;
    };

    const hiding = { ...page, hideHeader: true, hideFooter: true };

    renderWithProviders(
      <>
        <ShellProbe />
        <PageContainer id={page.id} />
      </>,
      {
        mocks: [
          mockOperation(PageDocument, {
            variables: { id: page.id },
            data: { __typename: 'Query', page: hiding },
          }),
          ...providerMocks(),
        ],
      }
    );

    expect(shell.current).toBeUndefined();

    await pageTitle();

    await waitFor(() =>
      expect(shell.current).toEqual({ hideHeader: true, hideFooter: true })
    );
  });
});
