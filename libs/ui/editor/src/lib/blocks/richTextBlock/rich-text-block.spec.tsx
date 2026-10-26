import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';

import { RichTextBlock } from './rich-text-block';

const theme = createTheme({ cssVariables: true });

const renderBlock = (
  props: Partial<ComponentProps<typeof RichTextBlock>> = {}
) =>
  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <span id="field-label">Biography</span>
        <RichTextBlock
          value={undefined}
          onChange={vi.fn()}
          {...props}
        />
      </ThemeProvider>
    </MockedProvider>
  );

describe('RichTextBlock', () => {
  it('names the editable area after the block type by default', () => {
    renderBlock();

    expect(
      screen.getByRole('textbox', { name: 'blocks.richText.label' })
    ).toBeInTheDocument();
  });

  it('lets the caller name the editable area with aria-labelledby', () => {
    renderBlock({ 'aria-labelledby': 'field-label' });

    expect(
      screen.getByRole('textbox', { name: 'Biography' })
    ).toBeInTheDocument();
  });

  it('lets the caller name the editable area with aria-label', () => {
    renderBlock({ 'aria-label': 'Lead' });

    expect(screen.getByRole('textbox', { name: 'Lead' })).toBeInTheDocument();
  });
});
