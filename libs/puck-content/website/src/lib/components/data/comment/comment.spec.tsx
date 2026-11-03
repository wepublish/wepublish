import { mockComment, renderWithProviders } from '@wepublish/mocks/website';
import type { BuilderCommentBlockProps } from '@wepublish/website/builder';

import { emptyPuckBlockData } from '../../../blocks/block.types';
import { CommentRender } from './comment.render';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const renderComments = (props: BuilderCommentBlockProps) =>
  renderWithProviders(
    <CommentRender
      id="Comment-1"
      props={props}
      data={emptyPuckBlockData}
      slots={{}}
      className="styled"
    />
  );

describe('CommentRender', () => {
  it('keeps its placeholder comments in a root carrying the class name', () => {
    const { container } = renderComments({ comments: [] });

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.tagName).toBe('ARTICLE');
    expect(container.firstElementChild?.classList).toContain('styled');
    expect(container.firstElementChild?.childElementCount).toBe(0);
  });

  it('renders the comments of its props', () => {
    const { container } = renderComments({
      comments: [mockComment(), mockComment()],
    });

    expect(container.firstElementChild?.childElementCount).toBe(2);
  });
});
