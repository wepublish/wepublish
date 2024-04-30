import {css} from '@emotion/react'
import {styled} from '@mui/material'
import {CommentAuthorType} from '@wepublish/website/api'
import {BuilderCommentProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useLayoutEffect, useState} from 'react'
import {MdPerson, MdVerified} from 'react-icons/md'

function formatCommentDate(isoDateString: string) {
  const monthNames = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember'
  ]

  const date: Date = new Date(isoDateString)

  const day: number = date.getDate()
  const monthIndex: number = date.getMonth()
  const year: number = date.getFullYear()

  const hours: number = date.getHours()
  const minutes: number = date.getMinutes()

  const paddedHours: string = hours < 10 ? `0${hours}` : `${hours}`
  const paddedMinutes: string = minutes < 10 ? `0${minutes}` : `${minutes}`

  const formattedDate = `${day}. ${monthNames[monthIndex]} ${year} | ${paddedHours}:${paddedMinutes}`

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
      border-radius: ${theme.spacing(1)};
    `}
`

export const CommentHeader = styled('header')`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({theme}) => theme.spacing(2)};
  align-items: center;
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
  font-family: ${({theme}) => theme.typography.subtitle2.fontFamily};
  font-size: 17px;

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      font-size: 21px;
    }
  `}

  ${({theme}) => css`
    ${theme.breakpoints.up('xl')} {
      font-size: 24px;
    }
  `}
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

export const CommentContent = styled('div')``

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

  const [goToComment, setGoToComment] = useState<string | null>(null)

  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const commentId = searchParams.get('goToComment')

      if (commentId) {
        setGoToComment(commentId)
        const element = document.getElementById(commentId)
        if (element) {
          const elementRect = element.getBoundingClientRect()
          const absoluteElementTop = elementRect.top + window.pageYOffset
          const offsetPosition = absoluteElementTop - 200

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }
    }
  }, [])

  const image = user?.image ?? guestUserImage
  const isVerified = authorType === CommentAuthorType.VerifiedUser
  const isGuest = authorType === CommentAuthorType.GuestUser
  const flair = user?.flair ?? source
  const name = user ? `${user.preferredName || user.firstName} ${user.name}` : guestUsername

  const displayFlairOrDate = () => {
    if (flair) {
      return <CommentFlair isGuest={isGuest}>{flair}</CommentFlair>
    } else if (createdAt) {
      return <CommentFlair isGuest={isGuest}>{formatCommentDate(createdAt)}</CommentFlair>
    } else {
      return null
    }
  }

  return (
    <CommentWrapper key={goToComment} className={className} id={id} highlight={goToComment === id}>
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

          {displayFlairOrDate()}
        </CommentHeaderContent>
      </CommentHeader>

      {showContent && (
        <CommentContent>
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
