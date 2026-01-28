import styled from '@emotion/styled';
import {
  CommentContent,
  CommentEditorWrapper,
  CommentHeader,
  CommentListContainer as BaseCommentListContainer,
  CommentListItemActions,
  CommentListItemChildren,
  CommentWrapper,
} from '@wepublish/comments/website';

export const CommentListContainer = styled(BaseCommentListContainer)`
  > ${CommentWrapper}:nth-of-type(-n + 2) {
    background-color: ${({ theme }) => theme.palette.secondary.light};
    border-radius: ${({ theme }) => theme.spacing(2.5)};
    padding: ${({ theme }) => theme.spacing(1.5)};

    ${CommentListItemChildren} {
      padding-right: ${({ theme }) => theme.spacing(3)};
      border-left: 0;
    }
  }

  ${CommentListItemChildren} {
    background-color: ${({ theme }) => theme.palette.common.white};
    border-color: ${({ theme }) => theme.palette.secondary.light};

    ${CommentWrapper} {
      background-color: ${({ theme }) => theme.palette.common.white};
    }

    ${CommentHeader} {
      background-color: ${({ theme }) => theme.palette.common.white};
      border-top-right-radius: ${({ theme }) => theme.spacing(2.5)};
      border-top-left-radius: ${({ theme }) => theme.spacing(2.5)};
    }

    ${CommentContent} {
      background-color: ${({ theme }) => theme.palette.common.white};
    }

    ${CommentListItemActions} {
      background-color: ${({ theme }) => theme.palette.common.white};
      border-bottom-right-radius: ${({ theme }) => theme.spacing(2.5)};
      border-bottom-left-radius: ${({ theme }) => theme.spacing(2.5)};
    }
  }

  ${CommentContent} {
    padding-bottom: 0;
    span {
      // what other way to style <RichText /> ?
      font-weight: 300;
      line-height: 1.2;
    }
  }

  ${CommentEditorWrapper} {
    margin-top: ${({ theme }) => theme.spacing(2)};
  }
`;
