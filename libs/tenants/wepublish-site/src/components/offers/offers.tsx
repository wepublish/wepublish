import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  hasBlockStyle,
  isFilledTeaser,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  Button,
  Image,
  Link,
} from '@wepublish/website/builder';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { designText } from '../../theme';
import { BlockHeader } from '../block-header';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { secondaryButton } from '../button-styles';

export const isOffers = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.Offers)({ blockStyle });

export const OffersWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
  }
`;

export const OffersList = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(6)} 30px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  }
`;

// The button sits at the bottom, so that the buttons of offers next to each other line up
export const OffersOffer = styled('article')`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const OffersImage = styled(Image)`
  width: 100%;
  aspect-ratio: 400 / 270;
  object-fit: cover;
  margin-bottom: 35px;
`;

export const OffersTitle = styled('h3')`
  ${designText.h3 as CSSObject}
  margin: 0 0 20px;
  hyphens: manual;
`;

export const OffersText = styled('p')`
  ${designText.text as CSSObject}
  margin: 0;
  hyphens: manual;
`;

export const OffersButton = styled(Button)`
  ${({ theme }) => secondaryButton(theme)}
  margin-top: auto;
`;

const OffersButtonSpace = styled('div')`
  flex-grow: 1;
  min-height: 40px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    min-height: 60px;
  }
`;

const Offer = ({ teaser }: { teaser: FullTeaserFragment }) => {
  const { t } = useTranslation();
  const titleId = useId();
  const image = selectTeaserImage(teaser);
  const lead = selectTeaserLead(teaser);
  const url = selectTeaserUrl(teaser);

  return (
    <OffersOffer aria-labelledby={titleId}>
      {image && <OffersImage image={image} />}
      <OffersTitle id={titleId}>{selectTeaserTitle(teaser)}</OffersTitle>
      {lead && <OffersText>{lead}</OffersText>}

      {url && (
        <>
          <OffersButtonSpace />
          <OffersButton
            variant="outlined"
            disableRipple
            LinkComponent={Link}
            href={url}
            target={selectTeaserTarget(teaser) ?? undefined}
          >
            {selectTeaserPreTitle(teaser) || t('offers.readMore')}
          </OffersButton>
        </>
      )}
    </OffersOffer>
  );
};

/**
 * Offers next to each other: an optional image, the title, the text and a
 * button at the bottom, labelled with the pre-title or "Mehr erfahren".
 */
export const Offers = ({
  className,
  title,
  teasers,
}: BuilderTeaserSlotsBlockProps) => (
  <OffersWrapper className={className}>
    <BlockHeader title={title} />

    <OffersList>
      {teasers.filter(isFilledTeaser).map((teaser, index) => (
        <Offer
          key={index}
          teaser={teaser}
        />
      ))}
    </OffersList>
  </OffersWrapper>
);
