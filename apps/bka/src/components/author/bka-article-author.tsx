import styled from '@emotion/styled';
import { FullAuthorFragment } from '@wepublish/website/api';
import { AuthorLinks, Image, RenderRichtext } from '@wepublish/website/builder';

export const BkaArticleAuthorWrapper = styled('div')`
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing(0.5)};
  font-size: 1.25rem;
  line-height: ${({ theme }) => theme.typography.body2.lineHeight};
`;

export const BkaArticleAuthorImageWrapper = styled('div')`
  flex-shrink: 0;
  width: 115px;
  aspect-ratio: 10 / 15;
  margin-right: ${({ theme }) => theme.spacing(3)};
  overflow: hidden;
`;

export const BkaArticleAuthorImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const BkaArticleAuthorBody = styled('div')`
  flex-grow: 1;
  padding: ${({ theme }) => theme.spacing(1)} 0;
`;

export const BkaArticleAuthorName = styled('div')`
  font-weight: 700;
`;

export const BkaArticleAuthorJobTitle = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

export const BkaArticleAuthorBio = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(1)};

  p {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    text-wrap: wrap;
    hyphens: manual;
    word-break: normal;
    overflow-wrap: normal;
  }
`;

export type BkaArticleAuthorProps = {
  author: FullAuthorFragment;
  className?: string;
};

export const BkaArticleAuthor = ({
  author,
  className,
}: BkaArticleAuthorProps) => (
  <BkaArticleAuthorWrapper className={className}>
    {author.image && (
      <BkaArticleAuthorImageWrapper>
        <BkaArticleAuthorImage image={author.image} />
      </BkaArticleAuthorImageWrapper>
    )}

    <BkaArticleAuthorBody>
      <BkaArticleAuthorName>{author.name.trim()}</BkaArticleAuthorName>

      {author.jobTitle && (
        <BkaArticleAuthorJobTitle>{author.jobTitle}</BkaArticleAuthorJobTitle>
      )}

      {author.bio && (
        <BkaArticleAuthorBio>
          <RenderRichtext document={author.bio} />
        </BkaArticleAuthorBio>
      )}

      {!!author.links?.length && <AuthorLinks links={author.links} />}
    </BkaArticleAuthorBody>
  </BkaArticleAuthorWrapper>
);
