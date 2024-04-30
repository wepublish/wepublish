import {styled} from '@mui/material'
import {
  CommentContent,
  CommentHeader,
  CommentListContainer as BaseCommentListContainer,
  CommentListItemActions,
  CommentListItemChildren,
  CommentWrapper
} from '@wepublish/website'

export const CommentListContainer = styled(BaseCommentListContainer)`
  ${CommentListItemChildren} {
    background-color: ${({theme}) => theme.palette.common.white};
    margin-top: ${({theme}) => theme.spacing(3)};

    &::before {
      background-color: ${({theme}) => theme.palette.secondary.light};
    }

    ${CommentWrapper} {
      background-color: ${({theme}) => theme.palette.common.white};
      padding: 0;
    }

    ${CommentHeader} {
      padding: ${({theme}) => theme.spacing(1.5)};
      background-color: ${({theme}) => theme.palette.common.white};
      border-top-right-radius: ${({theme}) => theme.spacing(2.5)};
      border-top-left-radius: ${({theme}) => theme.spacing(2.5)};
    }

    ${CommentContent} {
      background-color: ${({theme}) => theme.palette.common.white};
      padding: ${({theme}) => theme.spacing(1.5)};
    }

    ${CommentListItemActions} {
      background-color: ${({theme}) => theme.palette.common.white};
      padding: ${({theme}) => theme.spacing(1.5)};
      border-bottom-right-radius: ${({theme}) => theme.spacing(2.5)};
      border-bottom-left-radius: ${({theme}) => theme.spacing(2.5)};
    }
  }

  ${CommentWrapper} {
    gap: 0;
  }

  ${CommentHeader} {
    padding: ${({theme}) => theme.spacing(1.5)};
    background-color: ${({theme}) => theme.palette.secondary.light};
    border-top-right-radius: ${({theme}) => theme.spacing(2.5)};
    border-top-left-radius: ${({theme}) => theme.spacing(2.5)};
  }

  ${CommentContent} {
    background-color: ${({theme}) => theme.palette.secondary.light};
    padding: ${({theme}) => theme.spacing(1.5)};
    span {
      // what other way to style <RichText /> ?
      font-weight: 300;
      line-height: 1.2;
    }
  }

  ${CommentListItemActions} {
    background-color: ${({theme}) => theme.palette.secondary.light};
    padding: ${({theme}) => theme.spacing(1.5)};
    border-bottom-right-radius: ${({theme}) => theme.spacing(2.5)};
    border-bottom-left-radius: ${({theme}) => theme.spacing(2.5)};
  }
`
