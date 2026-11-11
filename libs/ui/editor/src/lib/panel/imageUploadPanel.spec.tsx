import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { ImageUploadPanel } from './imageUploadPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('ImageUploadPanel', () => {
  it('keeps the drop zone instruction out of the heading outline', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <ImageUploadPanel
          onClose={vi.fn()}
          onUpload={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByText('articleEditor.panels.dropImage')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'articleEditor.panels.dropImage' })
    ).not.toBeInTheDocument();
  });
});
