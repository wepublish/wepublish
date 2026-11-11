import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { EmbedType } from '../blocks/types';
import { EmbedEditPanel } from './embedEditPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('EmbedEditPanel', () => {
  it('labels the embed field', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <EmbedEditPanel
          value={{ type: EmbedType.Other } as never}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('textbox', { name: 'blocks.embeds.panels.embed' })
    ).toBeInTheDocument();
  });
});
