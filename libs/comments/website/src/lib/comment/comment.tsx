import {css} from '@emotion/react'
import {styled} from '@mui/material'
import {CommentAuthorType} from '@wepublish/website/api'
import {BuilderCommentProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MdPerson, MdVerified} from 'react-icons/md'
import {isValidUrl} from '@wepublish/utils'

const avatarStyles = css`
  width: 46px;
  height: 46px;
  border-radius: 50%;
`

export const CommentWrapper = styled('article')`
  display: grid;
  grid-template-rows: max-content auto;

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

export const CommentFlair = styled('div')`
  font-size: 0.75em;
  font-weight: 300;
`

export const Source = styled('p')`
  margin: 0;
`

export const CommentFlairLink = styled('a')`
  text-decoration: none;
  color: ${({theme}) => theme.palette.primary.main};
`

export const CommentContent = styled('div')`
  padding-top: ${({theme}) => theme.spacing(1)};
`

export const CommentTitle = styled('h1')`
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
  showContent = true,
  tags
}: BuilderCommentProps) => {
  const {
    elements: {Paragraph, Image},
    blocks: {RichText},
    date
  } = useWebsiteBuilder()

  const sourceFlairDate = source || user?.flair || date.format(new Date(createdAt))
  const image = user?.image ?? guestUserImage
  const isVerified = authorType === CommentAuthorType.VerifiedUser
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

          <CommentFlair>
            {isValidUrl(sourceFlairDate) ? (
              <CommentFlairLink href={sourceFlairDate} target="_blank" rel="noopener noreferrer">
                {sourceFlairDate}
              </CommentFlairLink>
            ) : (
              sourceFlairDate
            )}
          </CommentFlair>
        </CommentHeaderContent>
      </CommentHeader>

      {showContent && (
        <CommentContent>
          {title && (
            <Paragraph gutterBottom={false} component={CommentTitle}>
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
