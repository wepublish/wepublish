import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { LoginStatus } from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';

import { BannerForm, BannerFormValues } from './banner-form';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const WithForm = ({ children }: { children: ReactNode }) => {
  const form = useForm<BannerFormValues>({
    defaultValues: {
      title: '',
      text: '',
      cta: '',
      html: '',
      embedUrl: '',
      active: false,
      collapsible: false,
      delay: 0,
      hideForMinutes: 0,
      showForLoginStatus: LoginStatus.All,
      showOnArticles: false,
      showOnPages: [],
      actions: [],
    },
  });

  return (
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <FormProvider {...form}>{children}</FormProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('BannerForm', () => {
  beforeEach(() => {
    (useQuery as unknown as Mock).mockReturnValue({
      data: { pages: { nodes: [] } },
      loading: false,
    });
  });

  it('labels every field by its visible label alone', () => {
    render(
      <WithForm>
        <BannerForm />
      </WithForm>
    );

    expect(
      screen.getByRole('switch', { name: 'banner.form.collapsible' })
    ).toBeTruthy();
    expect(
      screen.getByRole('spinbutton', { name: 'banner.form.delay' })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'banner.form.cta' })
    ).toBeTruthy();
    expect(
      screen.getByRole('combobox', { name: 'banner.form.showOnPages' })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'banner.form.html' })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'banner.form.embedUrl' })
    ).toBeTruthy();
    expect(
      screen.getByRole('radiogroup', { name: 'banner.form.showForLoginStatus' })
    ).toBeTruthy();
    expect(
      screen.getByRole('group', { name: 'banner.form.image' })
    ).toBeTruthy();
  });

  it('keeps each help button out of labels, with one tab stop each', () => {
    render(
      <WithForm>
        <BannerForm />
      </WithForm>
    );

    for (const name of [
      'banner.form.collapsibleInfo',
      'banner.form.delayInfo',
      'banner.form.ctaInfo',
    ]) {
      const buttons = screen.getAllByRole('button', { name });
      expect(buttons).toHaveLength(1);
      expect(buttons[0].closest('label, legend')).toBeNull();
    }
  });

  it('titles its sections as level-two headings', () => {
    render(
      <WithForm>
        <BannerForm />
      </WithForm>
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'banner.form.displayOptions',
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'banner.form.content' })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'banner.form.actions' })
    ).toBeTruthy();
  });
});
