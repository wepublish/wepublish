import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';

import { PlaceholderPicker } from './placeholder-picker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderPicker = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <PlaceholderPicker
        onInsert={vi.fn()}
        context={null}
      />
    </ThemeProvider>
  );

describe('PlaceholderPicker', () => {
  it('titles the picker and its groups as headings', () => {
    renderPicker();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'mailTemplates.placeholders',
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'mailTemplates.placeholderAlways',
      })
    ).toBeTruthy();
  });

  it('labels the search field', () => {
    renderPicker();

    expect(
      screen.getByRole('textbox', {
        name: 'mailTemplates.searchPlaceholdersLabel',
      })
    ).toBeTruthy();
  });

  it('groups the format chips of a placeholder under its name', () => {
    renderPicker();

    const birthday = screen.getByRole('group', {
      name: 'mailTemplates.placeholderNames.user_birthday',
    });

    expect(
      within(birthday).getByRole('button', {
        name: 'mailTemplates.dateFormat.date',
      })
    ).toBeTruthy();
  });
});
