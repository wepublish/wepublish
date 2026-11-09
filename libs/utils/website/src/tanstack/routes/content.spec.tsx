import { homePageRoute, pageByIdRoute, pageBySlugRoute } from './content';

const loadPage = vi.fn();

vi.mock('../pages/page-page', () => ({
  loadPage: (...args: unknown[]) => loadPage(...args),
}));
vi.mock('../apollo', () => ({ mergeApolloCache: vi.fn() }));
vi.mock('@wepublish/page/website', () => ({ PageContainer: () => null }));
vi.mock('../pages/404-page', () => ({ FourOhFourPage: () => null }));

const shell = { showNavigation: false, showFooter: true };

const context = () => ({ apolloClient: {} });

/**
 * `app.tsx` decides whether to render the navigation and the footer from the
 * `shell` the deepest matched route returned. Drop it from a page route and
 * the CMS `hideHeader`/`hideFooter` flags silently stop working — no crash,
 * nothing else to notice it.
 */
describe('page route loaders', () => {
  beforeEach(() => {
    loadPage.mockReset();
    loadPage.mockResolvedValue({ apollo: undefined, notFound: false, shell });
  });

  it('returns the shell from the home page loader', async () => {
    const data = await homePageRoute().loader({ context: context() } as never);

    expect(data).toMatchObject({ shell });
  });

  it('returns the shell from the page-by-slug loader', async () => {
    const data = await pageBySlugRoute().loader({
      context: context(),
      params: { slug: 'impressum' },
    } as never);

    expect(data).toMatchObject({ shell });
  });

  it('returns the shell from the page-by-id loader', async () => {
    const data = await pageByIdRoute().loader({
      context: context(),
      params: { id: 'abc' },
    } as never);

    expect(data).toMatchObject({ shell });
  });

  it('asks for the home page by empty slug, as `pages/index.tsx` did', async () => {
    await homePageRoute().loader({ context: context() } as never);

    expect(loadPage).toHaveBeenCalledWith({ data: { slug: '' } });
  });
});
