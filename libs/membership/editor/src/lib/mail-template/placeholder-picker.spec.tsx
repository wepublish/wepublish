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

  it('says how to insert a placeholder in the heading tooltip, first line', () => {
    renderPicker();

    expect(
      screen.getByRole('button', {
        name: /^• mailTemplates\.placeholdersHint\s• mailTemplates\.placeholdersInfo$/,
      })
    ).toBeTruthy();
    expect(screen.queryByText('mailTemplates.placeholdersHint')).toBeNull();
  });

  it('explains a group in a tooltip next to its heading', () => {
    renderPicker();

    expect(
      screen.getByRole('button', {
        name: 'mailTemplates.placeholderAlwaysHint',
      })
    ).toBeTruthy();
    expect(
      screen.queryByText('mailTemplates.placeholderAlwaysHint')
    ).toBeNull();
    // The heading keeps its own name: the tooltip sits beside it.
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'mailTemplates.placeholderAlways',
      })
    ).toBeTruthy();
  });

  it('titles the user fields as a set of their own', () => {
    renderPicker();

    const user = screen.getByRole('group', {
      name: 'mailTemplates.placeholderGroups.user',
    });

    expect(
      within(user)
        .getAllByRole('button')
        .map(chip => chip.textContent)
    ).toEqual([
      'mailTemplates.placeholderNames.user_id',
      'mailTemplates.placeholderNames.user_active',
    ]);
  });

  it('titles the first batch of the always-available fields too', () => {
    renderPicker();

    const person = screen.getByRole('group', {
      name: 'mailTemplates.placeholderGroups.person',
    });

    expect(
      within(person)
        .getAllByRole('button')
        .map(chip => chip.textContent)
    ).toEqual([
      'mailTemplates.placeholderNames.user_fullName',
      'mailTemplates.placeholderNames.user_firstName',
      'mailTemplates.placeholderNames.user_name',
      'mailTemplates.placeholderNames.user_email',
      'mailTemplates.placeholderNames.user_flair',
    ]);
  });

  it('titles the first batch of a purpose as its general fields', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <PlaceholderPicker
          onInsert={vi.fn()}
          context={'invoiceCreation' as never}
        />
      </ThemeProvider>
    );

    expect(
      within(
        screen.getByRole('group', {
          name: 'mailTemplates.placeholderGroups.general',
        })
      ).getAllByRole('button').length
    ).toBeGreaterThan(0);
  });
});
