import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { DiscountCodeForm } from './discountCodeForm';

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
