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
import { theme } from '@wepublish/ui';

export const CommentListContainer = styled(BaseCommentListContainer)`
  ${CommentListItemChildren} {
    background-color: ${({ theme }) => theme.palette.common.white};
    padding-top: ${({ theme }) => theme.spacing(1)};
    border-color: ${({ theme }) => theme.palette.secondary.light};

    ${CommentWrapper} {
      background-color: ${({ theme }) => theme.palette.common.white};
      padding: 0;
    }

    ${CommentHeader} {
      background-color: ${({ theme }) => theme.palette.common.white};
      border-top-right-radius: ${({ theme }) => theme.spacing(2.5)};
      border-top-left-radius: ${({ theme }) => theme.spacing(2.5)};
    }

    ${CommentContent} {
      padding-top: 0;
      padding-bottom: 0;
      background-color: ${({ theme }) => theme.palette.common.white};
    }

    ${CommentListItemActions} {
      background-color: ${({ theme }) => theme.palette.common.white};
      padding: ${({ theme }) => theme.spacing(1.5)};
      border-bottom-right-radius: ${({ theme }) => theme.spacing(2.5)};
      border-bottom-left-radius: ${({ theme }) => theme.spacing(2.5)};
    }
  }

  ${CommentContent} {
    padding-top: 0;
    padding-bottom: 0;
    span {
      // what other way to style <RichText /> ?
      font-weight: 300;
      line-height: 1.2;
    }
  }

  ${CommentListItemActions} {
    padding: ${({ theme }) => theme.spacing(1.5)};
    margin-bottom: 0;
  }

  ${theme.breakpoints.up('md')} {
    max-width: ${({ theme }) => theme.spacing(95)};
    width: ${({ theme }) => theme.spacing(95)};
    margin: 0 auto;
  }

  ${CommentEditorWrapper} {
    margin-top: ${({ theme }) => theme.spacing(2)};
  }
`;
