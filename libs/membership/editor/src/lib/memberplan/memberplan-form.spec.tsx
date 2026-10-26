import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { PaymentPeriodicity } from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';

import { MemberPlanForm } from './memberplan-form';
import { EMPTY_MEMBER_PLAN, MemberPlanFormValues } from './memberplan-schema';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
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
