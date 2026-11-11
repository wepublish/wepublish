import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { createEditorTheme } from '../../theme';
import { defaultDashboardLayout } from './dashboardLayout';
import { DashboardConfig } from './dashboardConfig';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createEditorTheme();

describe('DashboardConfig', () => {
  it('paints its card rows with the theme variables, not a frozen palette', () => {
    render(
      <ThemeProvider theme={theme}>
        <DashboardConfig
          open
          layout={defaultDashboardLayout()}
          onChange={vi.fn()}
          onClose={vi.fn()}
        />
      </ThemeProvider>
    );

    const row = screen
      .getByText('dashboard.notifications')
      .closest('li') as HTMLElement;
    const emotionClass = row.className.split(' ')[0];
    const rules = [...document.querySelectorAll('style')]
      .map(style => style.textContent ?? '')
      .join('')
      .split('}')
      .filter(rule => rule.includes(`.${emotionClass}`))
      .join('');

    expect(rules).toContain('var(--mui-palette-background-paper');
  });
});
