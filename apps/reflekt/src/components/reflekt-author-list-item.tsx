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
  grid-template-rows: max-content 1fr;
  gap: ${({ theme }) => theme.spacing(3)};
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

export const AuthorListItemContent = styled(AuthorListItemContentDefault)`
  line-height: 1rem;
  padding: ${({ theme }) => theme.spacing(0, 2, 4, 2)};
`;

export function AuthorListItem({
  className,
  image,
  name,
  bio,
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

      <AuthorListItemContent>
        <Typography variant="authorListItemName">{name}</Typography>

        {bio && (
          <ReflektRenderRichtext
            variant="authorListItemBio"
            elements={bio}
          />
        )}
      </AuthorListItemContent>
    </AuthorListItemWrapper>
  );
}

export const ReflektAuthorListItemStyled = styled(AuthorListItem)``;

export const ReflektAuthorListItem = createWithTheme(
  ReflektAuthorListItemStyled,
  authorListItemTheme
);
