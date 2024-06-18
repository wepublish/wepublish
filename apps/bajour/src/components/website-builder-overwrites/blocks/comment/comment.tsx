import {css} from '@emotion/react'
import {styled} from '@mui/material'
import {ApiV1, BuilderCommentProps, useWebsiteBuilder} from '@wepublish/website'
import {format} from 'date-fns'
import {de} from 'date-fns/locale'
import {useEffect, useState} from 'react'
import {MdPerson, MdVerified} from 'react-icons/md'

const bajourTags = {
  QuelleAlsLink: 'Quelle als Link',
  TopKommentar: 'Top Kommentar',
  QuelleHervorheben: 'Quelle hervorheben',
  Moderation: 'Moderation'
}

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
  &:target {
    scroll-margin-top: ${({theme}) => theme.spacing(10)};
  }

  ${({highlight, theme}) =>
    highlight &&
    css`
      border: 2px solid ${theme.palette.primary.main};
      border-radius: ${theme.spacing(2.5)};
    `}
`

export const CommentHeader = styled('header')`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({theme}) => theme.spacing(2)};
  align-items: center;
  padding: ${({theme}) => theme.spacing(1.5)};
`

export const CommentHeaderContent = styled('div')``

export const CommentName = styled('div')<{highlight?: boolean}>`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: center;
  font-weight: ${({theme}) => theme.typography.fontWeightBold};

  ${({highlight, theme}) =>
    highlight &&
    css`
      color: ${theme.palette.primary.main};
    `}
`

export const CommentAuthor = styled('div')<{highlight?: boolean}>`
  font-size: ${({theme}) => theme.typography.body1};

  ${({highlight, theme}) =>
    highlight &&
    css`
      color: ${theme.palette.primary.main};
    `}
`

export const CommentVerifiedBadge = styled('div')`
  display: grid;
  align-items: center;
  color: ${({theme}) => theme.palette.info.main};
`

export const CommentFlair = styled('div')<{isGuest: boolean; highlight?: boolean}>`
  font-size: 0.75em;
  font-weight: 300;

  ${({isGuest, theme}) =>
    isGuest &&
    css`
      color: ${theme.palette.primary.main};
    `}

  ${({highlight, theme}) =>
    highlight &&
    css`
      color: ${theme.palette.primary.main};
    `}
`

export const CommentContent = styled('div')<{highlight?: boolean}>`
  padding: ${({theme}) => theme.spacing(1.5)};

  ${({highlight, theme}) =>
    highlight &&
    css`
      color: ${theme.palette.primary.main};
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

export const CommentFlairLink = styled('a')`
  text-decoration: none;
  color: ${({theme}) => theme.palette.primary.main};
`

export const BajourComment = ({
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
  tags,
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
  const isVerified = authorType === ApiV1.CommentAuthorType.VerifiedUser
  const isGuest = authorType === ApiV1.CommentAuthorType.GuestUser
  const flair = user?.flair ?? source
  const name = user ? `${user.preferredName || user.firstName} ${user.name}` : guestUsername

  const sourceAsLinkTag = tags.some((tag: ApiV1.Tag) => tag.tag === bajourTags.QuelleAlsLink)
  const highlightSourceTag = tags.some((tag: ApiV1.Tag) => tag.tag === bajourTags.QuelleHervorheben)
  const topCommentTag = tags.some((tag: ApiV1.Tag) => tag.tag === bajourTags.TopKommentar)
  const moderationTag = tags.some((tag: ApiV1.Tag) => tag.tag === bajourTags.Moderation)

  const renderFlair = (flair: string, isGuest: boolean) => {
    const isUrl = (str: string) => {
      try {
        new URL(str)
        return true
      } catch {
        return false
      }
    }

    if (isUrl(flair)) {
      if (sourceAsLinkTag) {
        return (
          <CommentFlair isGuest={isGuest} highlight={moderationTag}>
            <CommentFlairLink href={flair} target="_blank" rel="noopener noreferrer">
              {flair}
            </CommentFlairLink>
          </CommentFlair>
        )
      }
    }

    return (
      <CommentFlair isGuest={isGuest} highlight={highlightSourceTag || moderationTag}>
        {flair}
      </CommentFlair>
    )
  }

  return (
    <CommentWrapper className={className} id={id} highlight={topCommentTag}>
      <CommentHeader>
        {image && <Image image={image} square css={avatarStyles} />}
        {!image && <MdPerson css={avatarStyles} />}

        <CommentHeaderContent>
          <CommentName highlight={moderationTag}>
            <CommentAuthor highlight={moderationTag}>{name}</CommentAuthor>

            {isVerified && (
              <CommentVerifiedBadge>
                <MdVerified title="Member" />
              </CommentVerifiedBadge>
            )}
          </CommentName>

          {flair && renderFlair(flair, isGuest)}
          {!flair && createdAt && (
            <CommentFlair isGuest={isGuest} highlight={highlightSourceTag || moderationTag}>
              {formatCommentDate(createdAt)}
            </CommentFlair>
          )}
        </CommentHeaderContent>
      </CommentHeader>

      {showContent && (
        <CommentContent highlight={moderationTag}>
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
