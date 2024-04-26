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
    border-left-color: ${({theme}) => theme.palette.secondary.main};

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

  ${CommentHeader} {
    padding: ${({theme}) => theme.spacing(1.5)};
    background-color: ${({theme}) => theme.palette.secondary.main};
    border-top-right-radius: ${({theme}) => theme.spacing(2.5)};
    border-top-left-radius: ${({theme}) => theme.spacing(2.5)};
  }

  ${CommentContent} {
    background-color: ${({theme}) => theme.palette.secondary.main};
    padding: ${({theme}) => theme.spacing(1.5)};
  }

  ${CommentListItemActions} {
    background-color: ${({theme}) => theme.palette.secondary.main};
    padding: ${({theme}) => theme.spacing(1.5)};
    border-bottom-right-radius: ${({theme}) => theme.spacing(2.5)};
    border-bottom-left-radius: ${({theme}) => theme.spacing(2.5)};
  }
`
