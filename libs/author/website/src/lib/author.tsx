import { css } from '@mui/material';
import styled from '@emotion/styled';
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
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const AuthorImage = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const imageStyles = css`
  width: 100%;
  max-width: 500px;
`;

export function Author({
  className,
  data,
  loading,
  error,
}: BuilderAuthorProps) {
  const {
    elements: { Image, H3, H5 },
    blocks: { RichText },
    AuthorLinks,
  } = useWebsiteBuilder();

  if (!data?.author) {
    return null;
  }

  return (
    <AuthorWrapper className={className}>
      <header>
        <H3 component="h1">{data.author.name}</H3>
        {data.author.jobTitle && (
          <H5 component="aside">{data.author.jobTitle}</H5>
        )}
      </header>

      <AuthorImage>
        {data.author.image && (
          <Image
            image={data.author.image}
            fetchPriority="high"
            css={imageStyles}
          />
        )}

        {!!data.author.links?.length && (
          <AuthorLinks links={data.author.links} />
        )}
      </AuthorImage>

      <RichText richText={data.author.bio ?? []} />
    </AuthorWrapper>
  );
}
