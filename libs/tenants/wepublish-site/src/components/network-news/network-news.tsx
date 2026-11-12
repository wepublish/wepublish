import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  hasBlockStyle,
  isFilledTeaser,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  Image,
  Link,
} from '@wepublish/website/builder';
import { useId } from 'react';

import { designText } from '../../theme';
import { WepBlockStyles } from '../block-styles/wep-block-styles';

export const isNetworkNews = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.NetworkNews)({ blockStyle });

export const NetworkNewsWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
  }
`;

export const NetworkNewsTitle = styled('h2')`
  ${designText.h3 as CSSObject}
  margin: 0;
`;

export const NetworkNewsList = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)} 35px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 60px;
  }

  // Four next to each other only where the titles have room for it
  @media (min-width: 1250px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export const NetworkNewsItem = styled('article')`
  a,
  a:hover {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    align-items: center;
    gap: 15px;
    color: inherit;
    text-decoration: none;
  }
`;

// The image from the editor is the whole tile: the logo on the colour of the medium
export const NetworkNewsTile = styled('div')`
  height: 91px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.palette.primary.light};
`;

export const NetworkNewsLogo = styled(Image)`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const NetworkNewsText = styled('div')`
  display: grid;
  gap: 10px;
`;

// "H5" of the design: as small as the date, so that four fit next to each other
export const NetworkNewsItemTitle = styled('h3')`
  margin: 0;
  font-family: ${designText.h4.fontFamily};
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
  hyphens: manual;
`;

export const NetworkNewsDate = styled('p')`
  margin: 0;
  font-family: ${designText.textSmallMono.fontFamily};
  font-size: 0.875rem;
  line-height: 1.5;
  color: #888888;
`;

const NetworkNewsTeaser = ({ teaser }: { teaser: FullTeaserFragment }) => {
  const titleId = useId();
  const image = selectTeaserImage(teaser);
  const date = selectTeaserLead(teaser);

  return (
    <NetworkNewsItem aria-labelledby={titleId}>
      <Link
        href={selectTeaserUrl(teaser) ?? undefined}
        target={selectTeaserTarget(teaser) ?? undefined}
      >
        <NetworkNewsTile>
          {image && <NetworkNewsLogo image={image} />}
        </NetworkNewsTile>

        <NetworkNewsText>
          <NetworkNewsItemTitle id={titleId}>
            {selectTeaserTitle(teaser)}
          </NetworkNewsItemTitle>
          {date && <NetworkNewsDate>{date}</NetworkNewsDate>}
        </NetworkNewsText>
      </Link>
    </NetworkNewsItem>
  );
};

/**
 * News from the media of the network: the image of the teaser as a tile (the
 * logo of the medium on its colour), the title and the date (the lead).
 */
export const NetworkNews = ({
  className,
  title,
  teasers,
}: BuilderTeaserSlotsBlockProps) => (
  <NetworkNewsWrapper className={className}>
    {title && <NetworkNewsTitle>{title}</NetworkNewsTitle>}

    <NetworkNewsList>
      {teasers.filter(isFilledTeaser).map((teaser, index) => (
        <NetworkNewsTeaser
          key={index}
          teaser={teaser}
        />
      ))}
    </NetworkNewsList>
  </NetworkNewsWrapper>
);
