import styled from '@emotion/styled';
import { css, Typography } from '@mui/material';
import {
  AuthorListItemContent as AuthorListItemContentDefault,
  AuthorListItemImageWrapper,
  AuthorListItemLink as AuthorListItemLinkDefault,
} from '@wepublish/author/website';
import { createWithTheme } from '@wepublish/ui';
import { Author } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { authorListItemTheme } from '../theme';

export const AuthorListItemLink = styled(AuthorListItemLinkDefault)`
  &:hover {
    & h6 {
      background-color: ${({ theme }) => theme.palette.primary.light};
      text-decoration: none;
    }
  }
`;

export const AuthorListItemContent = styled(AuthorListItemContentDefault)`
  line-height: 1rem;
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
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image
            image={image}
            square
            css={imageStyles}
            maxWidth={500}
          />
        )}
      </AuthorListItemImageWrapper>

      <AuthorListItemContent>
        <Typography variant="authorListItemName">{name}</Typography>

        {jobTitle && (
          <Typography
            gutterBottom={false}
            variant="authorListItemJobTitle"
          >
            {jobTitle}
          </Typography>
        )}
      </AuthorListItemContent>
    </AuthorListItemLink>
  );
}

export const TsriAuthorListItemStyled = styled(AuthorListItem)``;

export const TsriAuthorListItem = createWithTheme(
  TsriAuthorListItemStyled,
  authorListItemTheme
);
