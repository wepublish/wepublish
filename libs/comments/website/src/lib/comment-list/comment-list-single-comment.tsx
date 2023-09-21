import {css} from '@emotion/react'
import {styled} from '@mui/material'
import {CommentAuthorType} from '@wepublish/website/api'
import {BuilderCommentListSingleCommentProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MdPerson, MdVerified} from 'react-icons/md'

const avatarStyles = css`
  width: 46px;
  height: 46px;
  border-radius: 50%;
`

export const CommentListSingleCommentWrapper = styled('div')``

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
  className,
  text,
  authorType,
  user,
  guestUserImage,
  guestUsername,
  title,
  source,
  children,
  showContent = true
}: BuilderCommentListSingleCommentProps) => {
  const {
    elements: {Paragraph, Image},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const image = user?.image ?? guestUserImage
  const isVerified = authorType === CommentAuthorType.VerifiedUser
  const isGuest = authorType === CommentAuthorType.GuestUser
  const flair = user?.flair ?? source
  const name = user ? `${user.preferredName || user.firstName} ${user.name}` : guestUsername

  return (
    <CommentListSingleCommentWrapper className={className}>
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

      {showContent && (
        <CommentListSingleCommentContent>
          {title && (
            <Paragraph component="h1" gutterBottom={false}>
              <strong>{title}</strong>
            </Paragraph>
          )}
          <RichText richText={text ?? []} />
        </CommentListSingleCommentContent>
      )}

      {children}
    </CommentListSingleCommentWrapper>
  )
}
