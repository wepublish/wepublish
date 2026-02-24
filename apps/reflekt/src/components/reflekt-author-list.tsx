import styled from '@emotion/styled';
import { css, Typography } from '@mui/material';
import {
  BuilderAuthorListItemProps,
  BuilderAuthorListProps,
  Image,
} from '@wepublish/website/builder';

// ─── AuthorListItem (single card in the 3-column grid) ───────────────────────

const AuthorCard = styled('a')`
  display: grid;
  grid-template-rows: auto 1fr auto;
  text-decoration: none;
  color: inherit;
  gap: ${({ theme }) => theme.spacing(1.5)};

  &:hover img {
    filter: none;
  }
`;

const AuthorImageWrapper = styled('div')`
  aspect-ratio: 1;
  overflow: hidden;
  background-color: ${({ theme }) => theme.palette.grey[100]};
`;

const AuthorImg = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
  filter: grayscale(100%);
  transition: filter 300ms ease;
`;

const AuthorName = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.25;
`;

const AuthorJobTitle = styled(Typography)`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

export const ReflektAuthorListItem = ({
  name,
  jobTitle,
  image,
  url,
  className,
}: BuilderAuthorListItemProps) => {
  return (
    <AuthorCard
      href={url}
      className={className}
    >
      <AuthorImageWrapper>
        {image && (
          <AuthorImg
            image={image}
            maxWidth={500}
            square
          />
        )}
        {!image && (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#e0e0e0',
            }}
          />
        )}
      </AuthorImageWrapper>

      <div>
        <AuthorName>{name}</AuthorName>
        {jobTitle && <AuthorJobTitle>{jobTitle}</AuthorJobTitle>}
      </div>
    </AuthorCard>
  );
};

// ─── AuthorList (3-column grid wrapper) ──────────────────────────────────────

const AuthorListWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const AuthorGrid = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(3)};
  grid-template-columns: 1fr 1fr;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(3, 1fr);
    }
  `}
`;

export const ReflektAuthorList = ({
  data,
  className,
}: BuilderAuthorListProps) => {
  const authors = data?.authors?.nodes ?? [];

  return (
    <AuthorListWrapper className={className}>
      <AuthorGrid>
        {authors.map(author => (
          <ReflektAuthorListItem
            key={author.id}
            {...author}
          />
        ))}
      </AuthorGrid>
    </AuthorListWrapper>
  );
};
