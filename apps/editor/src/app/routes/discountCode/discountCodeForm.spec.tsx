import '@testing-library/jest-dom/vitest';

import { zodResolver } from '@hookform/resolvers/zod';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import {
  DiscountCodeForm,
  DiscountCodeFormValues,
  discountCodeSchema,
} from './discountCodeForm';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
  useLazyQuery: () => [vi.fn(), { data: undefined, loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const features = vi.hoisted(() => ({ referrals: true }));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useFeature: (key: string) => key === 'referrals' && features.referrals,
}));

beforeEach(() => {
  features.referrals = true;
});

const values: DiscountCodeFormValues = {
  code: 'friends',
  discountPercent: 20,
  memberPlanId: 'plan-1',
  validFrom: '2026-01-01T00:00:00.000Z',
  validTo: '2027-01-01T00:00:00.000Z',
  minReferrals: null,
};

const theme = createTheme({ cssVariables: true });

const ValidatedForm = ({
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
  it('offers no conditions while referrals are switched off for the medium', () => {
    features.referrals = false;
    render(
      <ValidatedForm
        defaultValues={values}
        onSubmit={vi.fn()}
      />
    );

    expect(
      screen.queryByRole('button', { name: /discountCode.form.conditions/ })
    ).not.toBeInTheDocument();
  });

  it('keeps the conditions closed for a code without conditions', () => {
    render(
      <ValidatedForm
        defaultValues={values}
        onSubmit={vi.fn()}
      />
    );

    expect(conditionsToggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the conditions for a code with conditions', () => {
    render(
      <ValidatedForm
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
      <ValidatedForm
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
      <ValidatedForm
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

function Form({ children }: { children: ReactNode }) {
  const form = useForm({
    defaultValues: { memberPlanId: '', validFrom: '', validTo: '' },
  });

  return (
    <FormProvider {...form}>
      {children}
      <button
        type="button"
        aria-label="focus validTo"
        onClick={() => form.setFocus('validTo')}
      />
    </FormProvider>
  );
}

describe('DiscountCodeForm', () => {
  it('lets the form focus a date field with an error', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <Form>
          <DiscountCodeForm />
        </Form>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'focus validTo' }));

    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: 'discountCode.form.validTo' })
      ).toHaveFocus()
    );
  });

  it('names the member plan picker after its label', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <Form>
          <DiscountCodeForm />
        </Form>
      </ThemeProvider>
    );

    expect(
      screen.getByRole('combobox', { name: 'discountCode.form.memberPlan' })
    ).toBeInTheDocument();
  });
});
