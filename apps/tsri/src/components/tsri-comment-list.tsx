import styled from '@emotion/styled';
import {
  CommentList,
  CommentListActions,
  CommentListItemActions,
} from '@wepublish/comments/website';

export const TsriCommentList = styled(CommentList)`
  grid-column: -1 / 1 !important;

  & > .MuiAlert-root {
    padding-top: 2rem;
    padding-bottom: 2rem;
    border-radius: 1rem;
  }

  & ${CommentListActions} {
    & > .MuiButtonBase-root {
      color: ${({ theme }) => theme.palette.common.white};
      transition: none;

      &:hover {
        background-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
      }
    }
  }

  & ${CommentListItemActions} {
    & .MuiButtonBase-root {
      transition: none;

      &:hover {
        background-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
        border-color: ${({ theme }) => theme.palette.primary.light};
      }
    }
  }
`;
