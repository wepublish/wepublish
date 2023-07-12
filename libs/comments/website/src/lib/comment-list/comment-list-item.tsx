import {css} from '@emotion/react'
import {styled} from '@mui/material'
import {Comment, CommentAuthorType, CommentState} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {MdPerson, MdVerified, MdVerifiedUser} from 'react-icons/md'

const avatarStyles = css`
  width: 46px;
  height: 46px;
  border-radius: 50%;
`

export const CommentListItemWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

export const CommentListItemHeader = styled('header')`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({theme}) => theme.spacing(2)};
  align-items: center;
`

export const CommentListItemHeaderContent = styled('div')``

export const CommentListItemName = styled('div')`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: center;
  font-weight: ${({theme}) => theme.typography.fontWeightBold};
`

export const CommentListItemVerifiedBadge = styled('div')<{isVerified: boolean; isTeam: boolean}>`
  display: grid;
  align-items: center;

  ${({theme, isVerified, isTeam}) => css`
    ${isVerified &&
    css`
      color: ${theme.palette.info.main};
    `}

    ${isTeam &&
    css`
      color: ${theme.palette.success.main};
    `}
  `}
`

export const CommentListItemFlair = styled('div')<{isGuest: boolean}>`
  font-size: 0.75em;

  ${({isGuest, theme}) =>
    isGuest &&
    css`
      color: ${theme.palette.primary.main};
    `}
`

export const CommentListItemContent = styled('div')``

export const CommentListItemChildren = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  border-left: 2px solid #000;
  padding: ${({theme}) => theme.spacing(3)};
  padding-right: 0;
`

export const CommentListItem = ({
  className,
  text,
  authorType,
  user,
  guestUserImage,
  guestUsername,
  title,
  source,
  state,
  children
}: Comment & {className?: string}) => {
  const {
    CommentListItem: BuilderCommentListItem,
    elements: {Paragraph, Image, Alert},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const image = user?.image ?? guestUserImage
  const isTeam = authorType === CommentAuthorType.Team
  const isVerified = authorType === CommentAuthorType.VerifiedUser
  const isGuest = authorType === CommentAuthorType.GuestUser
  const hasBadge = isTeam || isVerified
  const flair = user?.flair ?? source
  const name = user ? `${user.preferredName || user.firstName} ${user.name}` : guestUsername

  return (
    <CommentListItemWrapper className={className}>
      <CommentListItemHeader>
        {image && <Image image={image} square css={avatarStyles} />}
        {!image && <MdPerson css={avatarStyles} />}

        <CommentListItemHeaderContent>
          <CommentListItemName>
            {name}

            {hasBadge && (
              <CommentListItemVerifiedBadge isVerified={isVerified} isTeam={isTeam}>
                {isVerified && <MdVerified title="Member" />}
                {isTeam && <MdVerifiedUser title="Mitarbeiter:in" />}
              </CommentListItemVerifiedBadge>
            )}
          </CommentListItemName>

          {flair && <CommentListItemFlair isGuest={isGuest}>{flair}</CommentListItemFlair>}
        </CommentListItemHeaderContent>
      </CommentListItemHeader>

      {state === CommentState.PendingApproval && (
        <Alert severity="info">Kommentar wartet auf Freischaltung</Alert>
      )}

      {state === CommentState.PendingUserChanges && (
        <Alert severity="warning">Kommentar muss editiert werden.</Alert>
      )}

      {state === CommentState.Rejected && (
        <Alert severity="error">Kommentar wurde nicht freigeschalten.</Alert>
      )}

      <CommentListItemContent>
        {title && (
          <Paragraph component="h1" gutterBottom={false}>
            <strong>{title}</strong>
          </Paragraph>
        )}
        <RichText richText={text ?? []} />
      </CommentListItemContent>

      {!!children?.length && (
        <CommentListItemChildren>
          {children.map(child => (
            <BuilderCommentListItem key={child.id} {...child} className={className} />
          ))}
        </CommentListItemChildren>
      )}
    </CommentListItemWrapper>
  )
}
