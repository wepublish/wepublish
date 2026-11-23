import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { createTheme, Dialog, ThemeProvider } from '@mui/material';
import { PreviewDialogTitle } from './preview-dialog-title';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('PreviewDialogTitle', () => {
  it('shows the title and closes from the button in its corner', () => {
    const onClose = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <Dialog open>
          <PreviewDialogTitle onClose={onClose}>Vorschau</PreviewDialogTitle>
        </Dialog>
      </ThemeProvider>
    );

    expect(screen.getByRole('heading', { name: 'Vorschau' })).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', { name: 'mailTemplates.editor.close' })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
