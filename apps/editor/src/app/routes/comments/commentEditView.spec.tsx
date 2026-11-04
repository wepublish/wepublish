import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import {
  type FullCommentFragment,
  type FullCommentRatingSystemFragment,
  type UpdateCommentMutationVariables,
  CommentDocument,
  CommentItemType,
  CommentListDocument,
  CommentState,
  RatingSystemDocument,
  RatingSystemType,
  UpdateCommentDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  renderFormRoutes,
  tagListMock,
} from '@wepublish/form/editor/testing';
import { AllPermissions } from '@wepublish/permissions';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

import { CommentEditView } from './commentEditView';

type Mock = MockLink.MockedResponse;

const anyVariables = () => true;

const admin: AuthContextState = {
  session: {
    email: 'admin@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'admin',
        name: 'admin',
        description: null,
        systemRole: true,
        permissions: AllPermissions.map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
};

function Admin({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={admin}>{children}</AuthContext.Provider>;
}

const text: RichtextJSONDocument = {
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', attrs: undefined, text: 'A thoughtful remark' }],
    },
  ],
};

const stored: FullCommentFragment = {
  __typename: 'Comment',
  id: 'comment-1',
  state: CommentState.Approved,
  rejectionReason: null,
  guestUsername: 'Anonymous',
  guestUserImage: null,
  user: null,
  revisions: [
    {
      __typename: 'CommentRevision',
      text,
      title: 'Old title',
      lead: 'Old lead',
      createdAt: '2026-01-02T10:00:00.000Z',
    },
  ],
  source: 'Letter',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-01-02T10:00:00.000Z',
  itemID: 'article-1',
  itemType: CommentItemType.Article,
  parentComment: null,
  tags: [],
  overriddenRatings: [
    { __typename: 'OverriddenRating', answerId: 'answer-1', value: 3 },
  ],
  featured: false,
};

const ratingSystem: FullCommentRatingSystemFragment = {
  __typename: 'CommentRatingSystem',
  id: 'rating-system',
  name: 'Rating',
  answers: [
    {
      __typename: 'CommentRatingSystemAnswer',
      id: 'answer-1',
      type: RatingSystemType.Star,
      answer: 'Quality',
      ratingSystemId: 'rating-system',
    },
    {
      __typename: 'CommentRatingSystemAnswer',
      id: 'answer-2',
      type: RatingSystemType.Star,
      answer: 'Tone',
      ratingSystemId: 'rating-system',
    },
  ],
};

const updated = vi.fn<(variables: UpdateCommentMutationVariables) => void>();

const mocks: Mock[] = [
  tagListMock([]),
  {
    request: { query: CommentDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data: { __typename: 'Query', comment: stored } },
  },
  {
    request: { query: RatingSystemDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data: { __typename: 'Query', ratingSystem } },
  },
  {
    request: { query: CommentListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        __typename: 'Query',
        comments: {
          __typename: 'PaginatedComments',
          nodes: [stored],
          pageInfo: {
            __typename: 'PageInfo',
            startCursor: null,
            endCursor: null,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          totalCount: 1,
        },
      },
    },
  },
  {
    request: { query: UpdateCommentDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: UpdateCommentMutationVariables) => {
      updated(variables);

      return { data: { __typename: 'Mutation', updateComment: stored } };
    },
  },
];

const renderEdit = () =>
  renderFormRoutes(
    { '/comments/edit/:id': <CommentEditView /> },
    { route: '/comments/edit/comment-1', mocks, wrapper: Admin }
  );

const titleField = () => getFieldByLabel(/^commentEditView\.title/);

beforeEach(() => {
  updated.mockReset();
});

describe('CommentEditView', () => {
  it('loads the last revision and the comment properties', async () => {
    renderEdit();

    await waitFor(() => expect(titleField()).toHaveValue('Old title'));
    expect(getFieldByLabel(/^commentEditView\.lead/)).toHaveValue('Old lead');
    expect(getFieldByLabel(/^commentUser\.guestUser/)).toHaveValue(
      'Anonymous'
    );
  });

  it('saves the properties without a new revision when the text is unchanged', async () => {
    const { user } = renderEdit();

    await waitFor(() => expect(titleField()).toHaveValue('Old title'));
    await user.click(screen.getByRole('checkbox', { name: /featured/ }));
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toEqual({
      id: 'comment-1',
      userID: null,
      guestUsername: 'Anonymous',
      guestUserImageID: null,
      source: 'Letter',
      tagIds: [],
      featured: true,
      ratingOverrides: [{ answerId: 'answer-1', value: 3 }],
    });
  });

  it('sends an overridden rating for an answer that had none', async () => {
    const { user } = renderEdit();

    await waitFor(() => expect(titleField()).toHaveValue('Old title'));
    await user.click(screen.getByRole('combobox', { name: 'Tone' }));
    await user.click(await screen.findByRole('option', { name: '5' }));
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0].ratingOverrides).toEqual([
      { answerId: 'answer-1', value: 3 },
      { answerId: 'answer-2', value: 5 },
    ]);
  });

  it('links to the commented article and shows the thread', async () => {
    renderEdit();

    expect(
      await screen.findByRole('link', { name: 'commentEditView.goToArticle' })
    ).toHaveAttribute('href', '/articles/edit/article-1');
    expect(
      await formSectionOf('commentEditView.commentContextHeader').findByText(
        /A thoughtful remark/
      )
    ).toBeInTheDocument();
  });

  it('saves a new revision when the title changes and closes', async () => {
    const { user, currentPath } = renderEdit();

    await waitFor(() => expect(titleField()).toHaveValue('Old title'));
    await user.clear(titleField());
    await user.type(titleField(), 'New title');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0].revision).toEqual({
      title: 'New title',
      lead: 'Old lead',
      text,
    });
    await waitFor(() => expect(currentPath()).toBe('/comments'));
  });
});
