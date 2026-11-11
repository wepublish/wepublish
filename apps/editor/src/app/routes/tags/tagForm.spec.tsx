import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { TagForm, TagFormValues } from './tagForm';

vi.mock('../website-settings/theme/theme-colors', () => ({
  useWebsiteThemeColors: () => [],
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

function Harness() {
  const { control } = useForm<TagFormValues>({
    defaultValues: { tag: 'News', color: '#ff0000' },
  });

  return <TagForm control={control} />;
}

describe('TagForm', () => {
  it('labels the colour field and the description editor', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <Harness />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('textbox', { name: 'tags.overview.color' })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'tags.overview.description' })
    ).toBeTruthy();
  });
});
