import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditorBlockType, FullAuthorFragment } from '@wepublish/editor/api';

import { AuthorsBlock } from './authorsBlock';
import { AuthorsBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

const author = (id: string, name: string) =>
  ({ __typename: 'Author', id, name }) as FullAuthorFragment;

const renderBlock = (onChange = vi.fn()) =>
  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <AuthorsBlock
          type={EditorBlockType.Authors}
          value={
            {
              title: 'Stiftungsrat',
              authors: [
                { id: '1', value: author('a', 'Stephan Agnolazza') },
                { id: '2', value: author('b', 'Manuel Bertschi') },
              ],
            } as AuthorsBlockValue
          }
          onChange={onChange}
        />
      </ThemeProvider>
    </MockedProvider>
  );

describe('AuthorsBlock', () => {
  it('shows the title and every chosen author', () => {
    renderBlock();

    expect(
      screen.getByRole('textbox', { name: 'blocks.authors.title' })
    ).toHaveValue('Stiftungsrat');
    expect(screen.getByDisplayValue('Stephan Agnolazza')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Manuel Bertschi')).toBeInTheDocument();
  });

  it('changes the title', () => {
    const onChange = vi.fn();
    renderBlock(onChange);

    fireEvent.change(
      screen.getByRole('textbox', { name: 'blocks.authors.title' }),
      { target: { value: 'Team' } }
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Team' })
    );
  });
});
