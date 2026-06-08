import styled from '@emotion/styled';
import {
  AuthorChipContent as AuthorChipContentDefault,
  AuthorChipImageWrapper as AuthorChipImageWrapperDefault,
  AuthorChipJob,
  AuthorChipName,
  AuthorChipWrapper as AuthorChipWrapperDefault,
  imageStyles,
} from '@wepublish/author/website';
import {
  BuilderAuthorChipProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const AuthorChipWrapper = styled(AuthorChipWrapperDefault)`
  display: contents;
`;

export const AuthorChipNameJobWrapper = styled('div')`
  padding: 0.2rem 0 0 0;
  grid-column: 2 / 4;
  grid-row: 1 / 2;
  display: block;
  font-size: 0.75rem;
  line-height: 1.2;
  font-weight: 700;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    padding: 1.25rem 0 0 0;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  ${AuthorChipName} {
    font-weight: 700;
    display: contents;

    & .MuiTypography-root {
      color: ${({ theme }) => theme.palette.common.black};
      text-decoration: underline;
      display: unset;
      padding: 0 0.2rem;
      margin: 0 -0.2rem 0 0;

      &:hover {
        background-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
        text-decoration: none;
      }
    }
  }

  ${AuthorChipJob} {
    padding-left: 0;
    display: contents;
  }
`;

export const AuthorChipContent = styled(AuthorChipContentDefault)`
  padding: 0.7rem 0 0 0;
  display: contents;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 1rem 0 0 0;
  }
`;

export const AuthorChipImageWrapper = styled(AuthorChipImageWrapperDefault)`
  margin-left: unset;
  width: 80px;
  grid-column: 1 / 2;
  grid-row: 1 / 4;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-row: 1 / 5;
    width: 140px;
  }
`;

const TRANSPARENT_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const AuthorChipImagePlaceholder = styled('img')`
  display: block;
  width: 100%;
  aspect-ratio: 1;
  background-color: ${({ theme }) => theme.palette.grey[100]};
`;

export function TsriAuthorChip({
  className,
  author,
  isOneOfMultipleAuthors,
  hideInfo,
}: BuilderAuthorChipProps & {
  isOneOfMultipleAuthors?: boolean;
  hideInfo?: boolean;
}) {
  const {
    AuthorLinks,
    elements: { Image, Link },
  } = useWebsiteBuilder();

  if (hideInfo) {
    return (
      <AuthorChipWrapper className={className}>
        <AuthorChipImageWrapper>
          <AuthorChipImagePlaceholder
            src={TRANSPARENT_IMAGE}
            alt=""
            aria-hidden
            css={imageStyles}
          />
        </AuthorChipImageWrapper>

        <AuthorChipContent>
          <AuthorChipNameJobWrapper>
            <AuthorChipName>Publiziert</AuthorChipName>
          </AuthorChipNameJobWrapper>
        </AuthorChipContent>
      </AuthorChipWrapper>
    );
  }

  return (
    <AuthorChipWrapper className={className}>
      {author.image && (
        <AuthorChipImageWrapper>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image
            image={author.image}
            square
            css={imageStyles}
            maxWidth={200}
          />
        </AuthorChipImageWrapper>
      )}

      <AuthorChipContent>
        {!isOneOfMultipleAuthors && (
          <AuthorChipNameJobWrapper>
            <AuthorChipName>
              Von <Link href={author.url}>{author.name}</Link>
            </AuthorChipName>

            {author.jobTitle && (
              <AuthorChipJob>{`, ${author.jobTitle}`}</AuthorChipJob>
            )}
          </AuthorChipNameJobWrapper>
        )}
        {isOneOfMultipleAuthors && (
          <>
            <AuthorChipName>
              <Link href={author.url}>{author.name}</Link>
            </AuthorChipName>

            {author.jobTitle && (
              <AuthorChipJob>{`, ${author.jobTitle}`}</AuthorChipJob>
            )}
          </>
        )}

        {!!author.links?.length && <AuthorLinks links={author.links} />}
      </AuthorChipContent>
    </AuthorChipWrapper>
  );
}
