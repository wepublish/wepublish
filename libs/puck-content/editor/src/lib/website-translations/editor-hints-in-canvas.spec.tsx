import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { FormHints } from '../components/form/form-editor-warning.component';
import { WebsiteTranslationsProvider } from './website-translations.component';

describe('editor hints inside the canvas', () => {
  it('uses the editor translations, not the website ones', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <WebsiteTranslationsProvider>
          <FormHints action="" />
        </WebsiteTranslationsProvider>
      </ThemeProvider>
    );

    expect(
      screen.getByText(
        'Set an action URL so the form knows where to send its data'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('puck.form.missingAction')).toBeNull();
  });
});
