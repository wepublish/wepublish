import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockBreakBlock,
  mockNavigations,
  mockRichTextParagraph,
  mockTitleBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
  setTestViewportWidth,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { t } from 'i18next';

import deOverriden from './locales/deOverriden.json';
import { wntiTenant } from './wnti-tenant';

const SampleBlocks = ({ blocks }: { blocks: FullBlockFragment[] }) => {
  const {
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <Blocks
      blocks={blocks}
      type="Page"
    />
  );
};

const SampleNavbar = () => {
  const { Navbar } = useWebsiteBuilder();

  return (
    <Navbar
      data={{ __typename: 'Query', navigations: mockNavigations() }}
      loading={false}
      slug="main"
      categorySlugs={[['categories', 'about-us']]}
      headerSlug="header"
      iconSlug="icons"
      hasRunningSubscription={false}
      hasUnpaidInvoices={false}
    />
  );
};

const renderBlocks = (blocks: FullBlockFragment[]) =>
  renderWithProviders(<SampleBlocks blocks={blocks} />, { tenant: wntiTenant });

const backgroundsOf = (element: HTMLElement | null): string[] =>
  element ?
    [
      getComputedStyle(element).backgroundColor,
      ...backgroundsOf(element.parentElement),
    ]
  : [];

describe('WNTI tenant', () => {
  beforeAll(() => applyTenantTranslations(wntiTenant));
  afterAll(() => resetTranslations());

  it('invites readers to become members in the navbar', () => {
    renderWithProviders(<SampleNavbar />, { tenant: wntiTenant });

    expect(
      screen.getAllByRole('link', { name: deOverriden.navbar.subscribe })[0]
    ).toBeInTheDocument();
  });

  it('paints break blocks in the accent colour', () => {
    renderBlocks([mockBreakBlock({ text: 'WNTI braucht dich' })]);

    expect(backgroundsOf(screen.getByText('WNTI braucht dich'))).toContain(
      wntiTenant.createTheme().palette.accent.main
    );
  });

  it('renders a context box break block without its icon and expands it', async () => {
    const user = userEvent.setup();

    const { container } = renderBlocks([
      mockBreakBlock({
        blockStyle: 'ContextBox',
        text: 'Gut zu wissen',
        richText: mockRichTextParagraph('Der Hintergrund zur Geschichte'),
      }),
    ]);

    expect(screen.getByText('Gut zu wissen')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeVisible();

    await user.click(
      screen.getByRole('button', { name: t('contextBox.readMore') })
    );

    expect(
      screen.getByRole('button', { name: t('contextBox.readLess') })
    ).toBeInTheDocument();
  });

  it('shrinks titles to 32px on phones', () => {
    setTestViewportWidth(400);

    renderBlocks([mockTitleBlock({ title: 'Was Winterthur nachts bewegt' })]);

    expect(
      getComputedStyle(
        screen.getByRole('heading', { name: 'Was Winterthur nachts bewegt' })
      ).fontSize
    ).toBe('32px');
  });

  it('keeps the theme title size on desktop', () => {
    renderBlocks([mockTitleBlock({ title: 'Was Winterthur nachts bewegt' })]);

    expect(
      getComputedStyle(
        screen.getByRole('heading', { name: 'Was Winterthur nachts bewegt' })
      ).fontSize
    ).not.toBe('32px');
  });
});
