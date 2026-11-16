import styled from '@emotion/styled';
import {
  FullAuthorsBlockFragment,
  FullBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderAuthorsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const isAuthorsBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullAuthorsBlockFragment => block.__typename === 'AuthorsBlock';

export const AuthorsBlockWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
`;

export const AuthorsBlockAuthors = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
`;

/** The chosen authors (e.g. the team) below the title of the block */
export const AuthorsBlock = ({
  title,
  authors,
  className,
}: BuilderAuthorsBlockProps) => {
  const {
    AuthorListItem,
    elements: { H3 },
  } = useWebsiteBuilder();

  return (
    <AuthorsBlockWrapper className={className}>
      {title && <H3 component="h2">{title}</H3>}

      <AuthorsBlockAuthors>
        {authors.map(author => (
          <AuthorListItem
            key={author.id}
            {...author}
          />
        ))}
      </AuthorsBlockAuthors>
    </AuthorsBlockWrapper>
  );
};
