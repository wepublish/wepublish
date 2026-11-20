import '@testing-library/jest-dom/vitest';
import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { PaymentPeriodicity } from '@wepublish/editor/api';
import { ReactNode, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';

import { MemberPlanForm } from './memberplan-form';
import {
  EMPTY_MEMBER_PLAN,
  MemberPlanFormValues,
  prunePricing,
} from './memberplan-schema';

// the medium's features in We.Publish One, per test
const features = new Set<string>();

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useFeature: (feature: string) => features.has(feature),
  RichTextBlock: (props: { 'aria-labelledby'?: string }) => (
    <div
      role="textbox"
      aria-labelledby={props['aria-labelledby']}
    />
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  // stands in for the markup-aware rendering: names the key and the tags it allows
  Trans: ({
    i18nKey,
    components,
  }: {
    i18nKey: string;
    components?: Record<string, unknown>;
  }) => (
    <span
      data-trans={i18nKey}
      data-tags={Object.keys(components ?? {}).join(',')}
    >
      {i18nKey}
    </span>
  ),
}));

const values: MemberPlanFormValues = {
  ...EMPTY_MEMBER_PLAN,
  availablePaymentMethods: [
    {
      id: 'apm-1',
      value: {
        __typename: 'AvailablePaymentMethod',
        forceAutoRenewal: false,
        paymentPeriodicities: [PaymentPeriodicity.Monthly],
        paymentMethods: [],
      },
    },
  ] as MemberPlanFormValues['availablePaymentMethods'],
};

const WithForm = ({ children }: { children: ReactNode }) => {
  const form = useForm<MemberPlanFormValues>({ defaultValues: values });

  return (
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <FormProvider {...form}>{children}</FormProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

const renderForm = () =>
  render(
    <WithForm>
      <MemberPlanForm
        paymentMethods={[]}
        loading={false}
      />
    </WithForm>
  );

describe('MemberPlanForm', () => {
  beforeEach(() => {
    features.clear();
    (useQuery as unknown as Mock).mockReturnValue({
      data: undefined,
      loading: false,
    });
  });

  it('names every field by its visible label', () => {
    renderForm();

    for (const name of [
      'memberPlanEdit.name',
      'memberPlanEdit.slug',
      'memberPlanEdit.externalReward',
      'memberPlanEdit.description',
      'memberPlanEdit.shortDescription',
      'memberplanForm.periodicityPricingLabel',
    ]) {
      expect(screen.getByRole('textbox', { name })).toBeTruthy();
    }

    expect(
      screen.getByRole('spinbutton', { name: 'memberplanForm.maxCount' })
    ).toBeTruthy();

    for (const name of [
      'memberPlanEdit.tags',
      'memberPlanEdit.successPage',
      'memberPlanEdit.failPage',
      'memberplanForm.confirmationPage',
    ]) {
      expect(screen.getByRole('combobox', { name })).toBeTruthy();
    }

    for (const name of [
      /^memberplanForm\.productType\b/,
      /^memberplanForm\.migratePMTitle/,
      /^memberPlanEdit\.currency/,
      /^memberplanForm\.defaultPaymentPeriodicity/,
    ]) {
      expect(screen.getByRole('combobox', { name })).toBeTruthy();
    }

    fireEvent.click(
      screen.getByRole('button', { name: 'memberPlanEdit.editPaymentSetting' })
    );

    for (const name of [
      'memberPlanList.paymentPeriodicities',
      'memberPlanList.paymentMethods',
    ]) {
      expect(screen.getByRole('combobox', { name })).toBeTruthy();
    }
  });

  describe('printed issues per periodicity', () => {
    const field = 'memberplanForm.printIssuesPerPeriod';
    type Form = ReturnType<typeof useForm<MemberPlanFormValues>>;
    let form: Form;

    const PricedForm = ({ onForm }: { onForm: (form: Form) => void }) => {
      const priced = useForm<MemberPlanFormValues>({
        defaultValues: {
          ...values,
          availablePaymentMethods: [
            {
              id: 'apm-1',
              value: {
                __typename: 'AvailablePaymentMethod',
                forceAutoRenewal: false,
                paymentPeriodicities: [
                  PaymentPeriodicity.Monthly,
                  PaymentPeriodicity.Yearly,
                ],
                paymentMethods: [],
              },
            },
          ] as MemberPlanFormValues['availablePaymentMethods'],
        },
      });

      useEffect(() => {
        onForm(priced);
      }, [onForm, priced]);

      return (
        <MemoryRouter>
          <ThemeProvider theme={createTheme({ cssVariables: true })}>
            <FormProvider {...priced}>
              <MemberPlanForm
                paymentMethods={[]}
                loading={false}
              />
            </FormProvider>
          </ThemeProvider>
        </MemoryRouter>
      );
    };

    const row = (periodicity: PaymentPeriodicity) =>
      form
        .getValues('periodicityPricing')
        .find(price => price.periodicity === periodicity);

    it('does not exist while the print export is off', () => {
      render(<PricedForm onForm={captured => (form = captured)} />);

      expect(screen.queryByRole('spinbutton', { name: field })).toBeNull();
    });

    it('offers one number per periodicity tab and keeps it on that row', () => {
      features.add('print-export');
      render(<PricedForm onForm={captured => (form = captured)} />);

      // one field, in the pricing tab, none left on the plan itself
      expect(screen.getAllByRole('spinbutton', { name: field })).toHaveLength(
        1
      );

      fireEvent.change(screen.getByRole('spinbutton', { name: field }), {
        target: { value: '1' },
      });
      expect(row(PaymentPeriodicity.Monthly)).toMatchObject({
        printIssues: 1,
        amountMin: 0,
      });

      fireEvent.click(
        screen.getByRole('tab', {
          name: 'memberPlanList.paymentPeriodicity.yearly',
        })
      );
      expect(screen.getByRole('spinbutton', { name: field })).toHaveProperty(
        'value',
        ''
      );
      fireEvent.change(screen.getByRole('spinbutton', { name: field }), {
        target: { value: '6' },
      });
      // a label on the same row keeps the number
      fireEvent.change(
        screen.getByRole('textbox', {
          name: 'memberplanForm.periodicityPricingLabel',
        }),
        { target: { value: 'Jahresabo' } }
      );

      expect(row(PaymentPeriodicity.Yearly)).toMatchObject({
        printIssues: 6,
        label: 'Jahresabo',
      });
      expect(row(PaymentPeriodicity.Monthly)?.printIssues).toBe(1);

      // emptied, the yearly periodicity follows the pro-rata rule again
      fireEvent.change(screen.getByRole('spinbutton', { name: field }), {
        target: { value: '' },
      });
      expect(row(PaymentPeriodicity.Yearly)?.printIssues ?? null).toBeNull();
    });

    it('explains itself in an (i) tooltip next to its label, with markup', async () => {
      features.add('print-export');
      render(<PricedForm onForm={captured => (form = captured)} />);

      // no help line under the field any more
      expect(
        screen
          .getByRole('spinbutton', { name: field })
          .hasAttribute('aria-describedby')
      ).toBe(false);

      fireEvent.mouseOver(screen.getByRole('button', { name: field }));

      const tooltip = await screen.findByRole('tooltip');
      expect(
        tooltip.querySelector(
          '[data-trans="memberplanForm.printIssuesPerPeriodHelpText"]'
        )
      ).toHaveAttribute('data-tags', 'strong,em,i,br');
    });

    it('saves a row that carries only the number', () => {
      features.add('print-export');
      render(<PricedForm onForm={captured => (form = captured)} />);

      fireEvent.click(
        screen.getByRole('tab', {
          name: 'memberPlanList.paymentPeriodicity.yearly',
        })
      );
      fireEvent.change(screen.getByRole('spinbutton', { name: field }), {
        target: { value: '6' },
      });

      expect(
        prunePricing(form.getValues()).find(
          price => price.periodicity === PaymentPeriodicity.Yearly
        )
      ).toMatchObject({ printIssues: 6, amountMin: null });
    });
  });

  it('explains the price label in an (i) tooltip next to its label, with markup', async () => {
    renderForm();

    const name = 'memberplanForm.periodicityPricingLabel';
    expect(
      screen.getByRole('textbox', { name }).hasAttribute('aria-describedby')
    ).toBe(false);

    fireEvent.mouseOver(screen.getByRole('button', { name }));

    const tooltip = await screen.findByRole('tooltip');
    expect(
      tooltip.querySelector(
        '[data-trans="memberplanForm.periodicityPricingLabelHelpText"]'
      )
    ).toHaveAttribute('data-tags', 'strong,em,i,br');
  });

  it('explains the default periodicity in an (i) tooltip next to its label, with markup', async () => {
    renderForm();

    const key = 'memberplanForm.defaultPaymentPeriodicityHelpText';
    // no help line under the select any more
    expect(screen.queryByText(key)).toBeNull();

    fireEvent.mouseOver(
      screen.getByRole('button', {
        name: 'memberplanForm.defaultPaymentPeriodicity',
      })
    );

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.querySelector(`[data-trans="${key}"]`)).toHaveAttribute(
      'data-tags',
      'strong,em,i,br'
    );
  });

  it('names the price inputs by their column', () => {
    renderForm();

    for (const name of [
      'memberPlanEdit.amountPerMonthMin',
      'memberplanForm.amountPerMonthTarget',
      'memberPlanEdit.amountPerMonthMax',
    ]) {
      expect(screen.getByRole('textbox', { name })).toBeTruthy();
    }
  });

  it('keeps the help buttons out of labels', () => {
    renderForm();

    for (const name of [
      'memberPlanEdit.slugHelp',
      'memberplanForm.extendableHelpText',
      'memberplanForm.maxCountHelpText',
      'memberplanForm.periodicityPricingMinHelpText',
    ]) {
      expect(
        screen.getByRole('button', { name }).closest('label, legend')
      ).toBeNull();
    }
  });

  it('titles the cards as headings above the redirections heading', () => {
    renderForm();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'memberplanForm.trialSubscription',
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'memberplanForm.redirectionsTitle',
      })
    ).toBeTruthy();
  });

  it('moves focus to the confirmation once a trial is configured', () => {
    renderForm();

    const configure = screen.getByRole('button', {
      name: 'memberplanForm.configureTrialBtn',
    });
    configure.focus();
    fireEvent.click(configure);

    expect(
      screen
        .getByText('memberplanForm.trialMemberplanAlert')
        .closest('[role="alert"]')
    ).toHaveFocus();
  });
});
