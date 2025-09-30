import styled from '@emotion/styled';
import {
  BuilderAuthorListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const AuthorListWrapper = styled('article')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing(4)};
  justify-items: center;
`;

export const AuthorList = ({ data, className }: BuilderAuthorListProps) => {
  const { AuthorListItem } = useWebsiteBuilder();

  return (
    <AuthorListWrapper className={className}>
      {data?.authors?.nodes.map(author => (
        <AuthorListItem
          key={author.id}
          {...author}
        />
      ))}
    </AuthorListWrapper>
  );
};
