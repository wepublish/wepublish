import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  AuthorListItemContent as AuthorListItemContentDefault,
  AuthorListItemImageWrapper as AuthorListItemImageWrapperDefault,
} from '@wepublish/author/website';
import { createWithTheme } from '@wepublish/ui';
import {
  BuilderAuthorListItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { authorListItemTheme } from '../theme';
import { ReflektRenderRichtext } from './reflekt-render-richtext';

export const AuthorListItemWrapper = styled('div')`
  display: grid;
  grid-row: span 5;
  grid-template-rows: subgrid;
  row-gap: 0;
  text-align: center;
  text-decoration: none;
  color: inherit;
  background-color: ${({ theme }) => theme.palette.secondary.main};
`;

export const AuthorListItemImageWrapper = styled(
  AuthorListItemImageWrapperDefault
)`
  img {
    border-radius: unset;
    aspect-ratio: 365 / 456;
    object-fit: cover;
  }
`;

export const ReflektAuthorListItemContent = styled(
  AuthorListItemContentDefault
)`
  display: grid;
  grid-row: 2 / span 4;
  grid-template-rows: subgrid;
  row-gap: ${({ theme }) => theme.spacing(3)};
  line-height: 1rem;
  padding: ${({ theme }) => theme.spacing(0.5, 2, 4, 2)};

  p:has(> .MuiTypography-linkAuthorListItemBio) {
    display: block;
    align-self: end;
  }
`;

export function AuthorListItem({
  className,
  image,
  name,
  bio,
  jobTitle,
}: BuilderAuthorListItemProps) {
  const {
    elements: { Image },
  } = useWebsiteBuilder();

  return (
    <AuthorListItemWrapper className={className}>
      <AuthorListItemImageWrapper>
        {image && (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image image={image} />
        )}
      </AuthorListItemImageWrapper>

      <ReflektAuthorListItemContent>
        <Typography variant="authorListItemName">{name}</Typography>

        {jobTitle && (
          <Typography
            gutterBottom={false}
            variant="authorListItemJobTitle"
          >
            {jobTitle}
          </Typography>
        )}

        {bio && (
          <ReflektRenderRichtext
            variant="authorListItemBio"
            elements={bio}
          />
        )}
      </ReflektAuthorListItemContent>
    </AuthorListItemWrapper>
  );
}

export const ReflektAuthorListItemStyled = styled(AuthorListItem)``;

export const ReflektAuthorListItem = createWithTheme(
  ReflektAuthorListItemStyled,
  authorListItemTheme
);
