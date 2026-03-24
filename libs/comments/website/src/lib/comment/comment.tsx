import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  BuilderCommentProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdPerson } from 'react-icons/md';
import { isValidUrl } from '@wepublish/utils';

const avatarStyles = css`
  width: 46px;
  height: 46px;
  border-radius: 50%;
`;

export const CommentWrapper = styled('article')`
  display: grid;
  grid-template-rows: max-content auto;
  gap: ${({ theme }) => theme.spacing(1.5)};

  &:target {
    border: 2px solid ${({ theme }) => theme.palette.primary.main};
    border-radius: ${({ theme }) => theme.spacing(2.5)};
    scroll-margin-top: ${({ theme }) => theme.spacing(10)};
    padding: ${({ theme }) => theme.spacing(2)};
  }
`;

export const CommentHeader = styled('header')`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const CommentHeaderContent = styled('div')``;

export const CommentName = styled('div')`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
  font-weight: ${({ theme }) => theme.typography.fontWeightBold};
`;

export const CommentAuthor = styled('div')`
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  font-weight: ${({ theme }) => theme.typography.fontWeightBold};
`;

export const CommentFlair = styled('div')`
  font-size: 0.75em;
  font-weight: 300;
`;

export const CommentFlairLink = styled('a')`
  text-decoration: none;
  color: ${({ theme }) => theme.palette.primary.main};
`;

export const CommentContent = styled('div')``;

export const CommentTitle = styled('h1')`
  && {
    font-weight: 600;
  }
`;

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
  includeAnchor = true,
}: BuilderCommentProps) => {
  const {
    elements: { Paragraph, Image },
    blocks: { RichText },
    date,
  } = useWebsiteBuilder();

  const flair = user?.flair || source;
  const image = user?.image ?? guestUserImage;
  const name =
    user ?
      user.firstName ?
        `${user.firstName} ${user.name}`
      : user.name
    : guestUsername;

  return (
    <CommentWrapper
      className={className}
      id={includeAnchor ? id : undefined}
    >
      <CommentHeader>
        {image && (
          <Image
            image={image}
            square
            css={avatarStyles}
          />
        )}
        {!image && <MdPerson css={avatarStyles} />}

        <CommentHeaderContent>
          <CommentName>
            <CommentAuthor>{name}</CommentAuthor>
          </CommentName>

          {source && isValidUrl(source) && (
            <CommentFlair>
              <CommentFlairLink
                href={source}
                target="_blank"
                rel="noopener noreferrer"
              >
                {flair}
              </CommentFlairLink>
            </CommentFlair>
          )}
          {!isValidUrl(source ?? '') && flair && (
            <CommentFlair>{flair}</CommentFlair>
          )}
          {createdAt && (
            <CommentFlair>{date.format(new Date(createdAt))}</CommentFlair>
          )}
        </CommentHeaderContent>
      </CommentHeader>

      {showContent && (
        <CommentContent>
          {title && (
            <Paragraph
              component={CommentTitle}
              gutterBottom={false}
            >
              {title}
            </Paragraph>
          )}

          <RichText richText={text ?? []} />
        </CommentContent>
      )}

      {children}
    </CommentWrapper>
  );
};
