import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { HTMLBlock } from './htmlBlock';
import { HTMLBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

const renderBlock = (html: string) =>
  render(
    <ThemeProvider theme={theme}>
      <HTMLBlock
        type={EditorBlockType.Html}
        value={{ html } as HTMLBlockValue}
        onChange={vi.fn()}
      />
    </ThemeProvider>
  );

describe('HTMLBlock', () => {
  it('spells out how to add HTML when empty', () => {
    renderBlock('');

    expect(screen.getByText('blocks.html.edit')).toBeVisible();
  });

  it('previews the HTML below an edit button', () => {
    renderBlock('<p>Hello</p>');

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'blocks.html.edit' })
    ).toBeInTheDocument();
  });
});
