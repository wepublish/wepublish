import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { FullAuthorFragment } from '@wepublish/website/api';
import { Image, Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { designText } from '../../theme';
import { pageBottomSpace } from '../article-list/article-overview';
import { tertiaryButton } from '../button-styles';

export const TeamPageWrapper = styled('div')`
  ${({ theme }) => pageBottomSpace(theme)}
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(8)};

  // As much room below the navbar as a page that opens with a title block
  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 120px;
    padding-top: 60px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-top: 100px;
  }
`;

// Four next to each other on large screens, fewer where the e-mail would not fit
export const TeamMembers = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 50px 30px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 60px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export const TeamMember = styled('article')`
  display: grid;
  align-content: start;
  gap: 30px;
`;

export const TeamMemberPortrait = styled(Image)`
  width: 100%;
  aspect-ratio: 500 / 667;
  object-fit: cover;
`;

export const TeamMemberText = styled('div')`
  display: grid;
  justify-items: start;
`;

export const TeamMemberName = styled('h2')`
  ${designText.h3 as CSSObject}
  margin: 0;
  hyphens: manual;

  a,
  a:hover {
    color: inherit;
    text-decoration: none;
  }
`;

export const TeamMemberJob = styled('p')`
  ${designText.text as CSSObject}
  margin: 15px 0 0;
  hyphens: manual;
`;

export const TeamMemberMail = styled(Link)`
  ${({ theme }) => tertiaryButton(theme)}
  max-width: 100%;
  margin-top: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const mailOf = ({ links }: FullAuthorFragment) =>
  links?.find(({ url }) => url.startsWith('mailto:'))?.url;

const Member = ({ author }: { author: FullAuthorFragment }) => {
  const nameId = useId();
  const mail = mailOf(author);

  return (
    <TeamMember aria-labelledby={nameId}>
      {author.image && <TeamMemberPortrait image={author.image} />}

      <TeamMemberText>
        <TeamMemberName id={nameId}>
          <Link href={author.url}>{author.name}</Link>
        </TeamMemberName>

        {author.jobTitle && <TeamMemberJob>{author.jobTitle}</TeamMemberJob>}

        {mail && (
          <TeamMemberMail href={mail}>
            {mail.replace(/^mailto:/, '')}
          </TeamMemberMail>
        )}
      </TeamMemberText>
    </TeamMember>
  );
};

/**
 * The team: the title of the page and every person not hidden from it, with
 * portrait, name (linked to the page of the person), job title and the
 * e-mail address of a "mailto:" link as button.
 */
export const WepTeamPage = ({ authors }: { authors: FullAuthorFragment[] }) => {
  const { t } = useTranslation();
  const {
    blocks: { Title },
  } = useWebsiteBuilder();

  return (
    <TeamPageWrapper>
      <Title
        __typename="TitleBlock"
        blockStyle={null}
        preTitle={t('teamPage.preTitle')}
        title={t('teamPage.title')}
        lead={t('teamPage.lead')}
      />

      <TeamMembers>
        {authors
          .filter(author => !author.hideOnTeam)
          .map(author => (
            <Member
              key={author.id}
              author={author}
            />
          ))}
      </TeamMembers>
    </TeamPageWrapper>
  );
};
