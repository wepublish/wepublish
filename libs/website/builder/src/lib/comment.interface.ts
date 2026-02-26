import { ApolloError, MutationResult, QueryResult } from '@apollo/client';
import {
  AddCommentMutation,
  AddCommentMutationVariables,
  CalculatedRating,
  ChallengeQuery,
  CommentListQuery,
  CommentListQueryVariables,
  CommentWithoutNestingFragment,
  EditCommentMutation,
  EditCommentMutationVariables,
  FullCommentFragment,
  FullCommentRatingFragment,
  CommentRatingSystem,
  OverriddenRating,
} from '@wepublish/website/api';
import { Dispatch, PropsWithChildren } from 'react';
import { Node } from 'slate';

export type BuilderCommentListStateTypes = 'add' | 'edit';

export type BuilderCommentListAction = {
  action: string;
};

export type BuilderCommentListOpenAction = {
  action: 'open';
  type: BuilderCommentListStateTypes;
  commentId: string | null | undefined;
};

export type BuilderCommentListCloseAction = {
  action: 'close';
  type: BuilderCommentListStateTypes;
  commentId: string | null | undefined;
};

export type BuilderCommentListActions =
  | BuilderCommentListOpenAction
  | BuilderCommentListCloseAction;

export type BuilderCommentListState = Record<
  `${BuilderCommentListStateTypes}:${string | null}`,
  boolean
>;

export type BuilderCommentListProps = Pick<
  QueryResult<CommentListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  anonymousCanComment?: boolean;
  anonymousCanRate?: boolean;
  userCanEdit?: boolean;
  maxCommentLength: number;
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>;

  variables?: Omit<CommentListQueryVariables, 'itemId'>;
  onVariablesChange?: (
    variables: Omit<CommentListQueryVariables, 'itemId'>
  ) => void;

  add: MutationResult<AddCommentMutation>;
  onAddComment: (
    variables: Omit<
      AddCommentMutationVariables,
      'itemID' | 'itemType' | 'peerId'
    >
  ) => void;

  edit: MutationResult<EditCommentMutation>;
  onEditComment: (variables: EditCommentMutationVariables) => void;

  openEditorsState: BuilderCommentListState;
  openEditorsStateDispatch: Dispatch<BuilderCommentListActions>;

  signUpUrl: string;
  maxCommentDepth?: number;
};

export type BuilderCommentListItemShareProps = {
  className?: string;
  url: string;
  title: string;
  forceNonSystemShare?: boolean;
};

export type BuilderCommentListItemProps = (CommentWithoutNestingFragment & {
  children?: CommentWithoutNestingFragment[] | null;
}) & {
  className?: string;
  ratingSystem: CommentRatingSystem;
  signUpUrl: string;
  commentDepth?: number;
  maxCommentDepth?: number;
} & Pick<
    BuilderCommentListProps,
    | 'anonymousCanComment'
    | 'anonymousCanRate'
    | 'maxCommentLength'
    | 'userCanEdit'
    | 'challenge'
    | 'add'
    | 'onAddComment'
    | 'edit'
    | 'onEditComment'
    | 'openEditorsState'
    | 'openEditorsStateDispatch'
  >;

export type BuilderCommentProps = PropsWithChildren<
  Pick<
    FullCommentFragment,
    | 'text'
    | 'authorType'
    | 'user'
    | 'guestUserImage'
    | 'featured'
    | 'guestUsername'
    | 'title'
    | 'source'
    | 'createdAt'
    | 'id'
    | 'tags'
  > & {
    className?: string;
    showContent?: boolean;
    includeAnchor?: boolean;
  }
>;

type CreateCommentProps = {
  text?: never;
  title?: never;
  lead?: never;
  challenge: Pick<
    QueryResult<ChallengeQuery>,
    'data' | 'loading' | 'error'
  > | null;
  onSubmit: (
    data: Omit<
      AddCommentMutationVariables,
      'itemID' | 'itemType' | 'parentID' | 'peerId'
    >
  ) => void;
};

type EditCommentProps = {
  text?: Node[] | null;
  title?: string | null;
  lead?: string | null;
  challenge?: never;
  onSubmit: (data: Omit<EditCommentMutationVariables, 'id'>) => void;
};

export type BuilderCommentEditorProps = {
  onCancel: () => void;
  className?: string;
  maxCommentLength: number;
  loading: boolean;
  error?: ApolloError;
  canReply: boolean;
  parentUrl?: string;
  signUpUrl?: string;
  anonymousCanComment?: boolean;
} & (CreateCommentProps | EditCommentProps);

export type BuilderCommentRatingsProps = {
  commentId: string;
  ratingSystem: CommentRatingSystem;
  userRatings: FullCommentRatingFragment[];
  calculatedRatings: CalculatedRating[];
  overriddenRatings: OverriddenRating[];
};
