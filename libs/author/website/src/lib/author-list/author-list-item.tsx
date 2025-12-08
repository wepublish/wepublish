import { Author } from '@wepublish/website/api';
import { css } from '@mui/material';
import styled from '@emotion/styled';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { CSSProperties } from 'react';

export const AuthorListItemImageWrapper = styled('div')`
  display: grid;
  width: 100%;
`;

export const AuthorListItemContent = styled('div')``;

const AuthorListItemLink = styled(Link)`
  display: grid;
  grid-template-rows: max-content 1fr;
  gap: ${({ theme }) => theme.spacing(3)};
  width: 240px;
  text-align: center;
  text-decoration: none;
  color: inherit;
`;

const imageStyles = css`
  border-radius: 50%;
`;

export function AuthorListItem({
  className,
  style,
  url,
  image,
  name,
  jobTitle,
}: Author & { className?: string; style?: CSSProperties }) {
  const {
    elements: { Image, Paragraph, H6 },
  } = useWebsiteBuilder();

  return (
    <AuthorListItemLink
      className={className}
      style={style}
      href={url}
    >
      <AuthorListItemImageWrapper>
        {image && (
          <Image
            image={image}
            square
            css={imageStyles}
            maxWidth={500}
          />
        )}
      </AuthorListItemImageWrapper>

      <AuthorListItemContent>
        <H6>{name}</H6>

        {jobTitle && <Paragraph gutterBottom={false}>{jobTitle}</Paragraph>}
      </AuthorListItemContent>
    </AuthorListItemLink>
  );
}
