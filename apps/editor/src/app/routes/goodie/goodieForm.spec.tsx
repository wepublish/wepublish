import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { GoodieForm } from './goodieForm';

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

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  RichTextBlock: (props: { 'aria-labelledby'?: string }) => (
    <div
      role="textbox"
      aria-labelledby={props['aria-labelledby']}
    />
  ),
}));

function Form({ children }: { children: ReactNode }) {
  const form = useForm({
    defaultValues: { memberPlanIDs: [], memberPlans: [], image: null },
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}

const renderForm = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <Form>
        <GoodieForm />
      </Form>
    </ThemeProvider>
  );

describe('GoodieForm', () => {
  it('names the description editor after its label', () => {
    renderForm();

    expect(
      screen.getByRole('textbox', { name: 'goodie.form.description' })
    ).toBeInTheDocument();
  });

  it('names the image chooser after its label', () => {
    renderForm();

    expect(
      screen.getByRole('group', { name: 'goodie.form.image' })
    ).toBeInTheDocument();
  });

  it('names the member plan picker after its label', () => {
    renderForm();

    expect(
      screen.getByRole('combobox', { name: 'goodie.form.memberPlans' })
    ).toBeInTheDocument();
  });
});
