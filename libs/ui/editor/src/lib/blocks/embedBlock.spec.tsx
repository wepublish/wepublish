import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { EmbedBlock } from './embedBlock';
import { EmbedBlockValue, EmbedType } from './types';

const theme = createTheme({ cssVariables: true });

const renderBlock = (value: EmbedBlockValue, disabled = false) =>
  render(
    <ThemeProvider theme={theme}>
      <EmbedBlock
        type={EditorBlockType.Embed}
        value={value}
        onChange={vi.fn()}
        disabled={disabled}
      />
    </ThemeProvider>
  );

describe('EmbedBlock', () => {
  it('spells out how to add an embed when empty', () => {
    renderBlock({ type: EmbedType.Other } as EmbedBlockValue);

    expect(screen.getByText('blocks.embeds.overview.editEmbed')).toBeVisible();
  });

  it('disables adding an embed to a disabled block', () => {
    renderBlock({ type: EmbedType.Other } as EmbedBlockValue, true);

    expect(
      screen.getByRole('button', { name: 'blocks.embeds.overview.editEmbed' })
    ).toBeDisabled();
  });
});
