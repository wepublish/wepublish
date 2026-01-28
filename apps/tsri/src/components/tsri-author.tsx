import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  BuilderAuthorProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto';
  }
}

export const AuthorWrapper = styled('article')`
  grid-column: -1 / 1;
  display: grid;
  padding: ${({ theme }) => theme.spacing(3)} 0 0 0;
  grid-template-columns: var(--two-column-grid);
  row-gap: ${({ theme }) => theme.spacing(2)};
`;

export const AuthorImage = styled('div')`
  display: grid;
  grid-column: 1 / 2;
  width: 100%;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const imageStyles = css`
  width: 100%;
  object-position: unset;
  max-height: unset;
  border-radius: 0.8rem;
`;

export const RichTextWrapper = styled('div')`
  grid-column: 1 / 2;

  p {
    font-size: 1rem !important;
    line-height: 1.5rem !important;
    font-weight: 400 !important;
  }

  a:hover {
    background-color: ${({ theme }) => theme.palette.primary.light};
    color: ${({ theme }) => theme.palette.common.black};
    text-decoration: none;
  }
`;

const richTextStyles = css`
  display: block;
`;

const authorLinkStyles = css`
  margin: 0 0 40px 0;
  grid-column: 1 / 2;
`;

const AuthorHeading = styled('h1')`
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
  font-weight: 700 !important;
`;

export function TsriAuthor({
  className,
  data,
  loading,
  error,
}: BuilderAuthorProps) {
  const {
    elements: { Image, H3 },
    blocks: { RichText },
    AuthorLinks,
  } = useWebsiteBuilder();

  if (!data?.author) {
    return null;
  }

  return (
    <AuthorWrapper className={className}>
      <header>
        <H3 component={AuthorHeading}>
          {data.author.name}
          {data.author.jobTitle && `, ${data.author.jobTitle}`}
        </H3>
      </header>

      <AuthorImage>
        {data.author.image && (
          <Image
            image={data.author.image}
            fetchPriority="high"
            css={imageStyles}
          />
        )}
      </AuthorImage>

      <RichTextWrapper>
        <RichText
          richText={data.author.bio ?? []}
          css={richTextStyles}
        />
      </RichTextWrapper>

      {!!data.author.links?.length && (
        <AuthorLinks
          css={authorLinkStyles}
          links={data.author.links}
        />
      )}
    </AuthorWrapper>
  );
}
