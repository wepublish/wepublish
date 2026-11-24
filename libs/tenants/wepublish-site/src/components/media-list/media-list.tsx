import styled from '@emotion/styled';
import {
  hasBlockStyle,
  isFilledTeaser,
  selectTeaserLead,
  selectTeaserPreTitle,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';

import { BlockHeader } from '../block-header';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { PlainList, PlainListEntry } from '../plain-list/plain-list';

export const isMediaList = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.MediaList)({ blockStyle });

export const MediaListWrapper = styled('section')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
  }
`;

/**
 * Pieces about We.Publish in other media as a plain list: each custom teaser
 * with its title, the medium (its pre-title) and the date (its lead), linked
 * to the piece in a new tab.
 */
export const MediaList = ({
  className,
  title,
  teasers,
}: BuilderTeaserSlotsBlockProps) => (
  <MediaListWrapper className={className}>
    {title && <BlockHeader title={title} />}

    <PlainList>
      {teasers.filter(isFilledTeaser).map((teaser, index) => (
        <PlainListEntry
          key={index}
          href={selectTeaserUrl(teaser)}
          target="_blank"
          title={selectTeaserTitle(teaser)}
          details={[selectTeaserPreTitle(teaser), selectTeaserLead(teaser)]}
        />
      ))}
    </PlainList>
  </MediaListWrapper>
);
