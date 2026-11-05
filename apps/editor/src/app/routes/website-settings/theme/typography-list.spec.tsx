import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';

import { TypographyVariant } from './typography-groups';
import { TypographyList } from './typography-list';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'en' },
  }),
}));

let form: UseFormReturn<{
  typography: { allVariants: Record<string, unknown> };
}>;

const Wrapper = ({ children }: PropsWithChildren) => {
  const value = useForm<{
    typography: { allVariants: Record<string, unknown> };
  }>({
    defaultValues: {
      typography: { allVariants: { lineHeight: '1.4em' } },
    },
  });

  useEffect(() => {
    form = value;
  }, [value]);

  return (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <FormProvider {...value}>{children}</FormProvider>
    </ThemeProvider>
  );
};

const StatefulList = () => {
  const [openTypography, setOpenTypography] = useState<TypographyVariant>();

  return (
    <TypographyList
      name="typography"
      headerIdPrefix="test"
      openTypography={openTypography}
      onToggleTypography={variant =>
        setOpenTypography(old => (old === variant ? undefined : variant))
      }
    />
  );
};

const renderList = () =>
  render(
    <Wrapper>
      <StatefulList />
    </Wrapper>
  );

const rowLabels = (list: HTMLElement) =>
  within(list)
    .getAllByRole('button', { expanded: false })
    .map(row => row.querySelector('.MuiListItemText-primary')?.textContent);

describe('TypographyList', () => {
  it('introduces the base for all styles', () => {
    renderList();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'websiteSettings.theme.typography.base',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText('websiteSettings.theme.typography.baseInfo')
    ).toBeInTheDocument();
  });

  it('groups the styles under a heading per role', () => {
    renderList();

    expect(
      screen.getAllByRole('heading', { level: 2 }).map(item => item.textContent)
    ).toEqual([
      'websiteSettings.theme.typography.base',
      'websiteSettings.theme.typography.groups.headings',
      'websiteSettings.theme.typography.groups.text',
      'websiteSettings.theme.typography.groups.teasers',
      'websiteSettings.theme.typography.groups.article',
      'websiteSettings.theme.typography.groups.banner',
      'websiteSettings.theme.typography.groups.blocks',
    ]);

    expect(
      rowLabels(
        screen.getByRole('list', {
          name: 'websiteSettings.theme.typography.groups.text',
        })
      )
    ).toEqual([
      'websiteSettings.theme.typography.body1',
      'websiteSettings.theme.typography.body2',
      'websiteSettings.theme.typography.caption',
    ]);
  });

  it('keeps only one style open at a time', () => {
    renderList();

    const h1 = screen.getByRole('button', {
      name: /typography\.h1/,
    });
    const caption = screen.getByRole('button', {
      name: /typography\.caption/,
    });

    fireEvent.click(h1);

    expect(h1).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(caption);

    expect(caption).toHaveAttribute('aria-expanded', 'true');
    expect(h1).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(caption);

    expect(caption).toHaveAttribute('aria-expanded', 'false');
  });

  it.each(['lineHeight', 'letterSpacing'])(
    'names the slider, number input and unit of the base %s',
    property => {
      renderList();

      const name = `websiteSettings.theme.typography.${property}`;

      expect(screen.getByRole('slider', { name })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name })).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', {
          name: `websiteSettings.theme.typography.unitOf {"label":"${name}"}`,
        })
      ).toBeInTheDocument();
    }
  );

  it.each(['lineHeight', 'letterSpacing'])(
    'announces the validation message of the base %s',
    async property => {
      renderList();

      act(() =>
        form.setError(`typography.allVariants.${property}` as never, {
          type: 'range',
          message: 'out of range',
        })
      );

      expect(
        await screen.findByRole('spinbutton', {
          name: `websiteSettings.theme.typography.${property}`,
        })
      ).toHaveAccessibleDescription('out of range');
    }
  );

  it.each(['fontFamily', 'fontWeight'])(
    'names the base %s select after its label',
    property => {
      renderList();

      expect(
        screen.getByRole('combobox', {
          name: `websiteSettings.theme.typography.${property}`,
        })
      ).toBeInTheDocument();
    }
  );
});
