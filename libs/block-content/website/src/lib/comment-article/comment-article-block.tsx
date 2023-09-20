import {styled} from '@mui/material'
// import {useUser} from '@wepublish/authentication/website'
// import {Button} from '@wepublish/ui'
// import {Comment} from '@wepublish/website/api'
import {BuilderCommentBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
// import {MdForum} from 'react-icons/md'
// import {getStateForEditor} from './comment-list.state'

export const CommentArticleBlockWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
`

export const CommentArticleBlockActions = styled('div')``

export const CommentArticleBlock = ({className, comments}: BuilderCommentBlockProps) => {
  const {CommentListItem, CommentListSingleComment: BuilderCommentListSingleComment} =
    useWebsiteBuilder()
  // const {hasUser} = useUser()

  // const showReply = getStateForEditor(openEditorsState)('add', null)
  // const canReply = anonymousCanComment || hasUser

  return (
    <CommentArticleBlockWrapper className={className}>
      {/*   */}

      {comments?.map(comment => (
        <BuilderCommentListSingleComment
          key={comment.id}
          {...comment}
          openEditorsState={{}}
          openEditorsStateDispatch={() => null}
          challenge={{data: {}}}
          // add={{}}
          onAddComment={() => null}
          // edit={{}}
          onEditComment={() => null}
          anonymousCanComment={false}
          anonymousCanRate={false}
          userCanEdit={false}
          maxCommentLength={10}
          // children={(comment.children as Comment[]) ?? []}
        />
      ))}
    </CommentArticleBlockWrapper>
  )
}
