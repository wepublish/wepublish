import styled from '@emotion/styled';
import { CommentList, CommentListActions } from '@wepublish/comments/website';

export const HauptstadtCommentList = styled(CommentList)`
  ${CommentListActions} {
    justify-content: start;
  }
`;
