import { screen } from '@testing-library/react';
import {
  mockComment,
  mockCommentBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderCommentProps } from '@wepublish/website/builder';
import { CommentBlock } from './comment-block';

describe('CommentBlock', () => {
  it('shows every selected comment in order', () => {
    renderWithProviders(
      <CommentBlock
        {...mockCommentBlock({
          comments: [
            mockComment({ title: 'First opinion' }),
            mockComment({ title: 'Second opinion' }),
            mockComment({ title: 'Third opinion' }),
          ],
        })}
      />
    );

    expect(
      screen.getAllByText(/opinion$/).map(title => title.textContent)
    ).toEqual(['First opinion', 'Second opinion', 'Third opinion']);
  });

  it('shows the comments without their replies and without anchors', () => {
    const Comment = vi.fn(({ title }: BuilderCommentProps) => <p>{title}</p>);
    const comment = mockComment({
      title: 'Opinion',
      children: [mockComment({ title: 'Reply' })],
    });

    renderWithProviders(
      <CommentBlock {...mockCommentBlock({ comments: [comment] })} />,
      { builder: { Comment } }
    );

    expect(screen.getByText('Opinion')).toBeInTheDocument();
    expect(Comment).toHaveBeenCalledWith(
      expect.objectContaining({ id: comment.id, includeAnchor: false }),
      undefined
    );
    expect(Comment.mock.calls[0][0]).not.toHaveProperty('children');
  });
});
