import '@testing-library/jest-dom/vitest';

import { zodResolver } from '@hookform/resolvers/zod';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import {
  DiscountCodeForm,
  DiscountCodeFormValues,
  discountCodeSchema,
} from './discountCodeForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  // Both would otherwise query the API.
  SelectMemberPlan: () => null,
  DateTimePicker: () => null,
}));

const values: DiscountCodeFormValues = {
  code: 'friends',
  discountPercent: 20,
  memberPlanId: 'plan-1',
  validFrom: '2026-01-01T00:00:00.000Z',
  validTo: '2027-01-01T00:00:00.000Z',
  minReferrals: null,
};

const theme = createTheme({ cssVariables: true });

const Form = ({
  defaultValues,
  onSubmit,
}: {
  defaultValues: DiscountCodeFormValues;
  onSubmit: (values: DiscountCodeFormValues) => void;
}) => {
  const form = useForm<DiscountCodeFormValues>({
    resolver: zodResolver(discountCodeSchema),
    defaultValues,
  });

  return (
    <ThemeProvider theme={theme}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DiscountCodeForm />
          <button
            type="submit"
            aria-label="submit"
          />
        </form>
      </FormProvider>
    </ThemeProvider>
  );
};

const conditionsToggle = () =>
  screen.getByRole('button', { name: /discountCode.form.conditions/ });

describe('DiscountCodeForm conditions', () => {
  it('keeps the conditions closed for a code without conditions', () => {
    render(
      <Form
        defaultValues={values}
        onSubmit={vi.fn()}
      />
    );

    expect(conditionsToggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the conditions for a code with conditions', () => {
    render(
      <Form
        defaultValues={{ ...values, minReferrals: 3 }}
        onSubmit={vi.fn()}
      />
    );

    expect(conditionsToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('spinbutton', {
        name: /discountCode.form.minReferrals/,
      })
    ).toHaveValue(3);
  });

  it('saves the minimum number of referrals', async () => {
    const onSubmit = vi.fn();
    render(
      <Form
        defaultValues={values}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(conditionsToggle());
    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: /discountCode.form.minReferrals/,
      }),
      { target: { value: '2' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ minReferrals: 2 }),
        expect.anything()
      )
    );
  });

  it('removes the condition when the field is emptied', async () => {
    const onSubmit = vi.fn();
    render(
      <Form
        defaultValues={{ ...values, minReferrals: 3 }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: /discountCode.form.minReferrals/,
      }),
      { target: { value: '' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ minReferrals: null }),
        expect.anything()
      )
    );
  });

  it('refuses a negative number of referrals', () => {
    expect(
      discountCodeSchema.safeParse({ ...values, minReferrals: -1 }).success
    ).toBe(false);
    expect(
      discountCodeSchema.safeParse({ ...values, minReferrals: 2 }).success
    ).toBe(true);
  });
});
