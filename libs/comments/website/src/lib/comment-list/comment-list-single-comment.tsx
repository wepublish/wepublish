import {css} from '@emotion/react'
import {styled} from '@mui/material'
import {useUser} from '@wepublish/authentication/website'
import {CommentAuthorType, CommentState} from '@wepublish/website/api'
import {BuilderCommentListItemProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {cond} from 'ramda'
import {MdEdit, MdPerson, MdReply, MdVerified} from 'react-icons/md'
import {getStateForEditor} from './comment-list.state'

const avatarStyles = css`
  width: 46px;
  height: 46px;
  border-radius: 50%;
`

// export const CommentListSingleCommentWrapper = styled('article')`
//   display: grid;
//   gap: ${({theme}) => theme.spacing(2)};
// `

export const CommentListSingleCommentHeader = styled('header')`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({theme}) => theme.spacing(2)};
  align-items: center;
`

export const CommentListSingleCommentHeaderContent = styled('div')``

export const CommentListSingleCommentName = styled('div')`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: center;
  font-weight: ${({theme}) => theme.typography.fontWeightBold};
`

export const CommentListSingleCommentVerifiedBadge = styled('div')`
  display: grid;
  align-items: center;
  color: ${({theme}) => theme.palette.info.main};
`

export const CommentListSingleCommentFlair = styled('div')<{isGuest: boolean}>`
  font-size: 0.75em;

  ${({isGuest, theme}) =>
    isGuest &&
    css`
      color: ${theme.palette.primary.main};
    `}
`

export const CommentListSingleCommentContent = styled('div')``

export const CommentListSingleCommentChildren = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  border-left: 2px solid currentColor;
  padding: ${({theme}) => theme.spacing(3)};
  padding-right: 0;
`

export const CommentListSingleCommentActions = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
`

export const CommentListSingleComment = ({
  id,
  className,
  text,
  authorType,
  user,
  guestUserImage,
  guestUsername,
  title,
  source,
  state,
  children,
  anonymousCanComment,
  anonymousCanRate,
  userCanEdit,
  maxCommentLength,
  challenge,
  add,
  onAddComment,
  edit,
  onEditComment,
  openEditorsState,
  openEditorsStateDispatch: dispatch
}) => {
  const {
    CommentEditor,
    CommentListSingleComment: BuilderCommentListSingleComment,
    elements: {Paragraph, Image, Button},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const image = user?.image ?? guestUserImage
  const isVerified = authorType === CommentAuthorType.VerifiedUser
  const isGuest = authorType === CommentAuthorType.GuestUser
  const flair = user?.flair ?? source
  const name = user ? `${user.preferredName || user.firstName} ${user.name}` : guestUsername

  return (
    <>
      <CommentListSingleCommentHeader>
        {image && <Image image={image} square css={avatarStyles} />}
        {!image && <MdPerson css={avatarStyles} />}

        <CommentListSingleCommentHeaderContent>
          <CommentListSingleCommentName>
            {name}

            {isVerified && (
              <CommentListSingleCommentVerifiedBadge>
                <MdVerified title="Member" />
              </CommentListSingleCommentVerifiedBadge>
            )}
          </CommentListSingleCommentName>

          {flair && (
            <CommentListSingleCommentFlair isGuest={isGuest}>{flair}</CommentListSingleCommentFlair>
          )}
        </CommentListSingleCommentHeaderContent>
      </CommentListSingleCommentHeader>

      <CommentListSingleCommentStateWarnings state={state} />

      {/* {!showEdit && ( */}
      <CommentListSingleCommentContent>
        {title && (
          <Paragraph component="h1" gutterBottom={false}>
            <strong>{title}</strong>
          </Paragraph>
        )}
        <RichText richText={text ?? []} />
      </CommentListSingleCommentContent>
      {/* )} */}

      {!!children?.length && (
        <CommentListSingleCommentChildren>
          {children.map(child => (
            <BuilderCommentListSingleComment
              key={child.id}
              {...child}
              openEditorsState={openEditorsState}
              openEditorsStateDispatch={dispatch}
              add={add}
              onAddComment={onAddComment}
              edit={edit}
              onEditComment={onEditComment}
              challenge={challenge}
              anonymousCanComment={anonymousCanComment}
              anonymousCanRate={anonymousCanRate}
              userCanEdit={userCanEdit}
              maxCommentLength={maxCommentLength}
              className={className}
            />
          ))}
        </CommentListSingleCommentChildren>
      )}
    </>
  )
}

const CommentListSingleCommentStateWarnings = (
  props: Pick<BuilderCommentListItemProps, 'state'>
) => {
  const {
    elements: {Alert}
  } = useWebsiteBuilder()

  return cond([
    [
      ({state}) => state === CommentState.PendingApproval,
      () => <Alert severity="info">Kommentar wartet auf Freischaltung.</Alert>
    ],
    [
      ({state}) => state === CommentState.PendingUserChanges,
      () => <Alert severity="warning">Kommentar muss editiert werden bevor Freischaltung.</Alert>
    ],
    [
      ({state}) => state === CommentState.Rejected,
      () => <Alert severity="error">Kommentar wurde nicht freigeschalten.</Alert>
    ]
  ])(props)
}
