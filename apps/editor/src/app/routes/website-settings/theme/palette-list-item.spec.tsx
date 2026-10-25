import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { PaletteListItem } from './palette-list-item';
import { TypographyListItem } from './typography-list-item';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

vi.mock('./available-fonts-picker', () => ({
  AvailableFontsPicker: () => null,
}));

function Form({ children }: { children: ReactNode }) {
  const form = useForm({ defaultValues: {} });

  return <FormProvider {...form}>{children}</FormProvider>;
}

const renderInForm = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <Form>{ui}</Form>
    </ThemeProvider>
  );

describe('theme disclosure rows', () => {
  it('says whether a palette row is expanded and what it controls', () => {
    renderInForm(
      <PaletteListItem
        name="palette.primary"
        keys={['main', 'light']}
        isOpen
        onOpen={vi.fn()}
      />
    );

    const row = screen.getByRole('button', {
      name: 'websiteSettings.theme.palette.primary',
    });

    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(
      document.getElementById(row.getAttribute('aria-controls') ?? '')
    ).not.toBeNull();
  });

  it('says when a palette row is collapsed', () => {
    renderInForm(
      <PaletteListItem
        name="palette.primary"
        keys={['main']}
        isOpen={false}
        onOpen={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'websiteSettings.theme.palette.primary',
      })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('says whether a typography row is expanded', () => {
    renderInForm(
      <TypographyListItem
        parentName="typography"
        name="typography.h1"
        isOpen={false}
        onOpen={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'websiteSettings.theme.typography.h1',
      })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('names the typography pickers after their labels', () => {
    renderInForm(
      <TypographyListItem
        parentName="typography"
        name="typography.h1"
        isOpen
        onOpen={vi.fn()}
      />
    );

    expect(
      screen.getByRole('combobox', {
        name: /^websiteSettings.theme.typography.fontWeight/,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        name: /^websiteSettings.theme.typography.textTransform/,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('slider', {
        name: 'websiteSettings.theme.typography.fontSize',
      })
    ).toBeInTheDocument();
  });
});
