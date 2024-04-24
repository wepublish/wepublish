import {styled} from '@mui/material'
import {CommentListContainer as BaseCommentListContainer, CommentWrapper} from '@wepublish/website'

export const CommentListContainer = styled(BaseCommentListContainer)`
  ${CommentWrapper} {
    background-color: white;

    :first-of-type {
      color: #ff0d63;
    }
  }
`
