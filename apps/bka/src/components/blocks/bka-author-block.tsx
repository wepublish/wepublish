import styled from '@emotion/styled';
import {
  BuilderAuthorBlockProps,
  Image,
  Link,
  RenderRichtext,
} from '@wepublish/website/builder';
import z from 'zod';

export const BkaAuthorBlockWrapper = styled('div')`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};
`;

export const BkaAuthorBlockImageWrapper = styled('div')`
  flex-shrink: 0;
  width: 114px;
  aspect-ratio: 10 / 14;
  margin-right: ${({ theme }) => theme.spacing(3)};
  overflow: hidden;
`;

export const BkaAuthorBlockImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const BkaAuthorBlockBody = styled('div')`
  flex-grow: 1;
`;

export const BkaAuthorBlockName = styled('div')`
  font-weight: 700;
`;

export const BkaAuthorBlockJobTitle = styled('div')``;

export const BkaAuthorBlockBio = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(2)};

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

export const BkaAuthorBlock = ({
  authorObj: author,
  className,
}: BuilderAuthorBlockProps) => {
  if (!author) {
    return null;
  }

  const email = author.links?.find(
    link => z.string().email().safeParse(link.url).success
  )?.url;

  return (
    <BkaAuthorBlockWrapper className={className}>
      {author.image && (
        <BkaAuthorBlockImageWrapper>
          <BkaAuthorBlockImage image={author.image} />
        </BkaAuthorBlockImageWrapper>
      )}

      <BkaAuthorBlockBody>
        <BkaAuthorBlockName>{author.name.trim()}</BkaAuthorBlockName>

        {author.jobTitle && (
          <BkaAuthorBlockJobTitle>{author.jobTitle}</BkaAuthorBlockJobTitle>
        )}

        {email && <Link href={`mailto:${email}`}>{email}</Link>}

        {author.bio && (
          <BkaAuthorBlockBio>
            <RenderRichtext document={author.bio} />
          </BkaAuthorBlockBio>
        )}
      </BkaAuthorBlockBody>
    </BkaAuthorBlockWrapper>
  );
};
