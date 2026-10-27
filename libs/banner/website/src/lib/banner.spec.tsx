import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockBanner,
  mockBannerAction,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BannerActionRole, FullBannerFragment } from '@wepublish/website/api';
import { BuilderBannerProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { Banner, buildBannerEmbedSrc } from './banner';
import { BANNER_STORAGE_KEY } from './collapse-banner';

const embedUrl = 'https://briefing.bajour.ch/mini?iframe=true';

const renderBanner = (
  primaryBanner: FullBannerFragment | null,
  props: Partial<BuilderBannerProps> = {}
) =>
  renderWithProviders(
    <Banner
      data={{ __typename: 'Query', primaryBanner }}
      loading={false}
      {...props}
    />
  );

const findBanner = async (banner: FullBannerFragment) => {
  await screen.findByText(banner.title);

  return document.querySelector('[data-banner]');
};

const minutesAgo = (minutes: number) =>
  String(new Date().getTime() - minutes * 60 * 1000);

describe('Banner', () => {
  beforeEach(() => {
    localStorage.removeItem(BANNER_STORAGE_KEY);
  });

  afterEach(() => {
    document.cookie =
      'auth.intended=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    vi.useRealTimers();
  });

  it('shows title, text, call to action and the actions', async () => {
    const banner = mockBanner({ cta: 'Werde Mitglied' });
    renderBanner(banner);

    expect(await screen.findByText(banner.title)).toBeInTheDocument();
    expect(screen.getByText(banner.text)).toBeInTheDocument();
    expect(screen.getByText('Werde Mitglied')).toBeInTheDocument();

    const primary = screen.getByRole('link', { name: 'Jetzt abonnieren' });
    expect(primary).toHaveAttribute('href', 'https://example.com/abo');
    expect(primary).toHaveAttribute('data-role', BannerActionRole.Primary);
    expect(screen.getByRole('link', { name: 'Später' })).toHaveAttribute(
      'data-role',
      BannerActionRole.Cancel
    );
  });

  it('shows the banner image as background', async () => {
    const banner = mockBanner();
    renderBanner(banner);

    await findBanner(banner);

    expect(
      document.querySelector(`[style*="${banner.image?.url}"]`)
    ).toBeInTheDocument();
  });

  it('remembers the current page when a primary action is clicked', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/a/some-article');
    const banner = mockBanner({
      actions: [mockBannerAction({ url: '/mitmachen' })],
    });
    renderBanner(banner);

    await user.click(
      await screen.findByRole('link', { name: 'Jetzt abonnieren' })
    );

    expect(document.cookie).toContain(
      `auth.intended=${encodeURIComponent('/a/some-article')}`
    );
    window.history.replaceState(null, '', '/');
  });

  it('hides the banner and remembers the time when the cancel action is clicked', async () => {
    const user = userEvent.setup();
    const banner = mockBanner();
    renderBanner(banner);

    await user.click(await screen.findByRole('link', { name: 'Später' }));

    expect(screen.queryByText(banner.title)).not.toBeInTheDocument();
    expect(Number(localStorage.getItem(BANNER_STORAGE_KEY))).toBeGreaterThan(0);
    expect(document.cookie).not.toContain('auth.intended');
  });

  it('hides the banner when the close button is clicked', async () => {
    const user = userEvent.setup();
    const banner = mockBanner();
    renderBanner(banner);

    await user.click(
      await screen.findByRole('button', { name: t('banner.close') })
    );

    expect(screen.queryByText(banner.title)).not.toBeInTheDocument();
    expect(localStorage.getItem(BANNER_STORAGE_KEY)).not.toBeNull();
  });

  it('collapses a collapsible banner instead of removing it', async () => {
    const user = userEvent.setup();
    const banner = mockBanner({ collapsible: true });
    renderBanner(banner);

    const element = await findBanner(banner);
    expect(element).toHaveAttribute('data-collapsed', 'false');

    await user.click(screen.getByRole('button', { name: t('banner.close') }));

    expect(element).toHaveAttribute('data-collapsed', 'true');
  });

  it('stays hidden when it was closed within hideForMinutes', async () => {
    localStorage.setItem(BANNER_STORAGE_KEY, minutesAgo(10));
    vi.useFakeTimers();
    const banner = mockBanner({ hideForMinutes: 60 });
    renderBanner(banner);

    act(() => vi.runAllTimers());

    expect(screen.queryByText(banner.title)).not.toBeInTheDocument();
  });

  it('shows again once hideForMinutes have passed since closing', async () => {
    localStorage.setItem(BANNER_STORAGE_KEY, minutesAgo(90));
    const banner = mockBanner({ hideForMinutes: 60 });
    renderBanner(banner);

    expect(await screen.findByText(banner.title)).toBeInTheDocument();
  });

  it('shows a recently closed collapsible banner collapsed', async () => {
    localStorage.setItem(BANNER_STORAGE_KEY, minutesAgo(10));
    const banner = mockBanner({ hideForMinutes: 60, collapsible: true });
    renderBanner(banner);

    expect(await findBanner(banner)).toHaveAttribute('data-collapsed', 'true');
  });

  it('waits for the configured delay before showing', () => {
    vi.useFakeTimers();
    const banner = mockBanner({ delay: 5 });
    renderBanner(banner);

    act(() => vi.advanceTimersByTime(4900));
    expect(screen.queryByText(banner.title)).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText(banner.title)).toBeInTheDocument();
  });

  it('renders the html instead of title and text', async () => {
    const banner = mockBanner({
      html: '<h2>Unterstütze uns</h2><p>Mit <strong>HTML</strong> gestaltet.</p>',
    });
    renderBanner(banner);

    expect(
      await screen.findByRole('heading', { name: 'Unterstütze uns' })
    ).toBeInTheDocument();
    expect(screen.queryByText(banner.text)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Jetzt abonnieren' })
    ).not.toBeInTheDocument();
  });

  it('embeds the url with the tags instead of the content', async () => {
    const banner = mockBanner({
      embedUrl,
      html: '<h2>Unterstütze uns</h2>',
    });
    renderBanner(banner, { tags: ['politik', 'basel'] });

    await waitFor(() =>
      expect(document.querySelector('[data-banner]')).toHaveAttribute(
        'data-embed',
        'true'
      )
    );
    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://briefing.bajour.ch/mini?iframe=true&tags=politik%2Cbasel'
    );
    expect(screen.queryByText(banner.title)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Unterstütze uns' })
    ).not.toBeInTheDocument();
  });

  it.each([
    ['loading', { loading: true }],
    ['failed', { error: new Error('Boom') }],
  ])('renders nothing while %s', (_, props) => {
    vi.useFakeTimers();
    const banner = mockBanner();
    const { container } = renderBanner(banner, props);

    act(() => vi.runAllTimers());

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without a primary banner', () => {
    vi.useFakeTimers();
    const { container } = renderBanner(null);

    act(() => vi.runAllTimers());

    expect(container).toBeEmptyDOMElement();
  });
});

describe('buildBannerEmbedSrc', () => {
  it('adds the tags as query parameter', () => {
    expect(
      buildBannerEmbedSrc('https://example.com/embed?a=1', ['x', 'y'])
    ).toBe('https://example.com/embed?a=1&tags=x%2Cy');
  });

  it('keeps the url without tags', () => {
    expect(buildBannerEmbedSrc('https://example.com/embed', [])).toBe(
      'https://example.com/embed'
    );
  });

  it('returns an invalid url unchanged', () => {
    expect(buildBannerEmbedSrc('not a url', ['x'])).toBe('not a url');
  });
});
