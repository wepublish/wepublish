import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockBreakBlock,
  mockNavigations,
  mockOperation,
  mockPage,
  mockPageRevision,
  mockRichTextBlock,
  mockRichTextParagraph,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment, PageDocument } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import logo from './assets/logo_reflekt.svg';
import { staticImageSrc } from './assets/static-image';
import { ReflektBlockStyles } from './components/block-styles/reflekt-block-styles';
import deOverridden from './locales/deOverridden.json';
import { reflektTenant } from './reflekt-tenant';

const navigation = {
  data: { __typename: 'Query' as const, navigations: mockNavigations() },
  loading: false,
  slug: 'main',
  categorySlugs: [['categories', 'about']],
};

const footerPageMock = mockOperation(PageDocument, {
  variables: { slug: 'footer' },
  data: {
    __typename: 'Query',
    page: mockPage({
      slug: 'footer',
      latest: mockPageRevision({
        blocks: [
          mockRichTextBlock({
            richText: mockRichTextParagraph(
              'Reflekt ist ein Recherchekollektiv'
            ),
          }),
        ],
      }),
    }),
  },
});

const TenantPage = ({ blocks }: { blocks: FullBlockFragment[] }) => {
  const {
    Navbar,
    Footer,
    elements: { Button },
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <>
      <Navbar
        {...navigation}
        headerSlug="header"
        hasRunningSubscription={false}
        hasUnpaidInvoices={false}
      />

      <Button variant="contained">Primary</Button>

      <Blocks
        blocks={blocks}
        type="Page"
      />

      <Footer
        {...navigation}
        wepublishLogo="hidden"
      />
    </>
  );
};

const renderTenantPage = (blocks: FullBlockFragment[] = []) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: reflektTenant,
    mocks: [footerPageMock],
  });

const theme = reflektTenant.createTheme();

describe('reflekt tenant', () => {
  beforeAll(() => applyTenantTranslations(reflektTenant));
  afterAll(() => resetTranslations());

  it('sets buttons in Roboto Mono on the reflekt primary colour', () => {
    renderTenantPage();

    const button = screen.getByRole('button', { name: 'Primary' });

    expect(getComputedStyle(button).fontFamily).toContain('Roboto Mono');
    expect(getComputedStyle(button).backgroundColor).toBe(
      theme.palette.primary.main
    );
  });

  it('shows the logo from the tenant library', () => {
    renderTenantPage();

    expect(screen.getByRole('img', { name: 'Reflekt Logo' })).toHaveAttribute(
      'src',
      staticImageSrc(logo)
    );
  });

  it('fills the footer with the content of the footer page', async () => {
    renderTenantPage();

    expect(
      await screen.findByText('Reflekt ist ein Recherchekollektiv')
    ).toBeInTheDocument();
  });

  it('expands collapsible content break blocks on click', async () => {
    const user = userEvent.setup();

    renderTenantPage([
      mockBreakBlock({
        blockStyle: ReflektBlockStyles.CollapsibleContent,
        text: 'Was ist Reflekt?',
        richText: mockRichTextParagraph('Ein unabhängiges Recherchekollektiv'),
      }),
    ]);

    const summary = screen.getByRole('button', { name: 'Was ist Reflekt?' });

    expect(summary).toHaveAttribute('aria-expanded', 'false');

    await user.click(summary);

    expect(summary).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText('Ein unabhängiges Recherchekollektiv')
    ).toBeVisible();
  });

  it('asks members without a membership to support reflekt', () => {
    const SubscriptionPage = () => {
      const { SubscriptionList } = useWebsiteBuilder();

      return (
        <SubscriptionList
          data={{ __typename: 'Query', userSubscriptions: [] }}
          loading={false}
          error={undefined}
          invoices={{ data: undefined, loading: false, error: undefined }}
          subscribeUrl="/mitmachen"
          onCancel={vi.fn()}
          onExtend={vi.fn()}
        />
      );
    };

    renderWithProviders(<SubscriptionPage />, { tenant: reflektTenant });

    expect(
      screen.getByText(deOverridden.subscription.noActiveSubscriptions, {
        exact: false,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: deOverridden.subscription.subscribeNow,
      })
    ).toHaveAttribute('href', '/mitmachen');
  });
});
