import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { FullAuthorFragment } from '@wepublish/website/api';
import {
  BuilderAuthorsBlockProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useId } from 'react';

import { designText } from '../../theme';
import {
  AuthorBio,
  AuthorLinkButton,
  AuthorLinkList,
  AuthorPortrait,
  AuthorProfile,
} from '../author/author-page';
import { BlockHeader } from '../block-header';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { PersonCard, TeamMembers } from '../team/team-page';

export const isPeopleList = hasBlockStyle(WepBlockStyles.PeopleList);

export const PeopleBlockWrapper = styled('section')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
  }
`;

export const PeopleRows = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 50px;
`;

export const PersonRowText = styled('div')`
  display: grid;
  gap: 30px;
`;

export const PersonRowHeader = styled('div')`
  display: grid;
  gap: 15px;
`;

export const PersonRowName = styled('h3')`
  ${designText.h3 as CSSObject}
  margin: 0;
  hyphens: manual;

  a,
  a:hover {
    color: inherit;
    text-decoration: none;
  }
`;

export const PersonRowJob = styled('p')`
  ${designText.text as CSSObject}
  margin: 0;
  hyphens: manual;
`;

/** A person in a row: the portrait on the left, name, job title, text and links on the right */
export const PersonRow = ({ author }: { author: FullAuthorFragment }) => {
  const nameId = useId();
  const {
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  return (
    <AuthorProfile
      as="article"
      aria-labelledby={nameId}
    >
      {author.image && <AuthorPortrait image={author.image} />}

      <PersonRowText>
        <PersonRowHeader>
          <PersonRowName id={nameId}>
            <Link href={author.url}>{author.name}</Link>
          </PersonRowName>

          {author.jobTitle && <PersonRowJob>{author.jobTitle}</PersonRowJob>}
        </PersonRowHeader>

        {author.bio && (
          <AuthorBio>
            <RenderRichtext document={author.bio} />
          </AuthorBio>
        )}

        {!!author.links?.length && (
          <AuthorLinkList>
            {author.links.map(({ title, url }) => (
              <AuthorLinkButton
                key={url}
                href={url}
                target={url.startsWith('mailto:') ? undefined : '_blank'}
              >
                {title}
              </AuthorLinkButton>
            ))}
          </AuthorLinkList>
        )}
      </PersonRowText>
    </AuthorProfile>
  );
};

/**
 * The people chosen in the editor below the title of the block: in a grid as
 * on the team page, or with the block style "PeopleList" larger, one per row
 * with their text and links.
 */
export const WepAuthorsBlock = ({
  className,
  title,
  authors,
  blockStyle,
}: BuilderAuthorsBlockProps) => (
  <PeopleBlockWrapper className={className}>
    {title && <BlockHeader title={title} />}

    {isPeopleList({ blockStyle }) ?
      <PeopleRows>
        {authors.map(author => (
          <PersonRow
            key={author.id}
            author={author}
          />
        ))}
      </PeopleRows>
    : <TeamMembers>
        {authors.map(author => (
          <PersonCard
            key={author.id}
            author={author}
            nameAs="h3"
          />
        ))}
      </TeamMembers>
    }
  </PeopleBlockWrapper>
);
