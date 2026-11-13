import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  hasBlockStyle,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BuilderTeaserProps,
  BuilderTeaserSlotsBlockProps,
  Button,
  Link,
} from '@wepublish/website/builder';

import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { tertiaryButton } from '../button-styles';
import {
  TeaserSlotsTeasers,
  WepTeaserSlots,
} from '../teaser-layouts/wep-teaser-slots';
import { heroBackground, HeroWrapper } from './hero';

export const isHeroLinks = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.HeroLinks)({ blockStyle });

// Space between the hero and its links, smaller than the gap between blocks
const heroGap = { xs: 5, md: 15 };

export const HeroLinks = styled(WepTeaserSlots)`
  // Covers the space to the hero above (1px more against a hairline seam)
  ${({ theme }) =>
    heroBackground(theme, `calc(${theme.spacing(heroGap.xs)} + 1px)`)}
  display: block;
  padding-bottom: ${({ theme }) => theme.spacing(8)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    ${({ theme }) =>
      heroBackground(theme, `calc(${theme.spacing(heroGap.md)} + 1px)`)}
    padding-bottom: ${({ theme }) => theme.spacing(16)};
  }

  // Closer to the hero than blocks are to each other (every block sits in its own container)
  *:has(> ${HeroWrapper}) + *:has(> &) {
    margin-top: ${({ theme }) => theme.spacing(heroGap.xs)};

    ${({ theme }) => theme.breakpoints.up('md')} {
      margin-top: ${({ theme }) => theme.spacing(heroGap.md)};
    }
  }

  // Below each other: the titles in one column, the buttons right aligned in a
  // second one, at least 30px away from the longest title
  ${TeaserSlotsTeasers} {
    display: grid;
    grid-template-columns: max-content max-content;
    justify-content: start;
    column-gap: 30px;
    row-gap: ${({ theme }) => theme.spacing(4)};

    ${({ theme }) => theme.breakpoints.up('md')} {
      display: flex;
      flex-direction: row;
      gap: 50px;
    }
  }
`;

export const HeroLinkWrapper = styled('article')`
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: end;

  // Title above the button, so that the three links fit next to each other
  ${({ theme }) => theme.breakpoints.up('md')} {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 15px;

    & + & {
      border-left: 1px solid ${({ theme }) => theme.palette.common.black};
      padding-left: 50px;
    }
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    flex-direction: row;
    align-items: flex-end;
    gap: 30px;
  }
`;

export const HeroLinkTitle = styled('h2')`
  margin: 0;
  // As wide as the longest word: "Gründen &" / "Transformieren"
  width: min-content;
  hyphens: manual;
  word-break: normal;
`;

export const HeroLinkButton = styled(Button)`
  ${({ theme }) => tertiaryButton(theme)}
  flex-shrink: 0;
  // Right aligned in the column of the buttons on small screens
  justify-self: end;
`;

export const HeroLink = ({ teaser, className }: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const label = teaser && selectTeaserPreTitle(teaser);
  const href = teaser && selectTeaserUrl(teaser);
  const target = (teaser && selectTeaserTarget(teaser)) ?? undefined;

  return (
    <HeroLinkWrapper className={className}>
      {title && (
        <Typography
          variant="h4"
          component={HeroLinkTitle}
        >
          {title}
        </Typography>
      )}

      {href && label && (
        <HeroLinkButton
          variant="outlined"
          disableRipple
          LinkComponent={Link}
          href={href}
          target={target}
        >
          {label}
        </HeroLinkButton>
      )}
    </HeroLinkWrapper>
  );
};
