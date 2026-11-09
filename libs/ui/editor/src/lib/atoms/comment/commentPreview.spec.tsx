import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  CommentItemType,
  CommentState,
  FullCommentFragment,
} from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';

import { CommentPreview } from './commentPreview';

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn(), { loading: false, error: undefined }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../blocks/richTextBlock/rich-text-block', () => ({
  RichTextBlock: (props: { 'aria-labelledby'?: string }) => (
    <div
      role="textbox"
      aria-labelledby={props['aria-labelledby']}
    />
  ),
}));

const theme = createTheme({ cssVariables: true });

const comment = {
  id: 'c1',
  itemID: 'a1',
  itemType: CommentItemType.Article,
  state: CommentState.PendingApproval,
  createdAt: '2026-01-01T00:00:00.000Z',
  guestUsername: 'Anna',
  revisions: [],
  tags: [],
  source: null,
} as unknown as FullCommentFragment;

const renderPreview = (originComment?: FullCommentFragment) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <CommentPreview
          comment={comment}
          originComment={originComment}
        />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('CommentPreview', () => {
  it('names its panel after the comment it belongs to', () => {
    renderPreview(comment);

    const summary = screen.getByRole('button', { name: /Anna/ });
    const region = screen.getByRole('region', { name: /Anna/ });

    expect(summary).toHaveAttribute('aria-controls', region.id);
  });

  it('nests its tag and source headings below the comment heading', () => {
    renderPreview();
    fireEvent.click(screen.getByRole('button', { name: /Anna/ }));

    const panel = screen.getByRole('heading', { level: 3, name: /Anna/ })
      .parentElement as HTMLElement;

    expect(
      within(panel).getByRole('heading', {
        level: 4,
        name: 'tags.overview.title',
      })
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole('heading', {
        level: 4,
        name: 'commentPreview.source',
      })
    ).toBeInTheDocument();
  });

  it('names the comment editor after its label', () => {
    renderPreview(comment);

    expect(
      screen.getByRole('textbox', { name: 'commentEditView.comment' })
    ).toBeInTheDocument();
  });
});
