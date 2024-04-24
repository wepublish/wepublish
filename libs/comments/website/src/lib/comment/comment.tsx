import {css} from '@emotion/react'
import {styled} from '@mui/material'
import {CommentAuthorType} from '@wepublish/website/api'
import {BuilderCommentProps, useWebsiteBuilder} from '@wepublish/website/builder'
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

  // Create a date object from the ISO string
  const date = new Date(isoDateString)

  // Extract the components of the date
  const day = date.getDate()
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  // Format the hours and minutes
  let hours = date.getHours()
  let minutes = date.getMinutes()

  // Padding with '0' if necessary to always have two digits
  hours = hours < 10 ? `0${hours}` : hours
  minutes = minutes < 10 ? `0${minutes}` : minutes

  // Construct the formatted date string
  const formattedDate = `${day}. ${monthNames[monthIndex]} ${year} | ${hours}:${minutes}`

  return formattedDate
}

const avatarStyles = css`
  width: 46px;
  height: 46px;
  border-radius: 50%;
`

export const CommentWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
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

export const CommentVerifiedBadge = styled('div')`
  display: grid;
  align-items: center;
  color: ${({theme}) => theme.palette.info.main};
`

export const CommentFlair = styled('div')<{isGuest: boolean}>`
  font-size: 0.75em;

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
    <CommentWrapper className={className}>
      <CommentHeader>
        {image && <Image image={image} square css={avatarStyles} />}
        {!image && <MdPerson css={avatarStyles} />}

        <CommentHeaderContent>
          <CommentName>
            {name}

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
