import { screen } from '@testing-library/react';
import {
  mockComment,
  mockImage,
  mockRichTextParagraph,
  mockUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderCommentProps } from '@wepublish/website/builder';
import { CommentAuthorType } from '@wepublish/website/api';
import { omit } from 'ramda';
import { Comment } from './comment';

const user = mockUser({
  firstName: 'Anna',
  name: 'Muster',
  flair: 'Redaktorin',
  image: mockImage({ description: 'Portrait of Anna Muster' }),
});

const verifiedUserComment = omit(
  ['children'],
  mockComment({
    id: 'comment-1',
    user,
    authorType: CommentAuthorType.VerifiedUser,
    guestUsername: null,
    guestUserImage: null,
    source: null,
    title: 'A strong opinion',
    text: mockRichTextParagraph('I disagree with the premise.'),
  })
);

const guestComment = omit(
  ['children'],
  mockComment({
    id: 'comment-2',
    user: null,
    guestUsername: 'Barfoo',
    guestUserImage: mockImage({ description: 'Guest avatar' }),
    source: 'Leserbrief',
  })
);

const formatDate = (date: Date) => `formatted ${date.toISOString()}`;

const renderComment = (props: Partial<BuilderCommentProps> = {}) =>
  renderWithProviders(
    <Comment
      {...verifiedUserComment}
      {...props}
    />,
    { builder: { date: { format: formatDate } } }
  );

describe('Comment', () => {
  it('shows the full name, flair, avatar, title and text of a verified user', () => {
    renderComment();

    expect(screen.getByText('Anna Muster')).toBeInTheDocument();
    expect(screen.getByText('Redaktorin')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Portrait of Anna Muster' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'A strong opinion' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('I disagree with the premise.')
    ).toBeInTheDocument();
  });

  it('shows only the last name when the user has no first name', () => {
    renderComment({ user: { ...user, firstName: null } });

    expect(screen.getByText('Muster')).toBeInTheDocument();
  });

  it('shows the guest name, guest avatar and source of a guest comment', () => {
    renderComment(guestComment);

    expect(screen.getByText('Barfoo')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Guest avatar' })
    ).toBeInTheDocument();
    expect(screen.getByText('Leserbrief')).toBeInTheDocument();
  });

  it('falls back to a placeholder avatar when there is no image', () => {
    renderComment({ user: { ...user, image: null } });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('links the source when it is a URL', () => {
    renderComment({
      user: { ...user, flair: null },
      source: 'https://example.com/letter',
    });

    const link = screen.getByRole('link', {
      name: 'https://example.com/letter',
    });

    expect(link).toHaveAttribute('href', 'https://example.com/letter');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('prefers the user flair over the source', () => {
    renderComment({ source: 'Leserbrief' });

    expect(screen.getByText('Redaktorin')).toBeInTheDocument();
    expect(screen.queryByText('Leserbrief')).not.toBeInTheDocument();
  });

  it('shows the date instead of a missing flair', () => {
    renderComment({ user: { ...user, flair: null } });

    expect(
      screen.getByText(formatDate(new Date(verifiedUserComment.createdAt)))
    ).toBeInTheDocument();
  });

  it('shows the date next to the flair only when asked to', () => {
    const { rerender } = renderComment();

    expect(
      screen.queryByText(formatDate(new Date(verifiedUserComment.createdAt)))
    ).not.toBeInTheDocument();

    rerender(
      <Comment
        {...verifiedUserComment}
        showDateWithFlair
      />
    );

    expect(screen.getByText('Redaktorin')).toBeInTheDocument();
    expect(
      screen.getByText(formatDate(new Date(verifiedUserComment.createdAt)))
    ).toBeInTheDocument();
  });

  it('hides the title and text when the content is hidden', () => {
    renderComment({ showContent: false });

    expect(screen.getByText('Anna Muster')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'A strong opinion' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('I disagree with the premise.')
    ).not.toBeInTheDocument();
  });

  it('uses the comment id as anchor unless anchors are turned off', () => {
    const { rerender } = renderComment();

    expect(screen.getByRole('article')).toHaveAttribute('id', 'comment-1');

    rerender(
      <Comment
        {...verifiedUserComment}
        includeAnchor={false}
      />
    );

    expect(screen.getByRole('article')).not.toHaveAttribute('id');
  });

  it('renders its children below the comment', () => {
    renderComment({ children: <button>Reply</button> });

    expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
  });
});
