import styled from '@emotion/styled';
import { css } from '@mui/material';
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
  width: 50px;
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

export const avatarImageStyles = css`
  border-radius: 50%;
`;

export function OnlineReportsAuthorChip({
  className,
  author,
}: BuilderAuthorChipProps) {
  const {
    AuthorLinks,
    elements: { Image, Link },
  } = useWebsiteBuilder();

  return (
    <>
      {author.image && (
        <AuthorChipImageWrapper>
          <Image
            image={author.image}
            square
            css={avatarImageStyles}
            maxWidth={200}
          />
        </AuthorChipImageWrapper>
      )}

      <div>
        <AuthorChipName>
          Von <Link href={author.url}>{author.name}</Link>
        </AuthorChipName>

        {author.jobTitle && <AuthorChipJob>{author.jobTitle}</AuthorChipJob>}
      </div>
    </>
  );
}
