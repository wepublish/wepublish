import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { ConsentForm, ConsentFormValues } from './consent-form';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const WithForm = ({ children }: { children: ReactNode }) => {
  const form = useForm<ConsentFormValues>({
    defaultValues: { name: '', slug: '', defaultValue: false },
  });

  return (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <FormProvider {...form}>{children}</FormProvider>
    </ThemeProvider>
  );
};

describe('ConsentForm', () => {
  it('keeps the help buttons out of the field labels', () => {
    render(
      <WithForm>
        <ConsentForm />
      </WithForm>
    );

    expect(screen.getByRole('textbox', { name: 'consents.slug' })).toBeTruthy();
    expect(
      screen.getByRole('switch', { name: 'consents.checkedByDefault' })
    ).toBeTruthy();
    expect(
      screen.getAllByRole('button', { name: 'consents.slugInfo' })
    ).toHaveLength(1);
    expect(
      screen
        .getByRole('button', { name: 'consents.defaultValueInfo' })
        .closest('label, legend')
    ).toBeNull();
  });
});
