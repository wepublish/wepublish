import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  hasBlockStyle,
  selectTeaserImage,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BuilderTeaserProps,
  BuilderTeaserSlotsBlockProps,
  Button,
  Image,
  Link,
} from '@wepublish/website/builder';

import { designText } from '../../theme';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { secondaryButton } from '../button-styles';
import { extraColumn } from '../page-columns';
import {
  TeaserSlotsTeasers,
  WepTeaserSlots,
} from '../teaser-layouts/wep-teaser-slots';

export const isTeaserCards = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.TeaserCards)({ blockStyle });

export const TeaserCards = styled(WepTeaserSlots)`
  display: block;

  ${TeaserSlotsTeasers} {
    display: grid;
    gap: 30px;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    }
  }

  // All 12 columns, as wide as the navbar
  ${({ theme }) => theme.breakpoints.up('lg')} {
    margin-inline: calc(
      -1 * ${({ theme }) => extraColumn(theme, '100%', '100vw')}
    );
  }
`;

export const TeaserCardWrapper = styled('article')`
  display: grid;
  grid-template-columns: minmax(0, 110px) minmax(0, 1fr);
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: 25px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.palette.primary.light};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: minmax(0, 196px) minmax(0, 1fr);
    gap: 50px;
  }

  // Two cards next to each other leave less room for the illustration
  ${({ theme }) => theme.breakpoints.between('md', 'lg')} {
    grid-template-columns: minmax(0, 130px) minmax(0, 1fr);
    gap: 30px;
  }
`;

export const TeaserCardImage = styled(Image)`
  width: 100%;
  height: auto;
  object-fit: contain;
`;

export const TeaserCardContent = styled('div')`
  display: grid;
  justify-items: start;
  gap: 40px;
`;

export const TeaserCardTitle = styled('h2')`
  ${designText.h3 as CSSObject}
  margin: 0;
  hyphens: manual;
`;

export const TeaserCardButton = styled(Button)`
  ${({ theme }) => secondaryButton(theme)}
`;

/**
 * An illustration next to the title and a button. The pre-title of the
 * teaser is the label of the button.
 */
export const TeaserCard = ({ teaser, className }: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const label = teaser && selectTeaserPreTitle(teaser);
  const href = teaser && selectTeaserUrl(teaser);
  const target = (teaser && selectTeaserTarget(teaser)) ?? undefined;
  const image = teaser && selectTeaserImage(teaser);

  return (
    <TeaserCardWrapper className={className}>
      {image ?
        <TeaserCardImage image={image} />
      : <span />}

      <TeaserCardContent>
        {title && <TeaserCardTitle>{title}</TeaserCardTitle>}

        {href && label && (
          <TeaserCardButton
            variant="outlined"
            disableRipple
            LinkComponent={Link}
            href={href}
            target={target}
          >
            {label}
          </TeaserCardButton>
        )}
      </TeaserCardContent>
    </TeaserCardWrapper>
  );
};
