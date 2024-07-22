import {css} from '@emotion/react'
import {styled} from '@mui/material'
import {CommentAuthorType} from '@wepublish/website/api'
import {BuilderCommentProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MdPerson, MdVerified} from 'react-icons/md'

import {format} from 'date-fns'
import {de} from 'date-fns/locale'
import {useEffect, useMemo, useState} from 'react'

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

export const CommentWrapper = styled('article')`
  display: grid;
  grid-template-rows: max-content auto;
  gap: ${({theme}) => theme.spacing(2)};

  &:target {
    border: 2px solid ${({theme}) => theme.palette.primary.main};
    border-radius: ${({theme}) => theme.spacing(2.5)};
    scroll-margin-top: ${({theme}) => theme.spacing(10)};
    padding: ${({theme}) => theme.spacing(2)};
  }
`

export const CommentHeader = styled('header')`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({theme}) => theme.spacing(2)};
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
  font-weight: ${({theme}) => theme.typography.fontWeightBold};
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

export const CommentFlairLink = styled('a')`
  text-decoration: none;
  color: ${({theme}) => theme.palette.primary.main};
`

export const CommentContent = styled('div')``

export const titleStyles = () => css`
  font-weight: 600;
`

export const Comment = ({
  id,
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
    blocks: {RichText},
    date
  } = useWebsiteBuilder()

  const [commentId, setCommentId] = useState<string | null>(null)

  const titleCss = useMemo(() => titleStyles(), [])

  useEffect(() => {
    const commentId = window.location.hash.replace('#', '')
    if (commentId) {
      setCommentId(commentId)
    }
  }, [])

  const image = user?.image ?? guestUserImage
  const isVerified = authorType === CommentAuthorType.VerifiedUser
  const isGuest = authorType === CommentAuthorType.GuestUser
  const flair = user?.flair || source
  const name = user ? `${user.preferredName || user.firstName} ${user.name}` : guestUsername

  return (
    <CommentWrapper className={className} id={id}>
      <CommentHeader>
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

          {source && (
            <CommentFlair isGuest={isGuest}>
              <CommentFlairLink href={source} target="_blank" rel="noopener noreferrer">
                {flair}
              </CommentFlairLink>
            </CommentFlair>
          )}

          {user?.flair && !source && <CommentFlair isGuest={isGuest}>{user?.flair}</CommentFlair>}

          {!flair && createdAt && (
            <CommentFlair isGuest={isGuest}>{date.format(new Date(createdAt))}</CommentFlair>
          )}
        </CommentHeaderContent>
      </CommentHeader>

      {showContent && (
        <CommentContent>
          {title && (
            <Paragraph gutterBottom={false} css={titleCss}>
              {title}
            </Paragraph>
          )}

          <RichText richText={text ?? []} />
        </CommentContent>
      )}

      {children}
    </CommentWrapper>
  )
}
