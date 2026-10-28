import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { TypeScalePreview } from './type-scale-preview';
import { mediaQuery } from './typography-breakpoints';
import { TypographyVariant } from './typography-groups';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'en' },
  }),
}));

const Wrapper = ({ children }: PropsWithChildren) => {
  const form = useForm({
    defaultValues: {
      typography: {
        allVariants: { lineHeight: '1.4em', fontFamily: 'Inter' },
        h1: {
          fontSize: '3rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          [mediaQuery('md')]: { fontSize: '4rem' },
          [mediaQuery('xl')]: { fontSize: '5rem' },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <FormProvider {...form}>{children}</FormProvider>
    </ThemeProvider>
  );
};

const renderPreview = (onSelect = vi.fn(), selected?: TypographyVariant) => {
  render(
    <Wrapper>
      <TypeScalePreview
        name="typography"
        selected={selected}
        onSelect={onSelect}
      />
    </Wrapper>
  );

  return onSelect;
};

const h1Line = () =>
  screen.getByRole('button', { name: 'websiteSettings.theme.typography.h1' });

describe('TypeScalePreview', () => {
  it('has a heading and a screen size picker starting at all screens', () => {
    renderPreview();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'websiteSettings.theme.typography.preview',
      })
    ).toBeInTheDocument();

    const picker = screen.getByRole('group', {
      name: 'websiteSettings.theme.typography.previewScreenSize',
    });

    expect(
      within(picker)
        .getAllByRole('button')
        .map(button => button.textContent)
    ).toEqual([
      'websiteSettings.theme.typography.baseline',
      'sm',
      'md',
      'lg',
      'xl',
    ]);
    expect(
      within(picker).getByRole('button', {
        name: 'websiteSettings.theme.typography.baseline',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(picker).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.belowWidth {"width":600}'
    );
  });

  it('says which screen widths the selected size stands for', () => {
    renderPreview();

    const picker = screen.getByRole('group', {
      name: 'websiteSettings.theme.typography.previewScreenSize',
    });

    fireEvent.click(within(picker).getByRole('button', { name: 'md' }));

    expect(picker).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.fromWidth {"width":900}'
    );
  });

  it('groups every style under the same headings as the list', () => {
    renderPreview();

    expect(
      screen.getAllByRole('heading', { level: 3 }).map(item => item.textContent)
    ).toEqual([
      'websiteSettings.theme.typography.groups.headings',
      'websiteSettings.theme.typography.groups.text',
      'websiteSettings.theme.typography.groups.teasers',
      'websiteSettings.theme.typography.groups.article',
      'websiteSettings.theme.typography.groups.banner',
      'websiteSettings.theme.typography.groups.blocks',
    ]);
    expect(
      screen.getByRole('button', {
        name: 'websiteSettings.theme.typography.blockQuote',
      })
    ).toBeInTheDocument();
  });

  it('shows each style resolved for the chosen screen size', () => {
    renderPreview();

    expect(h1Line()).toHaveStyle({
      fontSize: '48px',
      lineHeight: '22.4px',
      fontWeight: '700',
      fontFamily: 'Inter',
      textTransform: 'uppercase',
    });

    const picker = screen.getByRole('group', {
      name: 'websiteSettings.theme.typography.previewScreenSize',
    });

    fireEvent.click(within(picker).getByRole('button', { name: /^sm/ }));
    expect(h1Line()).toHaveStyle({ fontSize: '48px' });

    fireEvent.click(within(picker).getByRole('button', { name: /^md/ }));
    expect(h1Line()).toHaveStyle({ fontSize: '64px' });
    expect(within(picker).getByRole('button', { name: /^md/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(within(picker).getByRole('button', { name: /^lg/ }));
    expect(h1Line()).toHaveStyle({
      fontSize: '64px',
      textTransform: 'uppercase',
    });

    fireEvent.click(within(picker).getByRole('button', { name: /^xl/ }));
    expect(h1Line()).toHaveStyle({ fontSize: '80px' });
  });

  it('keeps a screen size chosen when it is pressed again', () => {
    renderPreview();

    const picker = screen.getByRole('group', {
      name: 'websiteSettings.theme.typography.previewScreenSize',
    });
    const md = within(picker).getByRole('button', { name: /^md/ });

    fireEvent.click(md);
    fireEvent.click(md);

    expect(md).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens a style when its line is pressed', () => {
    const onSelect = renderPreview();

    fireEvent.click(h1Line());

    expect(onSelect).toHaveBeenCalledWith('h1');
  });

  it('keeps a long sample on one line instead of breaking words', () => {
    renderPreview();

    expect(h1Line()).toHaveStyle({
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
    expect(h1Line()).not.toHaveStyle({ overflowWrap: 'anywhere' });
  });

  it('marks the style that is open in the list', () => {
    renderPreview(vi.fn(), 'h1');

    expect(h1Line()).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByRole('button', {
        name: 'websiteSettings.theme.typography.h2',
      })
    ).not.toHaveAttribute('aria-current');
  });
});
