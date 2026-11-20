import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  PaymentPeriodicity,
  ProductType,
  SubscribeBlockRenderLayout,
} from '@wepublish/editor/api';
import { SetStateAction, useState } from 'react';

import { SubscribeBlock } from './subscribeBlock';
import { SubscribeBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.amount ? `${key} ${options.amount}` : key,
    i18n: { language: 'en' },
  }),
}));

const features = vi.hoisted(() => ({ giftCodes: false }));

vi.mock('../featureContext', () => ({
  useFeature: (feature: string) =>
    feature === 'gift-codes' && features.giftCodes,
}));

vi.mock('../atoms/page/selectPage', () => ({
  SelectPage: ({
    label,
    selectedPage,
    setSelectedPage,
  }: {
    label: string;
    selectedPage?: string | null;
    setSelectedPage: (page: string | null) => void;
  }) => (
    <input
      aria-label={label}
      value={selectedPage ?? ''}
      onChange={event => setSelectedPage(event.target.value || null)}
    />
  ),
}));

const plan = (
  id: string,
  name: string,
  amountMin: number,
  amountTarget: number | null = null,
  amountMax: number | null = null
) => ({
  id,
  name,
  currency: 'CHF',
  productType: ProductType.Subscription,
  defaultPaymentPeriodicity: PaymentPeriodicity.Monthly,
  periodicityPricing: [
    {
      periodicity: PaymentPeriodicity.Monthly,
      amountMin,
      amountTarget,
      amountMax,
    },
  ],
  availablePaymentMethods: [
    { paymentPeriodicities: [PaymentPeriodicity.Monthly] },
  ],
});

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    loading: false,
    data: {
      memberPlans: {
        nodes: [
          plan('small', 'Kleines Abo', 500),
          plan('big', 'Grosse Gönnerschaft', 2500, 3000, 10000),
        ],
      },
    },
  }),
}));

const renderSetting = (
  memberPlanId: string,
  isDefault: boolean
): SubscribeBlockValue['memberPlanRenderSettings'][number] => ({
  __typename: 'SubscribeBlockMemberPlanRenderSetting',
  memberPlanId,
  isDefault,
  layout: {
    __typename: 'SubscribeBlockLayoutSliderConfig',
    type: SubscribeBlockRenderLayout.Slider,
    showInput: false,
  },
});

const initialValue = (
  overrides: Partial<SubscribeBlockValue> = {}
): SubscribeBlockValue => ({
  memberPlanIds: ['small', 'big'],
  memberPlanRenderSettings: [
    renderSetting('small', true),
    renderSetting('big', false),
  ],
  fields: [],
  showGoodies: false,
  showDiscountCodes: false,
  goodieMinValue: null,
  goodieMinValueAppliesToUpgrade: false,
  hideRepeatGoodieOnUpgrade: false,
  ...overrides,
});

const renderedValue = vi.fn<(value: SubscribeBlockValue) => void>();

const latest = () => renderedValue.mock.lastCall![0];

const Harness = ({ value: start }: { value: SubscribeBlockValue }) => {
  const [value, setValue] = useState(start);
  renderedValue(value);

  return (
    <ThemeProvider theme={theme}>
      <SubscribeBlock
        value={value}
        onChange={(next: SetStateAction<SubscribeBlockValue>) => setValue(next)}
      />
    </ThemeProvider>
  );
};

const planRow = (name: string) =>
  screen.getByRole('listitem', { name: new RegExp(name) });

describe('SubscribeBlock', () => {
  it('offers every amount layout as a labelled segmented choice', () => {
    render(<Harness value={initialValue()} />);

    const layouts = within(planRow('Kleines Abo')).getByRole('group', {
      name: 'blocks.subscribe.amountLayout',
    });

    expect(
      within(layouts).getByRole('button', {
        name: 'blocks.subscribe.renderLayouts.Slider',
      })
    ).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(
      within(layouts).getByRole('button', {
        name: 'blocks.subscribe.renderLayouts.Picker',
      })
    );

    expect(latest().memberPlanRenderSettings[0].layout.type).toBe(
      SubscribeBlockRenderLayout.Picker
    );
  });

  it('picks the preselected plan with a radio', () => {
    render(<Harness value={initialValue()} />);

    const bigDefault = within(planRow('Grosse Gönnerschaft')).getByRole(
      'radio',
      { name: /blocks.subscribe.defaultPlanLabel/ }
    );

    expect(bigDefault).not.toBeChecked();

    fireEvent.click(bigDefault);

    expect(
      latest().memberPlanRenderSettings.map(({ isDefault }) => isDefault)
    ).toEqual([false, true]);
  });

  it('summarises the price range and target of a plan', () => {
    render(<Harness value={initialValue()} />);

    expect(
      within(planRow('Kleines Abo')).getByText(/CHF 5\.00/)
    ).toBeInTheDocument();
    expect(
      within(planRow('Grosse Gönnerschaft')).getByText(
        /CHF 25\.00–100\.00 .*blocks\.subscribe\.planAmountTarget 30\.00/
      )
    ).toBeInTheDocument();
  });

  it('only reveals goodie options once goodies are switched on', () => {
    render(<Harness value={initialValue()} />);

    expect(
      screen.queryByText('blocks.subscribe.hideRepeatGoodieOnUpgrade')
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'blocks.subscribe.showGoodies' })
    );

    expect(latest().showGoodies).toBe(true);
    expect(
      screen.getByText('blocks.subscribe.hideRepeatGoodieOnUpgrade')
    ).toBeInTheDocument();
  });

  it('turns typed tile amounts into tags on space and comma', () => {
    render(<Harness value={initialValue()} />);

    fireEvent.click(
      within(planRow('Kleines Abo')).getByRole('button', {
        name: 'blocks.subscribe.renderLayouts.Picker',
      })
    );

    const input = within(planRow('Kleines Abo')).getByRole('combobox');

    fireEvent.change(input, { target: { value: '10 ' } });
    fireEvent.change(input, { target: { value: '15,' } });
    fireEvent.change(input, { target: { value: 'abc, 7.5,20' } });

    expect(
      within(planRow('Kleines Abo')).getAllByRole('button', {
        name: /^(10|15|7\.50)$/,
      })
    ).toHaveLength(3);
    expect(input).toHaveValue('20');

    const layout = latest().memberPlanRenderSettings[0].layout as {
      valuesByPeriodicity?: Array<{ periodicity: string; values: number[] }>;
    };

    expect(layout.valuesByPeriodicity).toEqual([
      { periodicity: PaymentPeriodicity.Monthly, values: [750, 1000, 1500] },
    ]);
  });

  it('names the member plan and input field pickers after their sections', () => {
    render(<Harness value={initialValue()} />);

    expect(
      screen.getByRole('combobox', {
        name: 'blocks.subscribe.selectMemberPlans',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'blocks.subscribe.selectFields' })
    ).toBeInTheDocument();
  });

  it('labels the discount code checkbox', () => {
    render(<Harness value={initialValue()} />);

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'blocks.subscribe.showDiscountCodes',
      })
    );

    expect(latest().showDiscountCodes).toBe(true);
  });

  describe('gift code redemption', () => {
    afterEach(() => {
      features.giftCodes = false;
    });

    it('is not offered without the gift codes feature', () => {
      render(<Harness value={initialValue()} />);

      expect(
        screen.queryByRole('checkbox', {
          name: 'blocks.subscribe.showGiftCodeRedemption',
        })
      ).not.toBeInTheDocument();
    });

    it('asks for the redemption page once switched on', () => {
      features.giftCodes = true;
      render(<Harness value={initialValue()} />);

      expect(
        screen.queryByRole('textbox', {
          name: 'blocks.subscribe.giftCodeRedemptionPage',
        })
      ).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('checkbox', {
          name: 'blocks.subscribe.showGiftCodeRedemption',
        })
      );

      expect(latest().showGiftCodeRedemption).toBe(true);

      fireEvent.change(
        screen.getByRole('textbox', {
          name: 'blocks.subscribe.giftCodeRedemptionPage',
        }),
        { target: { value: 'page-1' } }
      );

      expect(latest().giftCodeRedemptionPageId).toBe('page-1');

      fireEvent.change(
        screen.getByRole('textbox', {
          name: 'blocks.subscribe.giftCodeRedemptionLinkText',
        }),
        { target: { value: 'Geschenk erhalten? Hier einlösen.' } }
      );

      expect(latest().giftCodeRedemptionLinkText).toBe(
        'Geschenk erhalten? Hier einlösen.'
      );
    });

    it('forgets the redemption page and link text when switched off', () => {
      features.giftCodes = true;
      render(
        <Harness
          value={initialValue({
            showGiftCodeRedemption: true,
            giftCodeRedemptionPageId: 'page-1',
            giftCodeRedemptionLinkText: 'Einlösen',
          })}
        />
      );

      fireEvent.click(
        screen.getByRole('checkbox', {
          name: 'blocks.subscribe.showGiftCodeRedemption',
        })
      );

      expect(latest()).toMatchObject({
        showGiftCodeRedemption: false,
        giftCodeRedemptionPageId: null,
        giftCodeRedemptionLinkText: null,
      });
    });
  });
});
