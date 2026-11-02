import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PaymentPeriodicity } from '@wepublish/editor/api';
import { FormProvider, useForm } from 'react-hook-form';
import { Mock } from 'vitest';

import { GoodieForm, GoodieFormValues } from './goodieForm';

vi.mock('@apollo/client/react', async importOriginal => {
  const { operationName } = await import('../templates/testUtils');

  return {
    ...(await importOriginal<typeof import('@apollo/client/react')>()),
    useQuery: (document: unknown) => ({
      data:
        operationName(document) === 'MemberPlanList' ?
          { memberPlans: { nodes: [] } }
        : undefined,
      loading: false,
      refetch: vi.fn(),
    }),
    useMutation: () => [vi.fn(), { loading: false }],
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const theme = createTheme({ cssVariables: true });

const Harness = ({
  onSubmit,
  defaultValues,
}: {
  onSubmit: Mock;
  defaultValues?: Partial<GoodieFormValues>;
}) => {
  const form = useForm<GoodieFormValues>({
    defaultValues: {
      name: 'Booklet',
      active: true,
      memberPlanIDs: [],
      paymentPeriodicities: [],
      ...defaultValues,
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(values => onSubmit(values))}>
          <GoodieForm create />
        </form>
      </FormProvider>
    </ThemeProvider>
  );
};

describe('GoodieForm', () => {
  it('lets the editor restrict the goodie to payment periodicities', async () => {
    const onSubmit = vi.fn();
    const { container } = render(<Harness onSubmit={onSubmit} />);

    const input = screen.getByRole('combobox', {
      name: 'goodie.form.paymentPeriodicities',
    });
    fireEvent.mouseDown(input);
    fireEvent.click(
      screen.getByRole('option', {
        name: 'memberPlanList.paymentPeriodicity.biennial',
      })
    );

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentPeriodicities: [PaymentPeriodicity.Biennial],
        })
      )
    );
  });

  it('shows the stored periodicities of an existing goodie', () => {
    render(
      <Harness
        onSubmit={vi.fn()}
        defaultValues={{ paymentPeriodicities: [PaymentPeriodicity.Yearly] }}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'memberPlanList.paymentPeriodicity.yearly',
      })
    ).toBeInTheDocument();
  });
});
