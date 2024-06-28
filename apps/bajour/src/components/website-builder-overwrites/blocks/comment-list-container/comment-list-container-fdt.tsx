import {styled} from '@mui/material'
import {
  CommentContent,
  CommentEditorWrapper,
  CommentHeader,
  CommentListContainer as BaseCommentListContainer,
  CommentListItemActions,
  CommentListItemChildren,
  CommentReplyButton,
  CommentWrapper
} from '@wepublish/website'

export const CommentListContainer = styled(BaseCommentListContainer)`
  > *:nth-of-type(-n + 2) {
    ${CommentListItemActions} {
      background-color: ${({theme}) => theme.palette.secondary.light};
      border-bottom-right-radius: ${({theme}) => theme.spacing(2.5)};
      border-bottom-left-radius: ${({theme}) => theme.spacing(2.5)};
      padding: ${({theme}) => theme.spacing(1.5)};
    }

    ${CommentContent} {
      background-color: ${({theme}) => theme.palette.secondary.light};
    }

    ${CommentHeader} {
      background-color: ${({theme}) => theme.palette.secondary.light};
      border-top-right-radius: ${({theme}) => theme.spacing(2.5)};
      border-top-left-radius: ${({theme}) => theme.spacing(2.5)};
    }
  }

  ${CommentListItemChildren} {
    background-color: ${({theme}) => theme.palette.common.white};
    padding-top: ${({theme}) => theme.spacing(1)};

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
      padding-top: 0;
      padding-bottom: 0;
      background-color: ${({theme}) => theme.palette.common.white};
    }

    ${CommentListItemActions} {
      background-color: ${({theme}) => theme.palette.common.white};
      padding: ${({theme}) => theme.spacing(1.5)};
      border-bottom-right-radius: ${({theme}) => theme.spacing(2.5)};
      border-bottom-left-radius: ${({theme}) => theme.spacing(2.5)};
    }

    ${CommentReplyButton} {
      display: none;
    }
  }

  ${CommentWrapper} {
    gap: 0;
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
    padding: ${({theme}) => theme.spacing(1.5)};
  }

  ${CommentEditorWrapper} {
    margin-top: ${({theme}) => theme.spacing(2)};
  }
`
