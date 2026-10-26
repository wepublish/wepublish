import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { TeaserContent, TeaserGridBlock } from './teaserGridBlock';
import { TeaserGridBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

describe('TeaserGridBlock', () => {
  it('draws each teaser with a single border', () => {
    const { container } = render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <TeaserGridBlock
            type={EditorBlockType.TeaserGrid6}
            value={
              {
                title: '',
                numColumns: 3,
                teasers: [
                  ['teaser-1', null],
                  ['teaser-2', null],
                ],
              } as TeaserGridBlockValue
            }
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    expect(container.querySelector('.MuiPaper-outlined')).toBeNull();
  });

  it('rounds the overlay itself so its blur does not show square corners', () => {
    render(
      <ThemeProvider theme={theme}>
        <TeaserContent title="Hallo Welt" />
      </ThemeProvider>
    );

    const overlay = screen
      .getByText('Hallo Welt')
      .closest('[class*=Overlay]') as HTMLElement;

    expect(overlay).toHaveStyle({
      'border-bottom-left-radius': `${theme.shape.borderRadius}px`,
      'border-bottom-right-radius': `${theme.shape.borderRadius}px`,
    });
  });
});
