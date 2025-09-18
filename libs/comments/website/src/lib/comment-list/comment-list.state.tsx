import {
  BuilderCommentListAction,
  BuilderCommentListActions,
  BuilderCommentListCloseAction,
  BuilderCommentListOpenAction,
  BuilderCommentListState,
  BuilderCommentListStateTypes,
} from '@wepublish/website/builder';
import { Reducer } from 'react';

export const isCommentListOpenAction = (
  action: BuilderCommentListAction
): action is BuilderCommentListOpenAction => action.action === 'open';

export const isCommentListCloseAction = (
  action: BuilderCommentListAction
): action is BuilderCommentListCloseAction => action.action === 'close';

const getCommentListStateKey = (
  type: BuilderCommentListStateTypes,
  commentId: string | null | undefined
): `${BuilderCommentListStateTypes}:${string | null}` =>
  `${type}:${commentId ?? null}`;

export const commentListReducer: Reducer<
  BuilderCommentListState,
  BuilderCommentListActions
> = (state, action) => {
  const key = getCommentListStateKey(action.type, action.commentId);

  if (isCommentListOpenAction(action)) {
    return {
      ...state,
      [key]: true,
    };
  }

  if (isCommentListCloseAction(action)) {
    return {
      ...state,
      [key]: false,
    };
  }

  return state;
};

export const getStateForEditor =
  (state: BuilderCommentListState) =>
  (type: BuilderCommentListStateTypes, commentId: string | null) =>
    state[getCommentListStateKey(type, commentId)];
