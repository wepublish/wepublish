import { css } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderAuthorChipProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const ArticleAuthorWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const ArticleAuthorAuthorWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  align-items: end;
`;

export const ArticleAuthorMetaWrapper = styled('div')`
  display: grid;
  justify-content: space-between;
  align-items: center;

  p {
    font-weight: 300;
  }
`;

export const ArticleAuthorImageWrapper = styled('div')`
  display: grid;
  width: ${({ theme }) => theme.spacing(10)};
  margin-left: ${({ theme }) => `-${theme.spacing(5)}`};

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: ${({ theme }) => theme.spacing(15)};
    margin-left: ${({ theme }) => `-${theme.spacing(7.5)}`};
  }
`;

export const ArticleAuthorName = styled('div')`
  font-weight: 300;
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
`;

const imageStyles = css`
  border-radius: 50%;
`;

export function ArticleAuthor({ className, author }: BuilderAuthorChipProps) {
  const {
    AuthorLinks,
    elements: { Image, Link },
    blocks: { RichText },
  } = useWebsiteBuilder();

  return (
    <ArticleAuthorWrapper className={className}>
      {author.image && (
        <ArticleAuthorImageWrapper>
          <Image
            image={author.image}
            square
            css={imageStyles}
            maxWidth={200}
          />
        </ArticleAuthorImageWrapper>
      )}

      <ArticleAuthorName>
        <Link
          href={author.url}
          underline="none"
          color="inherit"
        >
          {author.name}
        </Link>
      </ArticleAuthorName>

      <ArticleAuthorMetaWrapper>
        {author.bio && <RichText richText={author.bio} />}
      </ArticleAuthorMetaWrapper>

      <ArticleAuthorMetaWrapper>
        {!!author.links?.length && <AuthorLinks links={author.links} />}
      </ArticleAuthorMetaWrapper>
    </ArticleAuthorWrapper>
  );
}
