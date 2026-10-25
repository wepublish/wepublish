import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SelectCommentPanel } from './selectCommentsPanel';

describe('SelectCommentPanel', () => {
  it('names the tag filter after its label', () => {
    render(
      <MockedProvider>
        <ThemeProvider theme={createTheme({ cssVariables: true })}>
          <MemoryRouter>
            <SelectCommentPanel
              selectedFilter={{ tags: [] }}
              onClose={vi.fn()}
              onSelect={vi.fn()}
            />
          </MemoryRouter>
        </ThemeProvider>
      </MockedProvider>
    );

    expect(
      screen.getByRole('combobox', { name: 'blocks.comment.filterByTag' })
    ).toBeInTheDocument();
  });
});
