import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { RevisionContentPreview } from './revisionContentPreview';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const theme = createTheme({ cssVariables: true });

describe('RevisionContentPreview', () => {
  it('names the dialog after its visible title', () => {
    render(
      <ThemeProvider theme={theme}>
        <RevisionContentPreview
          open
          loading
          onClose={vi.fn()}
          title="Old headline"
          blocks={[]}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('dialog', { name: 'versionHistory.previewTitle' })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'versionHistory.previewTitle' })
    ).toBeTruthy();
  });
});
