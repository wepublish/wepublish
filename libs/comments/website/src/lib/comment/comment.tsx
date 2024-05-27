import {css} from '@emotion/react'
import {styled} from '@mui/material'
import {CommentAuthorType} from '@wepublish/website/api'
import {BuilderCommentProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MdPerson, MdVerified} from 'react-icons/md'

import {format} from 'date-fns'
import {de} from 'date-fns/locale'
import {useEffect, useState} from 'react'

function formatCommentDate(isoDateString: string): string {
  const date: Date = new Date(isoDateString)

  const formattedDate: string = format(date, 'd. MMMM yyyy | HH:mm', {locale: de})

  return formattedDate
}

const avatarStyles = css`
  width: 46px;
  height: 46px;
  border-radius: 50%;
`

export const CommentWrapper = styled('article')<{highlight?: boolean}>`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};

  ${({highlight, theme}) =>
    highlight &&
    css`
      border: 2px solid ${theme.palette.primary.main};
      border-radius: ${theme.spacing(2.5)};
    `}
`

export const CommentHeader = styled('header')<{isTopComment?: boolean}>`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({theme}) => theme.spacing(2)};
  align-items: center;
  padding: ${({theme}) => theme.spacing(1.5)};

  ${({isTopComment, theme}) =>
    isTopComment &&
    css`
      background-color: ${theme.palette.secondary.light};
      border-top-right-radius: ${theme.spacing(2.5)};
      border-top-left-radius: ${theme.spacing(2.5)};
    `}
`

export const CommentHeaderContent = styled('div')``

export const CommentName = styled('div')`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: center;
  font-weight: ${({theme}) => theme.typography.fontWeightBold};
`

export const CommentAuthor = styled('div')`
  font-size: ${({theme}) => theme.typography.body1};
`

export const CommentVerifiedBadge = styled('div')`
  display: grid;
  align-items: center;
  color: ${({theme}) => theme.palette.info.main};
`

export const CommentFlair = styled('div')<{isGuest: boolean}>`
  font-size: 0.75em;
  font-weight: 300;

  ${({isGuest, theme}) =>
    isGuest &&
    css`
      color: ${theme.palette.primary.main};
    `}
`

export const CommentContent = styled('div')<{isTopComment?: boolean}>`
  padding: ${({theme}) => theme.spacing(1.5)};

  ${({isTopComment, theme}) =>
    isTopComment &&
    css`
      background-color: ${theme.palette.secondary.light};
    `}
`

export const CommentChildren = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  border-left: 2px solid currentColor;
  padding: ${({theme}) => theme.spacing(3)};
  padding-right: 0;
`

export const CommentActions = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
`

export const Comment = ({
  id,
  isTopComment,
  className,
  text,
  authorType,
  user,
  guestUserImage,
  guestUsername,
  title,
  source,
  children,
  createdAt,
  showContent = true
}: BuilderCommentProps) => {
  const {
    elements: {Paragraph, Image},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const [commentId, setCommentId] = useState<string | null>(null)

  useEffect(() => {
    const commentId = window.location.hash.replace('#', '')
    if (commentId) {
      setCommentId(commentId)
    }
  }, [])

  const image = user?.image ?? guestUserImage
  const isVerified = authorType === CommentAuthorType.VerifiedUser
  const isGuest = authorType === CommentAuthorType.GuestUser
  const flair = user?.flair ?? source
  const name = user ? `${user.preferredName || user.firstName} ${user.name}` : guestUsername

  return (
    <CommentWrapper className={className} id={id} highlight={commentId === id}>
      <CommentHeader isTopComment={isTopComment}>
        {image && <Image image={image} square css={avatarStyles} />}
        {!image && <MdPerson css={avatarStyles} />}

        <CommentHeaderContent>
          <CommentName>
            <CommentAuthor>{name}</CommentAuthor>

            {isVerified && (
              <CommentVerifiedBadge>
                <MdVerified title="Member" />
              </CommentVerifiedBadge>
            )}
          </CommentName>

          {flair && <CommentFlair isGuest={isGuest}>{flair}</CommentFlair>}
          {!flair && createdAt && (
            <CommentFlair isGuest={isGuest}>{formatCommentDate(createdAt)}</CommentFlair>
          )}
        </CommentHeaderContent>
      </CommentHeader>

      {showContent && (
        <CommentContent isTopComment={isTopComment}>
          {title && (
            <Paragraph component="h1" gutterBottom={false}>
              <strong>{title}</strong>
            </Paragraph>
          )}
          <RichText richText={text ?? []} />
        </CommentContent>
      )}

      {children}
    </CommentWrapper>
  )
}
