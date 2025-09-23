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

export const getStateForEditor = (state: BuilderCommentListState) => {
  console.log('getStateForEditor', state);
  return (type: BuilderCommentListStateTypes, commentId: string | null) => {
    console.log('getStateForEditor1: type', type, 'commentId', commentId);
    console.log(
      'getStateForEditor2: getCommentListStateKey: key',
      getCommentListStateKey(type, commentId)
    );
    console.log(
      'getStateForEditor3: state[key]',
      state[getCommentListStateKey(type, commentId)]
    );
    return state[getCommentListStateKey(type, commentId)];
  };
};
