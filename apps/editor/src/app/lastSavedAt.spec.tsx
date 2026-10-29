import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { LastSavedAt } from './lastSavedAt';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { date?: Date }) =>
      `${key} ${options?.date?.toISOString()}`,
  }),
}));

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('LastSavedAt', () => {
  it('shows when the document was last saved', () => {
    renderWithTheme(<LastSavedAt date="2026-09-30T14:05:00.000Z" />);

    expect(
      screen.queryByText('lastSavedAt 2026-09-30T14:05:00.000Z')
    ).not.toBeNull();
  });

  it('renders nothing for a document that was never saved', () => {
    const { container } = renderWithTheme(<LastSavedAt date={undefined} />);

    expect(container.innerHTML).toBe('');
  });
});
