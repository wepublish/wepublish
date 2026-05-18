import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  AuthorListItemContent as AuthorListItemContentDefault,
  AuthorListItemImageWrapper as AuthorListItemImageWrapperDefault,
  AuthorListItemLink as AuthorListItemLinkDefault,
} from '@wepublish/author/website';
import { createWithTheme } from '@wepublish/ui';
import {
  BuilderAuthorListItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { authorListItemTheme } from '../theme';

export const AuthorListItemLink = styled(AuthorListItemLinkDefault)`
  &:hover {
    & h6 {
      background-color: ${({ theme }) => theme.palette.primary.light};
      text-decoration: none;
    }
  }
`;

export const AuthorListItemImageWrapper = styled(
  AuthorListItemImageWrapperDefault
)`
  img {
    border-radius: 50%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
  }
`;

export const AuthorListItemContent = styled(AuthorListItemContentDefault)`
  line-height: 1rem;
`;

export function AuthorListItem({
  className,
  url,
  image,
  name,
  jobTitle,
}: BuilderAuthorListItemProps) {
  const {
    elements: { Image },
  } = useWebsiteBuilder();

  return (
    <AuthorListItemLink
      className={className}
      href={url}
    >
      <AuthorListItemImageWrapper>
        {image && (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image image={image} />
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
