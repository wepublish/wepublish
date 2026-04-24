import { Author } from '@wepublish/website/api';
import { css } from '@mui/material';
import styled from '@emotion/styled';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';

export const AuthorListItemImageWrapper = styled('div')`
  display: grid;
  width: 100%;
  max-width: ${({ theme }) => theme.spacing(15)};
  justify-self: center;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    max-width: initial;
  }
`;

export const AuthorListItemContent = styled('div')``;

export const AuthorListItemLink = styled(Link)`
  display: grid;
  grid-template-rows: max-content 1fr;
  gap: ${({ theme }) => theme.spacing(3)};
  text-align: center;
  text-decoration: none;
  color: inherit;
`;

const imageStyles = css`
  border-radius: 50%;
`;

export function AuthorListItem({
  className,
  url,
  image,
  name,
  jobTitle,
}: Author & { className?: string }) {
  const {
    elements: { Image, Paragraph, H6 },
  } = useWebsiteBuilder();

  return (
    <AuthorListItemLink
      className={className}
      href={url}
    >
      <AuthorListItemImageWrapper>
        {image && (
          <Image
            image={image}
            square
            css={imageStyles}
            maxWidth={800}
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
