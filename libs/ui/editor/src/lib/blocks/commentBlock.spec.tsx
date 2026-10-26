import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { CommentBlock } from './commentBlock';
import { CommentBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options?.count != null ? `${key} ${options.count}` : key,
  }),
}));

const renderBlock = (comments: unknown[]) =>
  render(
    <ThemeProvider theme={theme}>
      <CommentBlock
        type={EditorBlockType.Comment}
        value={{ filter: {}, comments } as unknown as CommentBlockValue}
        onChange={vi.fn()}
      />
    </ThemeProvider>
  );

describe('CommentBlock', () => {
  it('spells out how to choose comments when empty', () => {
    renderBlock([]);

    expect(screen.getByText('blocks.comment.chooseComments')).toBeVisible();
  });

  it('summarises the chosen comments next to an edit button', () => {
    renderBlock([{ id: '1' }, { id: '2' }]);

    expect(screen.getByText('blocks.comment.comments 2')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'blocks.comment.edit' })
    ).toBeInTheDocument();
  });
});
