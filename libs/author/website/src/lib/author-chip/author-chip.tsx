import { css } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderAuthorChipProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const AuthorChipWrapper = styled('div')`
  display: flex;
  flex-flow: row wrap;
  align-items: end;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

export const AuthorChipImageWrapper = styled('div')`
  display: grid;
  width: 60px;
`;

export const AuthorChipContent = styled('div')`
  flex: 1;
  display: flex;
  flex-flow: row wrap;
  align-items: end;
  justify-content: space-between;
`;

export const AuthorChipName = styled('div')`
  font-weight: 500;
`;

export const AuthorChipJob = styled('div')``;

const imageStyles = css`
  border-radius: 50%;
`;

export function AuthorChip({ className, author }: BuilderAuthorChipProps) {
  const {
    AuthorLinks,
    elements: { Image, Link },
  } = useWebsiteBuilder();

  return (
    <AuthorChipWrapper className={className}>
      {author.image && (
        <AuthorChipImageWrapper>
          <Image
            image={author.image}
            square
            css={imageStyles}
            maxWidth={200}
          />
        </AuthorChipImageWrapper>
      )}

      <AuthorChipContent>
        <div>
          <AuthorChipName>
            Von <Link href={author.url}>{author.name}</Link>
          </AuthorChipName>

          {author.jobTitle && <AuthorChipJob>{author.jobTitle}</AuthorChipJob>}
        </div>

        {!!author.links?.length && <AuthorLinks links={author.links} />}
      </AuthorChipContent>
    </AuthorChipWrapper>
  );
}
