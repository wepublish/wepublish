import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { PaywallForm, PaywallFormValues } from './paywallForm';

vi.mock('qr-code-styling', () => ({ default: vi.fn() }));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  SelectMemberPlans: (props: { 'aria-labelledby'?: string }) => (
    <input
      role="combobox"
      aria-expanded="false"
      aria-controls="listbox"
      aria-labelledby={props['aria-labelledby']}
    />
  ),
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

function Harness() {
  const form = useForm<PaywallFormValues>({
    defaultValues: {
      name: 'Paywall',
      active: true,
      anyMemberPlan: false,
      memberPlanIds: [],
      hideContentAfter: 3,
      fadeout: false,
      bypasses: [{ id: 'bypass-1', token: 'SECRET' }],
    },
  });

  return (
    <FormProvider {...form}>
      <PaywallForm />
    </FormProvider>
  );
}

const renderForm = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <Harness />
    </ThemeProvider>
  );

describe('PaywallForm', () => {
  it('labels the member plan picker and the bypass token fields', () => {
    renderForm();

    expect(
      screen.getByRole('combobox', { name: 'paywall.form.memberPlans' })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'paywall.form.bypassToken 1' })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'paywall.form.newBypassToken' })
    ).toBeTruthy();
  });

  it('labels the description editors with their visible labels', () => {
    renderForm();

    fireEvent.click(
      screen.getByRole('button', { name: 'paywall.form.upgrade' })
    );

    expect(
      screen.getAllByRole('textbox', {
        name: 'paywall.form.description',
      })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('textbox', {
        name: 'paywall.form.circumventDescription',
      })
    ).toHaveLength(2);
  });

  it('names the accordion regions after their summaries', () => {
    renderForm();

    const upgrade = screen.getByRole('button', {
      name: 'paywall.form.upgrade',
    });

    expect(upgrade.getAttribute('aria-controls')).toBeTruthy();
    expect(upgrade.closest('h2')).toBeTruthy();
  });
});
