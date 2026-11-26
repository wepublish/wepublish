import { renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemberPlanPicker,
  usePaymentText,
} from '@wepublish/membership/website';
import {
  applyTenantTranslations,
  mockArticleTeaser,
  mockMemberPlan,
  mockTeaserSlotsBlock,
  mockTitleBlock,
  renderWithProviders,
  resetTranslations,
  setTestViewportWidth,
} from '@wepublish/mocks/website';
import {
  Currency,
  FullBlockFragment,
  PaymentPeriodicity,
  ProductType,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { GanzGrazBlockStyles } from './components/block-styles/ganzgraz-block-styles';
import { ganzgrazTenant } from './ganzgraz-tenant';
import deOverriden from './locales/deOverriden.json';

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

const TransactionFee = ({
  onChange,
}: {
  onChange: (value: boolean) => void;
}) => {
  const { TransactionFee } = useWebsiteBuilder();

  return <TransactionFee onChange={onChange} />;
};

describe('ganzgraz tenant', () => {
  beforeAll(() => applyTenantTranslations(ganzgrazTenant));
  afterAll(() => resetTranslations());

  it('asks to cover the transaction fees in the ganzgraz wording', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<TransactionFee onChange={onChange} />, {
      tenant: ganzgrazTenant,
    });

    await user.click(
      screen.getByRole('checkbox', {
        name: deOverriden.subscribe.transactionFees,
      })
    );

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it.each([
    [true, PaymentPeriodicity.Yearly, 'Jährlich für CHF 60.- unterstützen'],
    [true, PaymentPeriodicity.Monthly, 'Monatlich für CHF 5.- unterstützen'],
    [false, PaymentPeriodicity.Yearly, '1 Jahr für CHF 60.- unterstützen'],
  ])(
    'words the subscribe button as "unterstützen" (autoRenew %s, %s)',
    (autoRenew, paymentPeriodicity, expected) => {
      const { result } = renderHook(() =>
        usePaymentText({
          autoRenew,
          extendable: true,
          memberPlan: 'Mitgliedschaft',
          productType: ProductType.Subscription,
          paymentPeriodicity,
          monthlyAmount: 500,
          currency: Currency.Chf,
          siteTitle: 'ganzgraz',
          locale: 'de-CH',
        })
      );

      expect(result.current.replace(/\s/g, ' ')).toBe(expected);
    }
  );

  it('shows only the plan names in the subscription grid, without a price hint', () => {
    renderWithProviders(
      <MemberPlanPicker
        memberPlans={[
          mockMemberPlan({ name: 'Mitgliedschaft' }),
          mockMemberPlan({ name: 'Gönnerschaft' }),
        ]}
        onChange={vi.fn()}
      />,
      { tenant: ganzgrazTenant }
    );

    expect(
      screen.getByLabelText('Mitgliedschaft', { exact: false })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Gönnerschaft', { exact: false })
    ).toBeInTheDocument();
    expect(screen.queryAllByText(/CHF|Gratis|pro (Monat|Jahr)/)).toHaveLength(
      0
    );
  });

  it.each([
    [400, '24px'],
    [1024, '36px'],
  ])('sets titles at a %ipx wide viewport in %s', (width, fontSize) => {
    setTestViewportWidth(width);

    renderWithProviders(
      <SampleBlocks
        blocks={[mockTitleBlock({ title: 'Was Graz diese Woche bewegt' })]}
      />,
      { tenant: ganzgrazTenant }
    );

    expect(
      getComputedStyle(
        screen.getByRole('heading', { name: 'Was Graz diese Woche bewegt' })
      ).fontSize
    ).toBe(fontSize);
  });

  it('renders the logo wall title in League Spartan with all partner teasers', () => {
    renderWithProviders(
      <SampleBlocks
        blocks={[
          mockTeaserSlotsBlock({
            blockStyle: GanzGrazBlockStyles.LogoWall,
            title: 'Unsere Partner',
            teasers: [
              mockArticleTeaser({ title: 'Partner A' }),
              mockArticleTeaser({ title: 'Partner B' }),
            ],
          }),
        ]}
      />,
      { tenant: ganzgrazTenant }
    );

    expect(
      getComputedStyle(screen.getByText('Unsere Partner')).fontFamily
    ).toContain('League Spartan');
    expect(screen.getByText('Partner A')).toBeInTheDocument();
    expect(screen.getByText('Partner B')).toBeInTheDocument();
  });
});
