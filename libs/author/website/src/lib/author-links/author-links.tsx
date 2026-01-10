import styled from '@emotion/styled';
import { BuilderAuthorLinksProps, Link } from '@wepublish/website/builder';
import { useWebsiteBuilder } from '@wepublish/website/builder';

export const AuthorLinksWrapper = styled('aside')`
  display: grid;
  grid-auto-columns: max-content;
  grid-auto-flow: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const AuthorLink = styled(Link)`
  display: grid;
`;

export function AuthorLinks({ links, className }: BuilderAuthorLinksProps) {
  const { TextToIcon } = useWebsiteBuilder();
  return (
    <AuthorLinksWrapper className={className}>
      {links.map((link, index) => (
        <AuthorLink
          key={index}
          href={link.url}
          target="__blank"
          title={link.title}
        >
          <TextToIcon
            title={link.title}
            size={22}
          />
        </AuthorLink>
      ))}
    </AuthorLinksWrapper>
  );
}
